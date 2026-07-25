"""Night Shift 床头哨站（RDK X5 板端代理）。

模块划分：
- drivers  : 40PIN I2C 传感器驱动（探测失败自动降级，字段置 null）
- camera   : 摄像头帧差体动分析（画面只在内存，绝不落盘 / 出网）
- mock     : 无硬件时的合成数据源，形状与真实路径完全一致
- server   : 标准库 HTTP/JSON 服务，桌宠作为通讯端来轮询
"""

PROTOCOL_VERSION = "1"
DEVICE_NAME = "rdk-x5"
