#!/usr/bin/env python3
"""Mini Lindo 床头哨站 · RDK X5 板端代理入口。

Mini Lindo（小林渡）摆在床头的地瓜 RDK X5 上运行：读摄像头做体动分析（画面不出板）、
读 40PIN I2C 传感器（SHT3x 温湿度 / SGP30 空气质量，可选 PMS5003 颗粒物），
通过局域网 HTTP/JSON 把聚合读数交给桌宠（通讯端）。

无硬件联调:  python3 sentry.py --mock
板上运行:    python3 sentry.py [--host 0.0.0.0] [--port 8302] [--camera 0]
"""

from __future__ import annotations

import argparse
import sys

from rdk_sentry.server import run_server


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Mini Lindo (Night Shift RDK X5 bedside sentry)")
    parser.add_argument("--host", default="0.0.0.0", help="监听地址（默认 0.0.0.0，仅建议局域网）")
    parser.add_argument("--port", type=int, default=8302, help="监听端口（默认 8302）")
    parser.add_argument("--camera", type=int, default=0, help="UVC 摄像头索引（默认 0）")
    parser.add_argument(
        "--mock",
        action="store_true",
        help="无硬件模式：生成形状一致的合成数据，可在任意机器上与桌宠联调",
    )
    return parser.parse_args(argv)


if __name__ == "__main__":
    args = parse_args(sys.argv[1:])
    run_server(host=args.host, port=args.port, camera_index=args.camera, mock=args.mock)
