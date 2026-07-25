"""无硬件模式：合成一夜的传感器与体动数据，形状与真实路径完全一致。

用途：在 macOS / 任意机器上与桌宠联调，或板子到手但传感器还没接线时先跑通。
所有响应都带 "mock": true，桌宠端如实展示，不伪装成真实连接。
"""

from __future__ import annotations

import math
import random
import time
from typing import Any


class MockSource:
    """按启动时刻演化的平滑合成数据；motion 统计随窗口时长缓慢累积。"""

    def __init__(self, seed: int | None = None) -> None:
        self.started_at = time.time()
        self._rng = random.Random(seed)

    def environment(self) -> dict[str, Any]:
        t = time.time() / 60  # 分钟
        noise = lambda scale: (self._rng.random() - 0.5) * 2 * scale  # noqa: E731
        return {
            "temperatureC": round(min(32, max(15, 22.4 + 2.0 * math.sin(t / 31) + noise(0.2))), 1),
            "humidityPct": round(min(80, max(25, 51 + 6 * math.sin(t / 47 + 1.1) + noise(1.0))), 1),
            "co2Ppm": int(min(2000, max(420, 680 + 210 * math.sin(t / 39 + 2.0) + noise(15)))),
            "tvocPpb": int(min(600, max(0, 120 + 80 * math.sin(t / 29 + 0.4) + noise(10)))),
            "pm25": round(min(150, max(2, 12 + 7 * math.sin(t / 21 + 0.8) + noise(1.0))), 1),
            "online": {"sht3x": True, "sgp30": True, "pms5003": True},
        }

    def motion(self) -> dict[str, Any]:
        window_sec = max(1.0, time.time() - self.started_at)
        window_min = window_sec / 60
        toss = int(window_min / 25) + (1 if window_min > 2 else 0)
        out_of_bed = int(window_min / 150)
        longest_quiet = round(min(window_min * 0.6, 95 + self._rng.random() * 10), 1)
        restlessness = round(min(1.0, 0.12 + toss * 0.02 + out_of_bed * 0.1), 2)
        return {
            "windowMinutes": round(window_min, 1),
            "samples": int(window_sec * 2),
            "tossTurns": toss,
            "outOfBedEvents": out_of_bed,
            "longestQuietMinutes": longest_quiet,
            "restlessnessIndex": restlessness,
            "since": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(self.started_at)),
        }
