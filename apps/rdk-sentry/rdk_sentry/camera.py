"""摄像头体动分析：帧差法，画面只在内存中处理。

隐私护栏（硬约束）：
- 任何图像帧都不写盘、不编码、不进 HTTP 响应；
- 对外只暴露聚合统计：翻身次数、离床次数、最长安静片段、躁动指数。

采集路径：USB UVC 摄像头优先（OpenCV VideoCapture）；MIPI CSI 摄像头
（`hobot_vio.libsrcampy`）留了适配入口 `_open_mipi`，接法一致。
统计核心 `MotionAggregator` 与采集解耦，可脱离硬件做纯逻辑测试。
"""

from __future__ import annotations

import threading
import time
from typing import Any, Optional

CAPTURE_FPS = 2  # 睡眠场景低帧率足够，省 BPU 也省电
MOTION_RATIO_TOSS = 0.04  # 帧差像素占比超过此值记一次「翻身级」动作
MOTION_RATIO_OUT_OF_BED = 0.22  # 大面积变化视为离床 / 回床
EVENT_COOLDOWN_SEC = 20.0  # 事件去抖：同类动作 20s 内只记一次


class MotionAggregator:
    """把逐帧的「运动占比」流折算成夜间体动统计（纯逻辑，可测试）。"""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.reset(time.time())

    def reset(self, now_sec: float) -> None:
        with getattr(self, "_lock", threading.Lock()):
            self.started_at = now_sec
            self.samples = 0
            self.toss_turns = 0
            self.out_of_bed_events = 0
            self.motion_ratio_sum = 0.0
            self._last_event_at = -EVENT_COOLDOWN_SEC
            self._quiet_started_at = now_sec
            self._longest_quiet_sec = 0.0

    def feed(self, motion_ratio: float, now_sec: float) -> None:
        """喂入一帧的运动占比（0–1）。"""
        with self._lock:
            self.samples += 1
            self.motion_ratio_sum += max(0.0, min(1.0, motion_ratio))

            if motion_ratio >= MOTION_RATIO_TOSS:
                # 先结算安静片段
                quiet = now_sec - self._quiet_started_at
                if quiet > self._longest_quiet_sec:
                    self._longest_quiet_sec = quiet
                self._quiet_started_at = now_sec
                # 再做事件去抖计数
                if now_sec - self._last_event_at >= EVENT_COOLDOWN_SEC:
                    self._last_event_at = now_sec
                    if motion_ratio >= MOTION_RATIO_OUT_OF_BED:
                        self.out_of_bed_events += 1
                    else:
                        self.toss_turns += 1

    def stats(self, now_sec: float) -> dict[str, Any]:
        with self._lock:
            window_sec = max(0.0, now_sec - self.started_at)
            ongoing_quiet = now_sec - self._quiet_started_at
            longest_quiet = max(self._longest_quiet_sec, ongoing_quiet)
            avg_motion = self.motion_ratio_sum / self.samples if self.samples else 0.0
            # 躁动指数：动作频次 + 平均运动量的加权，压到 0–1
            per_hour = (self.toss_turns + self.out_of_bed_events * 2) / max(window_sec / 3600, 1 / 60)
            restlessness = min(1.0, round(per_hour * 0.06 + avg_motion * 2.5, 2))
            return {
                "windowMinutes": round(window_sec / 60, 1),
                "samples": self.samples,
                "tossTurns": self.toss_turns,
                "outOfBedEvents": self.out_of_bed_events,
                "longestQuietMinutes": round(longest_quiet / 60, 1),
                "restlessnessIndex": max(0.0, restlessness),
                "since": _iso(self.started_at),
            }


def _iso(epoch_sec: float) -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime(epoch_sec)) + "Z"


class CameraWorker:
    """后台采集线程：抓帧 → 帧差 → 喂给 MotionAggregator，帧用完即弃。"""

    def __init__(self, camera_index: int = 0) -> None:
        self.camera_index = camera_index
        self.aggregator = MotionAggregator()
        self.online = False
        self._stop = threading.Event()
        self._thread: Optional[threading.Thread] = None

    def start(self) -> None:
        self._thread = threading.Thread(target=self._run, name="sentry-camera", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()

    def _open_uvc(self) -> Optional[Any]:
        try:
            import cv2  # type: ignore[import-not-found]

            cap = cv2.VideoCapture(self.camera_index)
            return cap if cap.isOpened() else None
        except Exception:
            return None

    def _open_mipi(self) -> Optional[Any]:
        """MIPI CSI 适配入口：RDK X5 上可换用 hobot_vio.libsrcampy 采集。

        返回对象需实现 read() -> (ok, frame)。接入示例：
            from hobot_vio import libsrcampy as srcampy
            cam = srcampy.Camera(); cam.open_cam(0, -1, CAPTURE_FPS, 640, 480)
        当前默认返回 None（UVC 已覆盖联调需求），留给板上实测时启用。
        """
        return None

    def _run(self) -> None:
        try:
            import cv2  # type: ignore[import-not-found]
            import numpy as np  # type: ignore[import-not-found]
        except Exception:
            return  # 无 OpenCV：体动分析降级为不可用，哨站其余功能不受影响

        cap = self._open_uvc() or self._open_mipi()
        if cap is None:
            return
        self.online = True
        prev_gray: Optional[Any] = None
        interval = 1.0 / CAPTURE_FPS
        try:
            while not self._stop.is_set():
                ok, frame = cap.read()
                if not ok:
                    self.online = False
                    break
                gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                gray = cv2.resize(gray, (160, 120))
                gray = cv2.GaussianBlur(gray, (5, 5), 0)
                if prev_gray is not None:
                    diff = cv2.absdiff(gray, prev_gray)
                    changed = int(np.count_nonzero(diff > 18))
                    ratio = changed / diff.size
                    self.aggregator.feed(ratio, time.time())
                prev_gray = gray
                time.sleep(interval)
        finally:
            self.online = False
            try:
                cap.release()
            except Exception:
                pass
