// 夜班面板逻辑：积分账本、传感器读数（占位 / 床头哨站）、哨站连接、报告。
// 与 pet.ts 相同：编译为无模块纯脚本，类型全部走 import() 内联语法。

(() => {
  type PointsPayload = import("../shared/contracts").PointsPayload;
  type SensorSnapshot = import("../shared/contracts").SensorSnapshot;
  type SentryStatus = import("../shared/contracts").SentryStatus;
  type SleepReport = import("../shared/contracts").SleepReport;
  type VoidClip = import("../shared/contracts").VoidClip;

  const el = <T extends HTMLElement = HTMLElement>(id: string): T => {
    const node = document.getElementById(id);
    if (!node) throw new Error(`desk-pet dashboard: missing #${id}`);
    return node as T;
  };

  function renderPoints(payload: PointsPayload): void {
    el("points-total").textContent = String(payload.total);
    el("points-rank").textContent = payload.rank;
    el("points-rate").textContent = payload.mode === "sleeping"
      ? `补眠中 +${payload.ratePerMinute}/min`
      : `值更中 +${payload.ratePerMinute}/min`;
    const credited = payload.offlineCredited;
    el("points-offline").textContent = credited.points > 0
      ? `本次启动补记离线值更：${credited.minutes} 分钟 → +${credited.points} 点`
      : "";
  }

  function renderSensors(snapshot: SensorSnapshot): void {
    const live = snapshot.source === "rdk-x5";
    const degraded = snapshot.degradedFields ?? [];
    const detail = (field: string): string => {
      if (!live) return "演示值 · 未接传感器";
      return degraded.includes(field) ? "通道缺席 · 演示值补齐" : "实测 · 床头哨站";
    };
    el("sensor-temp").textContent = `${snapshot.temperature.valueC}${snapshot.temperature.unit}`;
    el("sensor-temp-detail").textContent = detail("temperatureC");
    el("sensor-pm25").textContent = String(snapshot.airQuality.pm25);
    el("sensor-aqi").textContent = live && !degraded.includes("pm25")
      ? `空气 ${snapshot.airQuality.label} · 实测`
      : `空气 ${snapshot.airQuality.label} · 演示值`;
    el("sensor-co2").textContent = `${snapshot.airQuality.co2Ppm} ppm`;
    el("sensor-co2-detail").textContent = detail("co2Ppm");
    el("sensor-humidity").textContent = `${snapshot.airQuality.humidityPct}%`;
    el("sensor-humidity-detail").textContent = detail("humidityPct");
    el("sensors-badge").textContent = live
      ? (degraded.length > 0 ? "RDK X5 · 实时 · 部分降级" : "RDK X5 · 实时")
      : "未连接 · 演示数据";
    const at = new Date(snapshot.capturedAt);
    el("sensor-updated").textContent = live
      ? `最近一帧：${at.toLocaleTimeString("zh-CN")} · 数据源：${snapshot.source}（床头哨站实测）`
      : `最近一帧：${at.toLocaleTimeString("zh-CN")} · 数据源：演示生成（非传感器实测）`;
  }

  function renderSentry(status: SentryStatus): void {
    const badge = el("sentry-badge");
    const line = el("sentry-status-line");
    const disconnectBtn = el("sentry-disconnect");
    const hostInput = el<HTMLInputElement>("sentry-host");
    const portInput = el<HTMLInputElement>("sentry-port");
    if (status.config && hostInput.value.trim() === "") {
      hostInput.value = status.config.host;
      portInput.value = String(status.config.port);
    }
    disconnectBtn.classList.toggle("hidden", status.config === null);
    if (status.state === "online") {
      badge.textContent = status.mock ? "在线 · 合成联调数据" : "在线 · 原型实测";
      const degradedNote = status.degradedFields.length > 0
        ? ` · 缺席硬件：${status.degradedFields.join("、")}`
        : "";
      line.textContent = `Mini Lindo（${status.device ?? "rdk-x5"}）已连接 · 最近心跳 ${status.lastSeenAt ? new Date(status.lastSeenAt).toLocaleTimeString("zh-CN") : "--"}${degradedNote}`;
    } else if (status.state === "error") {
      badge.textContent = "连接中断 · 已回退";
      line.textContent = `暂时联系不上哨站（${status.error ?? "未知原因"}）；已切回有明确标记的演示数据，并会继续重试。`;
    } else {
      badge.textContent = "未连接";
      line.textContent = "尚未配置哨站；当前所有数值均为演示数据。";
    }
  }

  function renderClip(clip: VoidClip | null): void {
    const hasClip = clip !== null;
    el("clear-clip").classList.toggle("hidden", !hasClip);
    el("clip-name").textContent = hasClip
      ? `${clip.name} · ${(clip.sizeBytes / 1024 / 1024).toFixed(1)} MB · 导入于 ${new Date(clip.importedAt).toLocaleString("zh-CN")}`
      : "尚未导入录像";
  }

  function renderReport(report: SleepReport | null): void {
    if (!report) return;
    el("report-body").classList.remove("hidden");
    el("report-score").textContent = String(report.quality.score);
    el("report-grade").textContent = report.quality.grade;
    el("report-time").textContent = `出具于 ${new Date(report.generatedAt).toLocaleString("zh-CN")}`;
    el("report-narrative").textContent = report.quality.narrative;

    const clipSection = el("report-clip");
    if (report.clipReport) {
      clipSection.classList.remove("hidden");
      el("report-clip-title").textContent = report.clipReport.source === "rdk-x5"
        ? "Mini Lindo 体动统计（床头实测）"
        : "体动统计（演示数据）";
      el("clip-toss").textContent = String(report.clipReport.tossTurns);
      el("clip-outofbed").textContent = String(report.clipReport.outOfBedEvents);
      el("clip-quiet").textContent = String(report.clipReport.longestQuietMinutes);
      el("clip-restless").textContent = report.clipReport.restlessnessIndex.toFixed(2);
      el("clip-note").textContent = report.clipReport.note;
    } else {
      clipSection.classList.add("hidden");
    }
  }

  el("import-clip").addEventListener("click", () => {
    void window.nightPet.importVoidClip().then(renderClip);
  });

  el("clear-clip").addEventListener("click", () => {
    void window.nightPet.clearVoidClip().then(renderClip);
  });

  el<HTMLButtonElement>("sentry-connect").addEventListener("click", () => {
    const button = el<HTMLButtonElement>("sentry-connect");
    const host = el<HTMLInputElement>("sentry-host").value;
    const portRaw = el<HTMLInputElement>("sentry-port").value.trim();
    const port = portRaw === "" ? 8302 : Number(portRaw);
    button.disabled = true;
    button.textContent = "握手中…";
    void window.nightPet.connectSentry({ host, port }).then((status) => {
      renderSentry(status);
      button.disabled = false;
      button.textContent = "连接";
    });
  });

  el("sentry-disconnect").addEventListener("click", () => {
    void window.nightPet.disconnectSentry().then(renderSentry);
  });

  el<HTMLButtonElement>("generate-report").addEventListener("click", () => {
    const button = el<HTMLButtonElement>("generate-report");
    button.disabled = true;
    button.textContent = "林渡在翻档案……";
    void (async () => {
      // 故意留一点仪式感的延迟
      await new Promise((resolve) => setTimeout(resolve, 1200));
      renderReport(await window.nightPet.generateSleepReport());
      button.disabled = false;
      button.textContent = "生成一份观测回执";
    })();
  });

  window.nightPet.onPoints(renderPoints);
  window.nightPet.onSensors(renderSensors);
  window.nightPet.onVoidClip(renderClip);
  window.nightPet.onSentry(renderSentry);

  void (async () => {
    const snapshot = await window.nightPet.getSnapshot();
    renderPoints(snapshot.points);
    renderSensors(snapshot.sensors);
    renderClip(snapshot.voidClip);
    renderReport(snapshot.lastReport);
    renderSentry(snapshot.sentry);
  })();
})();
