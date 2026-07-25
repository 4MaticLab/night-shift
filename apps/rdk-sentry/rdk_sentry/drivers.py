"""40PIN I2C 传感器驱动：SHT3x 温湿度 + SGP30 空气质量，可选 PMS5003 颗粒物。

设计原则「探测-降级」：任何一路硬件缺席（没接线 / 地址不对 / 读失败）都只让
对应字段变成 None，绝不让哨站崩溃。桌宠端会用占位数据补齐缺口并标注降级。

依赖 smbus2（板上 `pip install smbus2`）；PMS5003 走 UART 需 pyserial，均为懒加载。
"""

from __future__ import annotations

import time
from typing import Any, Optional

I2C_BUS_DEFAULT = 5  # RDK X5 40PIN 对外 I2C 总线号（以 `ls /dev/i2c-*` 实测为准）
SHT3X_ADDR = 0x44
SGP30_ADDR = 0x58


def _open_bus(bus_no: int) -> Optional[Any]:
    try:
        from smbus2 import SMBus  # type: ignore[import-not-found]

        return SMBus(bus_no)
    except Exception:
        return None


def _crc8(data: bytes) -> int:
    """Sensirion 系传感器共用的 CRC-8（多项式 0x31，初值 0xFF）。"""
    crc = 0xFF
    for byte in data:
        crc ^= byte
        for _ in range(8):
            crc = ((crc << 1) ^ 0x31) & 0xFF if crc & 0x80 else (crc << 1) & 0xFF
    return crc


class Sht3xDriver:
    """SHT3x 温湿度：单次高重复性测量（命令 0x2C06）。"""

    def __init__(self, bus_no: int = I2C_BUS_DEFAULT, address: int = SHT3X_ADDR) -> None:
        self.bus_no = bus_no
        self.address = address

    def read(self) -> Optional[dict[str, float]]:
        bus = _open_bus(self.bus_no)
        if bus is None:
            return None
        try:
            from smbus2 import i2c_msg  # type: ignore[import-not-found]

            bus.i2c_rdwr(i2c_msg.write(self.address, [0x2C, 0x06]))
            time.sleep(0.02)
            reply = i2c_msg.read(self.address, 6)
            bus.i2c_rdwr(reply)
            raw = bytes(reply)
            if _crc8(raw[0:2]) != raw[2] or _crc8(raw[3:5]) != raw[5]:
                return None
            temp_raw = (raw[0] << 8) | raw[1]
            hum_raw = (raw[3] << 8) | raw[4]
            return {
                "temperatureC": round(-45 + 175 * temp_raw / 65535, 1),
                "humidityPct": round(100 * hum_raw / 65535, 1),
            }
        except Exception:
            return None
        finally:
            try:
                bus.close()
            except Exception:
                pass


class Sgp30Driver:
    """SGP30 空气质量：eCO₂ / TVOC（命令 iaq_measure 0x2008）。

    芯片要求先 iaq_init 并周期调用；这里在首次读取时初始化，
    前 15 秒的暖机读数（400/0 定值）原样上报，由桌宠端自行解读。
    """

    def __init__(self, bus_no: int = I2C_BUS_DEFAULT, address: int = SGP30_ADDR) -> None:
        self.bus_no = bus_no
        self.address = address
        self._initialized = False

    def read(self) -> Optional[dict[str, int]]:
        bus = _open_bus(self.bus_no)
        if bus is None:
            return None
        try:
            from smbus2 import i2c_msg  # type: ignore[import-not-found]

            if not self._initialized:
                bus.i2c_rdwr(i2c_msg.write(self.address, [0x20, 0x03]))  # iaq_init
                time.sleep(0.01)
                self._initialized = True
            bus.i2c_rdwr(i2c_msg.write(self.address, [0x20, 0x08]))  # iaq_measure
            time.sleep(0.025)
            reply = i2c_msg.read(self.address, 6)
            bus.i2c_rdwr(reply)
            raw = bytes(reply)
            if _crc8(raw[0:2]) != raw[2] or _crc8(raw[3:5]) != raw[5]:
                return None
            return {
                "co2Ppm": (raw[0] << 8) | raw[1],
                "tvocPpb": (raw[3] << 8) | raw[4],
            }
        except Exception:
            self._initialized = False
            return None
        finally:
            try:
                bus.close()
            except Exception:
                pass


class Pms5003Driver:
    """PMS5003 颗粒物（UART，可选）：读一帧 32 字节主动上报数据。"""

    def __init__(self, device: str = "/dev/ttyS1", baud: int = 9600) -> None:
        self.device = device
        self.baud = baud

    def read(self) -> Optional[dict[str, float]]:
        try:
            import serial  # type: ignore[import-not-found]

            with serial.Serial(self.device, self.baud, timeout=2) as port:
                frame = port.read(64)
            start = frame.find(b"\x42\x4d")
            if start < 0 or len(frame) < start + 32:
                return None
            body = frame[start : start + 32]
            checksum = (body[30] << 8) | body[31]
            if sum(body[0:30]) & 0xFFFF != checksum:
                return None
            return {"pm25": float((body[12] << 8) | body[13])}
        except Exception:
            return None


class SensorHub:
    """逐路探测三种传感器，汇总为一帧环境读数；缺席字段为 None。"""

    def __init__(self, bus_no: int = I2C_BUS_DEFAULT) -> None:
        self.sht3x = Sht3xDriver(bus_no)
        self.sgp30 = Sgp30Driver(bus_no)
        self.pms5003 = Pms5003Driver()

    def read_environment(self) -> dict[str, Any]:
        sht = self.sht3x.read()
        sgp = self.sgp30.read()
        pms = self.pms5003.read()
        return {
            "temperatureC": sht["temperatureC"] if sht else None,
            "humidityPct": sht["humidityPct"] if sht else None,
            "co2Ppm": sgp["co2Ppm"] if sgp else None,
            "tvocPpb": sgp["tvocPpb"] if sgp else None,
            "pm25": pms["pm25"] if pms else None,
            "online": {
                "sht3x": sht is not None,
                "sgp30": sgp is not None,
                "pms5003": pms is not None,
            },
        }
