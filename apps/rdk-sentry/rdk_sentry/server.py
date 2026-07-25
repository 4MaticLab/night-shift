"""哨站 HTTP/JSON 服务：标准库 ThreadingHTTPServer，桌宠作为 Mini Lindo 的通讯端来轮询。

端点（均为 GET，无鉴权，仅限局域网使用）：
- /api/v1/health    设备与各传感器在线状态
- /api/v1/snapshot  当前环境读数（缺席硬件字段为 null）
- /api/v1/motion    摄像头体动聚合统计（不含任何图像）
"""

from __future__ import annotations

import json
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

from . import DEVICE_NAME, PRODUCT_NAME, PROTOCOL_VERSION
from .camera import CameraWorker
from .drivers import SensorHub
from .mock import MockSource


class SentryRuntime:
    """聚合真实 / mock 两条数据通路，向 handler 提供统一取数接口。"""

    def __init__(self, camera_index: int, mock: bool) -> None:
        self.mock_mode = mock
        self.started_at = time.time()
        self.mock_source = MockSource() if mock else None
        self.sensor_hub = None if mock else SensorHub()
        self.camera = None
        if not mock:
            self.camera = CameraWorker(camera_index)
            self.camera.start()

    def health(self) -> dict[str, Any]:
        if self.mock_source is not None:
            sensors = {"sht3x": True, "sgp30": True, "pms5003": True, "camera": True}
        else:
            env = self.sensor_hub.read_environment() if self.sensor_hub else {"online": {}}
            sensors = dict(env["online"])
            sensors["camera"] = bool(self.camera and self.camera.online)
        return {
            "ok": True,
            "product": PRODUCT_NAME,
            "device": DEVICE_NAME,
            "protocol": PROTOCOL_VERSION,
            "mock": self.mock_mode,
            "uptimeSec": int(time.time() - self.started_at),
            "sensors": sensors,
        }

    def snapshot(self) -> dict[str, Any]:
        env = (
            self.mock_source.environment()
            if self.mock_source is not None
            else (self.sensor_hub.read_environment() if self.sensor_hub else {})
        )
        return {
            "capturedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "source": DEVICE_NAME,
            "mock": self.mock_mode,
            "environment": env,
        }

    def motion(self) -> dict[str, Any]:
        if self.mock_source is not None:
            stats = self.mock_source.motion()
        elif self.camera is not None and self.camera.online:
            stats = self.camera.aggregator.stats(time.time())
        else:
            stats = None
        return {
            "capturedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "source": DEVICE_NAME,
            "mock": self.mock_mode,
            "cameraOnline": bool(self.mock_mode or (self.camera and self.camera.online)),
            "stats": stats,
        }


def make_handler(runtime: SentryRuntime) -> type[BaseHTTPRequestHandler]:
    class SentryHandler(BaseHTTPRequestHandler):
        server_version = f"NightShiftSentry/{PROTOCOL_VERSION}"

        def do_GET(self) -> None:  # noqa: N802 http.server 命名约定
            routes = {
                "/api/v1/health": runtime.health,
                "/api/v1/snapshot": runtime.snapshot,
                "/api/v1/motion": runtime.motion,
            }
            producer = routes.get(self.path.split("?")[0])
            if producer is None:
                self._reply(404, {"ok": False, "error": "not found"})
                return
            try:
                self._reply(200, producer())
            except Exception as error:  # 不让单次读数失败拖垮服务
                self._reply(500, {"ok": False, "error": str(error)})

        def _reply(self, status: int, payload: dict[str, Any]) -> None:
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Access-Control-Allow-Origin", "*")  # 局域网内桌宠跨源轮询
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, fmt: str, *args: Any) -> None:
            pass  # 睡眠场景不刷访问日志

    return SentryHandler


def run_server(host: str, port: int, camera_index: int, mock: bool) -> None:
    runtime = SentryRuntime(camera_index=camera_index, mock=mock)
    server = ThreadingHTTPServer((host, port), make_handler(runtime))
    mode = "mock（合成数据）" if mock else "hardware"
    print(f"{PRODUCT_NAME} sentry listening on http://{host}:{port} · mode={mode}")
    print("小林渡上岗：画面与原始读数不出板，只对局域网暴露聚合统计。Ctrl+C 下班。")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        if runtime.camera is not None:
            runtime.camera.stop()
        server.server_close()
