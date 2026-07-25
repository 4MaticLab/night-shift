// 桌宠窗口逻辑：模式切换动画、台词气泡、积分 HUD。
// 注意：本文件编译为无模块的纯脚本（直接 <script> 引入），
// 因此只用 import() 内联类型、整体包在 IIFE 里，不产生任何运行时模块语法。

(() => {
  type PointsPayload = import("../shared/contracts").PointsPayload;
  type PetMode = import("../shared/contracts").PetMode;

  const stage = document.getElementById("stage") as HTMLDivElement;
  const bubble = document.getElementById("bubble") as HTMLDivElement;
  const pointsChip = document.getElementById("points-chip") as HTMLSpanElement;
  const modeChip = document.getElementById("mode-chip") as HTMLSpanElement;
  const petZone = document.getElementById("pet-zone") as HTMLDivElement;

  const AWAKE_QUIPS = [
    "雾灯市的夜里，档案比人诚实。",
    "你继续忙，我盯着这盏灯。",
    "线索不会跑，但你的肩颈会僵——起来倒杯水。",
    "值更点在涨，说明夜没白守。",
    "第十三条街的雾今晚薄一些。",
    "传感器还没接电线？没关系，占位数据也是数据。",
  ];

  const SLEEP_QUIPS = [
    "……蓝盒子床垫，比档案室的椅子强多了。",
    "（压低帽檐）我眯一会儿，积分照常记。",
    "夜太长，轮流守才守得住。",
  ];

  const WAKE_QUIPS = [
    "醒着呢。只是把帽檐压低了想事情。",
    "咳。刚才那不算睡着，是在听雾的动静。",
  ];

  let bubbleTimer: ReturnType<typeof setTimeout> | undefined;
  let sleeping = false;

  function say(text: string, holdMs = 4200): void {
    bubble.textContent = text;
    bubble.classList.remove("hidden");
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.add("hidden"), holdMs);
  }

  function pickFrom(list: string[]): string {
    return list[Math.floor(Math.random() * list.length)];
  }

  function applyMode(mode: PetMode): void {
    const wasSleeping = sleeping;
    sleeping = mode === "sleeping";
    stage.classList.toggle("sleeping", sleeping);
    stage.classList.toggle("awake", !sleeping);
    if (sleeping && !wasSleeping) say(pickFrom(SLEEP_QUIPS));
    if (!sleeping && wasSleeping) say(pickFrom(WAKE_QUIPS));
  }

  function renderPoints(payload: PointsPayload): void {
    pointsChip.textContent = `值更点 ${payload.total}`;
    pointsChip.title = `${payload.rank} · 精确值 ${payload.exact.toFixed(2)}`;
    modeChip.textContent = payload.mode === "sleeping"
      ? `补眠中 +${payload.ratePerMinute}/min`
      : `值更中 +${payload.ratePerMinute}/min`;
  }

  // 单击聊天，双击手动哄睡 / 叫醒（再双击交还给空闲检测）
  let clickTimer: ReturnType<typeof setTimeout> | undefined;
  let manualOverride = false;

  petZone.addEventListener("click", () => {
    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => {
      say(pickFrom(sleeping ? SLEEP_QUIPS : AWAKE_QUIPS));
    }, 250);
  });

  petZone.addEventListener("dblclick", () => {
    clearTimeout(clickTimer);
    void (async () => {
      if (manualOverride) {
        manualOverride = false;
        await window.nightPet.setManualMode(null);
        say("行，接下来看系统的意思。");
      } else {
        manualOverride = true;
        await window.nightPet.setManualMode(sleeping ? "awake" : "sleeping");
      }
    })();
  });

  document.getElementById("open-dashboard")?.addEventListener("click", () => {
    void window.nightPet.openDashboard();
  });

  document.getElementById("quit")?.addEventListener("click", () => {
    void window.nightPet.quit();
  });

  window.nightPet.onMode(({ mode }) => applyMode(mode));
  window.nightPet.onPoints(renderPoints);

  void (async () => {
    const snapshot = await window.nightPet.getSnapshot();
    applyMode(snapshot.mode);
    renderPoints(snapshot.points);
    const credited = snapshot.points.offlineCredited;
    if (credited.points > 0) {
      say(`你不在的 ${credited.minutes} 分钟，我替你值了更，补记 ${credited.points} 点。`, 6000);
    } else {
      say("夜班开始。有事点我，没事我就守着。");
    }
  })();
})();
