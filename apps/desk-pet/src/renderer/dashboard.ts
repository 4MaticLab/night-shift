// 夜班面板逻辑：积分账本、假传感器实时读数、虚空摄像头导入、占位报告。
// 与 pet.ts 相同：编译为无模块纯脚本，类型全部走 import() 内联语法。

(() => {
  type PointsPayload = import("../shared/contracts").PointsPayload;
  type SensorSnapshot = import("../shared/contracts").SensorSnapshot;
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
    el("sensor-temp").textContent = `${snapshot.temperature.valueC}${snapshot.temperature.unit}`;
    el("sensor-pm25").textContent = String(snapshot.airQuality.pm25);
    el("sensor-aqi").textContent = `空气 ${snapshot.airQuality.label} · 占位`;
    el("sensor-co2").textContent = `${snapshot.airQuality.co2Ppm} ppm`;
    el("sensor-humidity").textContent = `${snapshot.airQuality.humidityPct}%`;
    const at = new Date(snapshot.capturedAt);
    el("sensor-updated").textContent =
      `最近一帧：${at.toLocaleTimeString("zh-CN")} · 数据源：${snapshot.source}（假传感器也是传感器）`;
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
      el("clip-toss").textContent = String(report.clipReport.tossTurns);
      el("clip-outofbed").textContent = String(report.clipReport.outOfBedEvents);
      el("clip-quiet").textContent = String(report.clipReport.longestQuietMinutes);
      el("clip-restless").textContent = report.clipReport.restlessnessIndex.toFixed(2);
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

  el<HTMLButtonElement>("generate-report").addEventListener("click", () => {
    const button = el<HTMLButtonElement>("generate-report");
    button.disabled = true;
    button.textContent = "林渡在翻档案……";
    void (async () => {
      // 故意留一点仪式感的延迟
      await new Promise((resolve) => setTimeout(resolve, 1200));
      renderReport(await window.nightPet.generateSleepReport());
      button.disabled = false;
      button.textContent = "让林渡出一份报告";
    })();
  });

  window.nightPet.onPoints(renderPoints);
  window.nightPet.onSensors(renderSensors);
  window.nightPet.onVoidClip(renderClip);

  void (async () => {
    const snapshot = await window.nightPet.getSnapshot();
    renderPoints(snapshot.points);
    renderSensors(snapshot.sensors);
    renderClip(snapshot.voidClip);
    renderReport(snapshot.lastReport);
  })();
})();
