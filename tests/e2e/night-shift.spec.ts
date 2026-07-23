import { expect, test } from "@playwright/test";

async function openFirstNight(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /开始第 001 宗案件/ }).click();
  await page.getByRole("button", { name: "继续" }).click();
  await page.getByRole("button", { name: "继续" }).click();
  await page.getByRole("button", { name: /进入事务所/ }).click();
  await page.getByRole("button", { name: /让纸张先开口/ }).click();
}

async function expectNoPageOverflow(page: import("@playwright/test").Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

async function expectNoOverlap(first: import("@playwright/test").Locator, second: import("@playwright/test").Locator) {
  const [a, b] = await Promise.all([first.boundingBox(), second.boundingBox()]);
  expect(a).not.toBeNull();
  expect(b).not.toBeNull();
  expect(a!.x + a!.width <= b!.x || b!.x + b!.width <= a!.x || a!.y + a!.height <= b!.y || b!.y + b!.height <= a!.y).toBe(true);
}

async function expectMinimumTapTargets(locator: import("@playwright/test").Locator, minimum = 44) {
  const sizes = await locator.evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height, label: element.textContent?.trim() };
  }));
  expect(sizes.length).toBeGreaterThan(0);
  for (const size of sizes) {
    expect(size.width, `${size.label} width`).toBeGreaterThanOrEqual(minimum);
    expect(size.height, `${size.label} height`).toBeGreaterThanOrEqual(minimum);
  }
}

async function expectNoVisibleHan(page: import("@playwright/test").Page) {
  const visibleText = await page.locator("body").innerText();
  expect(visibleText).not.toMatch(/\p{Script=Han}/u);
}

test("holds the first interaction behind a real hero-art loading screen", async ({ page }) => {
  await page.route("**/art/headers/shift-handoff-v2.webp", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 900));
    await route.continue();
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const loadingScreen = page.locator(".app-boot-screen").last();
  await expect(loadingScreen).toBeVisible();
  await expect(loadingScreen).toContainText("夜班事务所正在亮灯");
  await expect(page.locator(".app-boot-content")).toHaveAttribute("inert", "");
  await expect(loadingScreen).toBeHidden({ timeout: 10_000 });
  await expect(page.locator(".app-boot-content")).not.toHaveAttribute("inert", "");
  await expect(page.getByRole("button", { name: /开始第 001 宗案件/ })).toBeEnabled();
  const caseLibrary = page.getByRole("region", { name: "案件剧本选择" });
  await expect(caseLibrary.locator(".featured-case")).toContainText("零点四十三分的末班车");
  await expect(caseLibrary.locator(".featured-case")).toContainText("推荐起点");
  await expect(page.locator(".case-teaser")).toHaveCount(0);
});

test("plays the first case in English and preserves the language preference", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /ENGLISH/ }).click();
  await expect(page.getByRole("button", { name: /Begin Case 001/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /When you fall asleep/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: /Begin Case 001/ })).toBeVisible();

  await page.getByRole("button", { name: /Begin Case 001/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Enter the agency/ }).click();
  await expect(page.getByText("The Ticket That Never Existed")).toBeVisible();
  await expectNoVisibleHan(page);

  await page.getByRole("button", { name: /Let the paper speak first/ }).click();
  await page.getByRole("button", { name: /The night is yours/ }).click();
  await expect(page.getByText("Night shift in progress")).toBeVisible();
  await expectNoVisibleHan(page);
  await page.getByRole("button", { name: /Skip to morning/ }).click();
  await expect(page.getByText("Last night's investigation is complete")).toBeVisible();
  await expect(page.getByText(/Rain had washed the signs of Lantern Wharf quiet/)).toBeVisible();
  await expectNoVisibleHan(page);

  await page.getByRole("button", { name: "Caseboard", exact: true }).click();
  await expect(page.getByText("Connect the lies", { exact: false })).toBeVisible();
  await expectNoVisibleHan(page);
  await page.getByRole("button", { name: "Collection", exact: true }).click();
  await expect(page.getByText("Time did not vanish.", { exact: false })).toBeVisible();
  await expectNoVisibleHan(page);
  await page.getByRole("button", { name: "Archive", exact: true }).click();
  await expect(page.getByRole("heading", { name: "The Last Tram at 00:43" })).toBeVisible();
  await expectNoVisibleHan(page);
  await expect(page.evaluate(() => localStorage.getItem("night-shift-locale"))).resolves.toBe("en");
});

test("keeps the English first-night handoff usable at 390 × 844", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: /ENGLISH/ }).click();
  await expectNoPageOverflow(page);
  await page.getByRole("button", { name: /Begin Case 001/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Enter the agency/ }).click();
  await expectNoVisibleHan(page);
  await expectNoPageOverflow(page);
  await page.getByRole("button", { name: /Let the paper speak first/ }).click();
  const handoff = page.getByRole("button", { name: /The night is yours/ });
  await expect(handoff).toBeVisible();
  await expectMinimumTapTargets(page.locator(".choice-list .choice"));
  await expectNoPageOverflow(page);
});

async function reachFinalDecision(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /DEMO MODE/ }).click();
  await page.getByRole("button", { name: /跳到真结局条件/ }).click();
  await page.getByRole("button", { name: /去站台等一辆被否认的车/ }).click();
  await page.getByRole("button", { name: /今晚交给你了/ }).click();
  await page.getByRole("button", { name: /跳到清晨/ }).click();
  await page.getByRole("button", { name: /做出最终决定/ }).click();
}

test("starts a case and reaches the first morning report", async ({ page }) => {
  await openFirstNight(page);
  await expect(page.locator(".handoff-portrait img")).toHaveAttribute("src", /lin-du-handoff-portrait-v1/);
  await expect(page.locator(".handoff-docket")).toContainText("纸张的证词");
  await expect(page.locator(".handoff-docket")).toContainText("侧照灯 · 灯港旧票据工坊");
  await expectNoOverlap(page.locator(".scene-copy"), page.locator(".handoff-portrait"));
  await expectNoOverlap(page.locator(".handoff-docket"), page.locator(".handoff-portrait"));
  await expect(page.getByText(/可能惊动 · 错页登记处/)).toBeVisible();
  await page.getByRole("button", { name: /今晚交给你了/ }).click();
  await expect(page.locator(".night-expedition-art")).toHaveAttribute("src", /night-expedition-v1/);
  await expect(page.locator(".city-watch-live")).toContainText("夜半时分");
  await expect(page.getByText("纸张的证词")).toBeVisible();
  await expect(page.getByText("GROWING WHILE YOU REST")).toBeVisible();
  await expect(page.getByText(/旧票据工坊承认这批纸早已销毁/)).toBeVisible();
  await page.getByRole("button", { name: /跳到清晨/ }).click();
  await expect(page.locator(".report-hero-art")).toHaveAttribute("src", /morning-report-v1/);
  await expect(page.getByText("昨夜调查完成")).toBeVisible();
  await expect(page.locator(".city-watch-report")).toContainText("交接时辰留下的城市侧影");
  await expect(page.locator(".city-watch-report")).toContainText("夜半时分");
  await expect(page.locator(".city-watch-report")).toContainText("不改变线索、收藏、植物或睡眠评价");
  await expect(page.getByText("灯港拒收件")).toBeVisible();
  await expect(page.getByText(/市政厅的否认牌在雨里站了七年/)).toBeVisible();
  await expect(page.getByText(/我先让纸张开口/)).toBeVisible();
  await expect(page.getByText("票根灯蕨").first()).toBeVisible();
  await expect(page.getByText("口袋里多出来的东西")).toBeVisible();
  await expect(page.getByRole("heading", { name: "未盖章的雨水收据" })).toBeVisible();
  await expect(page.getByText(/不提供调查优势、额外奖励或结局资格/)).toBeVisible();
  await expect(page.getByText("错页登记处来函")).toBeVisible();
  await expect(page.getByRole("heading", { name: "致「待核旁注」" })).toBeVisible();
  await expect(page.getByText(/你让一张作废票据反过来审问了出票制度/)).toBeVisible();
  await page.getByRole("button", { name: /让错字继续保护地址/ }).click();
  await expect(page.getByText("答复已寄出")).toBeVisible();
  await expect(page.getByText(/让空白先保护活人/)).toBeVisible();
  await expect(page.getByText(/断续|普通|安稳/).first()).toBeVisible();
  await expect(page.getByText(/为什么一张已经停运七年的车票/)).toBeVisible();
  await page.getByRole("button", { name: "案件板", exact: true }).click();
  await expect(page.locator(".board-shell")).toBeVisible();
});

test("rest intention requests an AI note only after explicit consent", async ({ page }) => {
  let requestBody: Record<string, unknown> | undefined;
  await page.route("**/api/rest-reflection/access", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ configured: true, authorized: true }) });
  });
  await page.route("**/api/rest-reflection", async (route) => {
    requestBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        reflection: "纸条我收到了。今晚先让旧票据工坊替你守住未完成的部分，天亮以后再决定下一步。",
        source: "ai",
        reason: "generated",
      }),
    });
  });

  await openFirstNight(page);
  const intention = "明天的演示还没准备完，但今晚先到这里。";
  await page.getByLabel("放下纸条").fill(intention);
  await expect(page.getByRole("button", { name: /请 AI 替林渡选择晨间短笺风格/ })).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: /请 AI 替林渡选择晨间短笺风格/ }).click();
  await page.getByRole("button", { name: /今晚交给你了/ }).click();
  await page.getByRole("button", { name: /跳到清晨/ }).click();

  await expect(page.locator(".rest-reflection-card")).toContainText(intention);
  await expect(page.locator(".rest-reflection-card")).toContainText("AI 个性化短笺");
  await expect(page.locator(".rest-reflection-card")).toContainText("今晚先让旧票据工坊替你守住未完成的部分");
  expect(requestBody).toMatchObject({
    intention,
    destination: "灯港旧票据工坊",
    preparation: "侧照灯",
    detectiveName: "林渡",
  });
  expect(requestBody).not.toHaveProperty("sleepData");
  expect(requestBody).not.toHaveProperty("history");
});

test("sleep hardware authorizes a virtual ring and returns a local morning receipt", async ({ page }) => {
  await openFirstNight(page);
  await page.getByRole("button", { name: /打开睡眠硬件中心/ }).first().click();
  await expect(page.getByRole("dialog", { name: /把一夜的微光/ })).toBeVisible();
  await expect(page.locator(".sleep-device-grid img")).toHaveCount(4);

  await page.getByRole("tab", { name: /真实桥接/ }).click();
  await page.getByRole("button", { name: /Oura Cloud/ }).click();
  await expect(page.getByText(/可以浏览，不会改动当前连接/)).toBeVisible();
  await expect(page.getByRole("button", { name: /用 雾灯睡眠戒 体验这条链路/ })).toBeEnabled();

  await page.getByRole("button", { name: /用 雾灯睡眠戒 体验这条链路/ }).click();
  await page.getByRole("button", { name: /授权并连接 雾灯睡眠戒/ }).click();
  await expect(page.getByText("连接完成，可以回到游戏了")).toBeVisible();
  await page.getByRole("button", { name: "关闭", exact: true }).click();

  await expect(page.locator(".sleep-handoff-card")).toContainText("雾灯睡眠戒已待命");
  await page.getByRole("button", { name: /今晚交给你了/ }).click();
  await expect(page.locator(".sleep-live-telemetry")).toContainText("雾灯睡眠戒正在记录");
  await expect(page.locator(".sleep-live-telemetry")).toContainText("夜间脉搏");
  await page.getByRole("button", { name: /跳到清晨/ }).click();
  await expect(page.locator(".sleep-morning-receipt")).toContainText("雾灯睡眠戒留下的一夜");
  await expect(page.locator(".sleep-morning-receipt")).toContainText("仅本机摘要");
  await expect(page.locator(".sleep-morning-receipt")).toContainText("非医疗结论");

  const hardwareState = await page.evaluate(() => JSON.parse(localStorage.getItem("night-shift-sleep-hardware-v1")!).state);
  expect(hardwareState.activeCapture).toBeNull();
  expect(Object.values(hardwareState.history)).toHaveLength(1);
  expect(JSON.stringify(hardwareState)).not.toContain("samples");
});

test("sleep hardware keeps the active device while browsing drafts and resets panel scroll", async ({ page }) => {
  await openFirstNight(page);
  await page.getByRole("button", { name: /打开睡眠硬件中心/ }).first().click();
  await page.locator(".sleep-device-grid > button").filter({ hasText: "雾灯睡眠戒" }).click();
  await page.getByRole("button", { name: /授权并连接 雾灯睡眠戒/ }).click();
  await page.getByRole("button", { name: /完成并返回游戏/ }).click();
  await expect(page.locator(".sleep-handoff-card")).toContainText("雾灯睡眠戒已待命");

  await page.getByRole("button", { name: /打开睡眠硬件中心/ }).first().click();
  const panel = page.locator(".sleep-hardware-panel");
  await panel.evaluate((element) => element.scrollTo({ top: element.scrollHeight }));
  await expect.poll(() => panel.evaluate((element) => element.scrollTop)).toBeGreaterThan(100);
  await page.getByRole("button", { name: "关闭", exact: true }).click();

  await page.getByRole("button", { name: /打开睡眠硬件中心/ }).first().click();
  await expect.poll(() => panel.evaluate((element) => element.scrollTop)).toBeLessThan(5);
  await page.getByRole("button", { name: /静默枕/ }).click();
  await page.getByRole("tab", { name: /真实桥接/ }).click();
  await page.getByRole("button", { name: /Oura Cloud/ }).click();
  await page.getByRole("button", { name: "关闭", exact: true }).click();

  await expect(page.locator(".sleep-handoff-card")).toContainText("雾灯睡眠戒已待命");
  const hardwareState = await page.evaluate(() => JSON.parse(localStorage.getItem("night-shift-sleep-hardware-v1")!).state);
  expect(hardwareState).toMatchObject({
    mode: "virtual",
    selectedDeviceId: "night-ring",
    consent: { sourceId: "night-ring" },
  });
});

test("anchors the desktop handoff and resets long-view scroll positions", async ({ page }) => {
  await openFirstNight(page);
  const handoff = page.getByRole("button", { name: /今晚交给你了/ });
  const nav = page.getByRole("navigation", { name: "主要导航" });
  await expect(handoff).toBeVisible();
  await expectNoOverlap(handoff, nav);
  await page.keyboard.press("Tab");
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle)).toBe("solid");

  await page.getByRole("button", { name: "收藏", exact: true }).click();
  await expect(page.locator(".collection-page")).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 1200));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);
  await page.getByRole("button", { name: "收藏", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.getByRole("button", { name: "档案", exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test("keeps returned postcards in the journey album", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /DEMO MODE/ }).click();
  await page.getByRole("button", { name: /03 没有退房的307/ }).click();
  await page.getByRole("button", { name: /收藏/ }).click();

  await expect(page.getByText("灯港拒收件")).toBeVisible();
  await expect(page.getByText("寄往无人之处")).toBeVisible();
  await expect(page.getByText(/第二版回答 · 灯港花店后室/)).toBeVisible();
  await expect(page.getByText("雾灯城寄回的 5 个夜晚")).toBeVisible();
  await expect(page.getByText("雾灯温室")).toBeVisible();
  await expect(page.getByText("城市人情簿")).toBeVisible();
  await expect(page.getByText("城市值更簿")).toBeVisible();
  await expect(page.locator(".watch-ledger-entry:not(.locked)")).toHaveCount(2);
  await expect(page.locator(".watch-ledger-entry:not(.locked)").first()).toContainText("夜半时分");
  await expect(page.getByText("口袋抽屉")).toBeVisible();
  await expect(page.locator(".pocket-object.unlocked")).toHaveCount(2);
  await expect(page.locator(".pocket-object.locked")).toHaveCount(7);
  await expect(page.getByRole("heading", { name: "错页登记处" })).toBeVisible();
  await expect(page.locator(".society-current-address b", { hasText: "可借阅的旁注" })).toBeVisible();
  await expect(page.getByText("问函与答复履历")).toBeVisible();
  await expect(page.getByText("让错字继续保护地址")).toBeVisible();
  await expect(page.getByRole("heading", { name: "票根灯蕨" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "四十三日夜香" })).toBeVisible();
  await page.getByRole("button", { name: "档案" }).click();
  await expect(page.getByText("雾灯城分区志")).toBeVisible();
  await expect(page.getByRole("heading", { name: "灯港区" })).toBeVisible();
  await expect(page.locator(".district-entry.unlocked")).toHaveCount(1);
  await expect(page.locator(".district-entry.locked")).toHaveCount(2);
  await expect(page.getByText("相关人物")).toBeVisible();
  await expect(page.getByRole("heading", { name: "米娜·索莱尔" })).toBeVisible();
  await expect(page.locator(".person-dossier.encountered")).toHaveCount(1);
  await expect(page.locator(".person-dossier.locked")).toHaveCount(3);
});

test("returns a prior society answer in a later letter", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /DEMO MODE/ }).click();
  await page.getByRole("button", { name: /03 没有退房的307/ }).click();
  await page.getByRole("button", { name: /替307号房完成退房/ }).click();
  await page.getByRole("button", { name: /今晚交给你了/ }).click();
  await page.getByRole("button", { name: /跳到清晨/ }).click();

  await expect(page.getByText(/上次答复的余波/)).toBeVisible();
  await expect(page.getByText(/不存在的申请如今有了你的署名/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "致「获准误分类者」" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "吉迪恩·韦尔" })).toBeVisible();
  await expect(page.getByText(/司机不决定乘客为什么离开/)).toBeVisible();
});

test("files an optional daytime notice and returns its echo after the next night", async ({ page }) => {
  await openFirstNight(page);
  await page.getByRole("button", { name: /今晚交给你了/ }).click();
  await page.getByRole("button", { name: /跳到清晨/ }).click();
  await page.getByRole("button", { name: /整理线索，准备下一夜/ }).click();
  await page.getByRole("button", { name: /^今晚$/ }).click();

  await expect(page.getByText("门缝下的三张纸")).toBeVisible();
  await expect(page.locator(".daytime-notice-list details")).toHaveCount(3);
  await page.locator(".daytime-notice-list details").first().locator("summary").click();
  await page.locator(".daytime-notice-list details").first().getByRole("button").first().click();
  await expect(page.getByText(/选择已保存/)).toBeVisible();

  await page.locator(".choice-list .choice").first().click();
  await page.getByRole("button", { name: /今晚交给你了/ }).click();
  await page.getByRole("button", { name: /跳到清晨/ }).click();
  await expect(page.locator(".opportunity-echo")).toBeVisible();
  await expect(page.getByText(/不改变案件成果或结局资格/)).toBeVisible();

  await page.getByRole("button", { name: /整理线索，准备下一夜/ }).click();
  await page.getByRole("button", { name: /收藏/ }).click();
  await expect(page.getByText("城市剪报册")).toBeVisible();
  await expect(page.locator(".city-clipping-book article.filed")).toHaveCount(1);
});

test("restores and settles a real night after reload", async ({ page }) => {
  await openFirstNight(page);
  await page.getByRole("button", { name: /今夜真实交接/ }).click();
  await page.getByRole("button", { name: /开始今夜的真实交接/ }).click();
  await expect(page.getByText(/城市记得交接的时刻/)).toBeVisible();
  await expect(page.locator(".city-watch-live")).toContainText(/掌灯时分|夜半时分|末更时分|白昼小憩/);
  const watchBeforeReload = await page.locator(".city-watch-live b").textContent();
  await page.getByRole("button", { name: /我只是醒了一下/ }).click();
  await expect(page.locator(".wake-echo-slip")).toContainText("纸纤维里的第二场雨");
  await expect(page.getByRole("button", { name: /已记录，夜班继续/ })).toBeDisabled();

  await page.reload();
  await expect(page.getByText(/真实夜班/)).toBeVisible();
  await expect(page.locator(".city-watch-live b")).toHaveText(watchBeforeReload!);
  await expect(page.locator(".wake-echo-slip")).toContainText("纸纤维里的第二场雨");
  await page.getByRole("button", { name: /我醒了，拆开报告/ }).click();
  await expect(page.getByText("昨夜调查完成")).toBeVisible();
  await expect(page.getByText("真实夜班")).toBeVisible();
  await expect(page.locator(".wake-echo-report")).toContainText("你短暂醒来时，夜班没有结束");
  await expect(page.locator(".wake-echo-report")).toContainText("不是奖励");
  await page.getByRole("button", { name: /整理线索，准备下一夜/ }).click();
  await page.getByRole("button", { name: "收藏", exact: true }).click();
  await expect(page.getByText("睡隙回声簿")).toBeVisible();
  await expect(page.locator(".sleep-gap-entry.returned")).toHaveCount(1);
});

test("builds a core inference by connecting two evidence cards", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /DEMO MODE/ }).click();
  await page.getByRole("button", { name: /解锁完整案件板/ }).click();
  await page.getByRole("button", { name: /^EVENT · 02 四十三天/ }).click();
  await expect(page.getByRole("heading", { name: "四十三天" })).toBeVisible();
  await expect(page.getByText(/某位顾客长期迟到而形成的礼貌习惯/)).toBeVisible();
  await expect(page.getByText(/有人七年没有忘记按时想念/)).toBeVisible();
  await expect(page.getByRole("region", { name: "联合推理操作台" })).toContainText("再点一张");
  await page.getByRole("button", { name: /^OBJECT · 02 未寄出的明信片/ }).click();
  await expect(page.getByRole("button", { name: /移除证物 A：四十三天/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /移除证物 B：未寄出的明信片/ })).toBeVisible();
  const [board, panel, slotA, slotB, connectAction] = await Promise.all([
    page.locator(".board-shell").boundingBox(),
    page.locator(".relation-panel").boundingBox(),
    page.locator(".inference-workbench .slot-a").boundingBox(),
    page.locator(".inference-workbench .slot-b").boundingBox(),
    page.getByRole("button", { name: /核对这两件证物/ }).boundingBox(),
  ]);
  expect(board).not.toBeNull();
  expect(panel).not.toBeNull();
  expect(slotA).not.toBeNull();
  expect(slotB).not.toBeNull();
  expect(connectAction).not.toBeNull();
  expect(board!.x + board!.width).toBeLessThanOrEqual(panel!.x);
  expect(slotA!.y + slotA!.height).toBeLessThanOrEqual(slotB!.y);
  expect(slotB!.y + slotB!.height).toBeLessThanOrEqual(connectAction!.y);
  await expect(page.locator(".relation-panel > :last-child")).toHaveClass(/relation-ledger/);
  await page.getByRole("button", { name: /核对这两件证物/ }).click();

  await expect(page.locator(".relation-ledger").getByText("米娜知道伊芙琳仍然活着", { exact: true })).toBeVisible();
  await expect(page.getByText(/共同证明米娜一直替她维持联络/)).toBeVisible();
  await expect(page.getByText("这份证物已经参与作证")).toBeVisible();
  await expect(page.locator(".react-flow__edge")).toHaveCount(1);
});

test("shares one clue as a QR deep link", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /DEMO MODE/ }).click();
  await page.getByRole("button", { name: /解锁完整案件板/ }).click();
  await page.getByRole("button", { name: /^EVENT · 02 四十三天/ }).click();
  await page.getByRole("button", { name: /送给好友/ }).click();

  const dialog = page.getByRole("dialog", { name: /把「四十三天」/ });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/不会附带你的夜班进度/)).toBeVisible();
  await expect(dialog.getByLabel("好友线索链接")).toHaveValue(`${new URL(page.url()).origin}/?case=case-001&clue=flower-cycle`);
  await expect(dialog.getByRole("img", { name: /分享线索「四十三天」的二维码/ })).toHaveAttribute("src", /^data:image\/png;base64,/);
  await dialog.getByRole("button", { name: "复制链接" }).click();
  await expect(dialog.getByRole("button", { name: "链接已复制" })).toBeVisible();
  await dialog.getByRole("button", { name: "关闭线索分享" }).click();
  await expect(dialog).toHaveCount(0);
});

test("receives a friend clue from a validated query without advancing the case", async ({ page }) => {
  await page.goto("/?clue=postcard");

  await expect(page.locator(".clue-gift-notice")).toContainText("好友送来「未寄出的明信片」");
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: /把城市说过的谎/ })).toBeVisible();
  await expect(page.locator('.react-flow__node[data-id="postcard"] .board-node.received')).toBeVisible();
  await expect(page.locator('.react-flow__node[data-id="postcard"]')).toContainText("好友送达");
  const importedState = await page.evaluate(() => JSON.parse(localStorage.getItem("night-shift-save-v1")!).state);
  expect(importedState).toMatchObject({
    started: true,
    chapter: 1,
    phase: "day",
    unlockedClueIds: ["postcard"],
    receivedClueIds: ["postcard"],
    completedReports: [],
    confirmedRelations: [],
  });

  await page.goto("/?clue=postcard");
  await expect(page.locator(".clue-gift-notice")).toContainText("已经收过");
  const repeatedState = await page.evaluate(() => JSON.parse(localStorage.getItem("night-shift-save-v1")!).state);
  expect(repeatedState.receivedClueIds).toEqual(["postcard"]);
});

test("routes a shared clue to its campaign and keeps the other save isolated", async ({ page }) => {
  await page.goto("/?case=case-002&clue=radio-warm-dial");

  await expect(page.locator(".clue-gift-notice")).toContainText("好友送来「仍有余温的旋钮」");
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: /把城市说过的谎/ })).toBeVisible();
  await expect(page.locator('.react-flow__node[data-id="radio-warm-dial"] .board-node.received')).toBeVisible();
  const importedState = await page.evaluate(() => JSON.parse(localStorage.getItem("night-shift-save-v1")!).state);
  expect(importedState).toMatchObject({
    campaignId: "case-002",
    receivedClueIds: ["radio-warm-dial"],
    unlockedClueIds: ["radio-warm-dial"],
  });

  await page.getByRole("button", { name: /夜班侦探/ }).click();
  await page.getByRole("button", { name: /CASE 001/ }).click();
  await expect(page.getByRole("button", { name: /开始第 001 宗案件/ })).toBeVisible();
  await page.getByRole("button", { name: /CASE 002/ }).click();
  await expect(page.getByRole("button", { name: /继续当前案件/ })).toBeVisible();
});

test("rejects an unknown friend clue without starting a save", async ({ page }) => {
  await page.goto("/?clue=not-a-real-clue");

  await expect(page.locator(".clue-gift-notice")).toContainText("这封线索无法归档");
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { name: /你睡着以后/ })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("night-shift-save-v1"))).toBeNull();
});

test("remembers a hand-arranged evidence desk after reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /DEMO MODE/ }).click();
  await page.getByRole("button", { name: /解锁完整案件板/ }).click();
  await expect(page.locator(".demo-drawer")).toHaveCount(0);
  const handle = page.locator('.react-flow__node[data-id="ticket-date"] .board-node-drag-handle');
  const box = await handle.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2 + 130, box!.y + box!.height / 2 + 75, { steps: 8 });
  await page.mouse.up();

  await expect.poll(async () => page.evaluate(() => {
    const raw = localStorage.getItem("night-shift-save-v1");
    return raw ? JSON.parse(raw).state.boardPositions?.["ticket-date"] ?? null : null;
  })).not.toBeNull();

  const storedBeforeReload = await page.evaluate(() => JSON.parse(localStorage.getItem("night-shift-save-v1")!).state.boardPositions["ticket-date"] as { x: number; y: number });
  expect(storedBeforeReload.x).not.toBe(70);
  await page.reload();
  await page.getByRole("button", { name: "案件板" }).click();
  await expect(page.locator('.react-flow__node[data-id="ticket-date"]')).toBeVisible();
  const storedAfterReload = await page.evaluate(() => JSON.parse(localStorage.getItem("night-shift-save-v1")!).state.boardPositions["ticket-date"] as { x: number; y: number });
  expect(storedAfterReload).toEqual(storedBeforeReload);

  await page.getByRole("button", { name: /恢复摆放/ }).click();
  await expect.poll(() => page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem("night-shift-save-v1")!).state.boardPositions).length)).toBe(0);
});

test("carries the hidden-platform tableau through final choice and ending", async ({ page }) => {
  await reachFinalDecision(page);
  await expect(page.locator(".ending-background")).toHaveAttribute("src", /hidden-platform-tableau-v1/);
  await page.getByRole("button", { name: /公开档案/ }).click();
  await expect(page.getByRole("heading", { name: "公开档案" })).toBeVisible();
  await expect(page.locator(".ending-background")).toHaveAttribute("src", /hidden-platform-tableau-v1/);
  await expect(page.getByText("FINAL LETTER · 林渡终函")).toBeVisible();
  await expect(page.getByRole("heading", { name: "5 夜归来总账" })).toBeVisible();
  await expect(page.locator(".ending-night-entry")).toHaveCount(5);
  await expect(page.locator(".ending-evidence-item")).toHaveCount(8);
  await expect(page.getByRole("button", { name: /选择其他案件/ })).toBeEnabled();

  await page.getByRole("button", { name: /重看档案/ }).click();
  await expect(page.getByRole("heading", { name: /零点四十三分/ })).toBeVisible();
  await expect(page.getByText("雾灯城分区志")).toBeVisible();
  await page.getByRole("button", { name: /回到结案页/ }).click();
  await expect(page.getByRole("heading", { name: "5 夜归来总账" })).toBeVisible();
});

test("completes all five nights from a new save without chapter jumps", async ({ page }) => {
  const reportTitles = ["不存在的车票", "每隔四十三天的花", "没有退房的307", "地图上被刮掉的线", "最后一班车"];
  await openFirstNight(page);

  for (let chapter = 1; chapter <= 5; chapter += 1) {
    if (chapter > 1) {
      await page.getByRole("button", { name: /^今晚$/ }).click();
      await page.getByRole("button", { name: /全部收起，不拆/ }).click();
      await page.locator(".choice-list .choice").first().click();
    }

    await page.getByRole("button", { name: /今晚交给你了/ }).click();
    await page.getByRole("button", { name: /跳到清晨/ }).click();
    await expect(page.locator(".report-hero").getByRole("heading", { name: reportTitles[chapter - 1] })).toBeVisible();
    await expect(page.locator(".sleep-summary").getByText(`第 ${chapter} 枚夜印`)).toBeVisible();
    await page.getByRole("button", { name: chapter === 5 ? /做出最终决定/ : /整理线索，准备下一夜/ }).click();
  }

  await expect(page.getByRole("heading", { name: /最后的决定/ })).toBeVisible();
  await page.getByRole("button", { name: /保护证人/ }).click();
  await expect(page.getByRole("heading", { name: "保护证人" })).toBeVisible();
});

test("switches to the rain-radio campaign and completes its five-night story", async ({ page }) => {
  const reportTitles = ["无人频率", "比明天早一天的新闻", "沉默的接线间", "被蓝笔删掉的街区", "把频率还给谁"];
  await page.goto("/");
  await page.getByRole("button", { name: /CASE 002/ }).click();
  await page.getByRole("button", { name: /开始第 002 宗案件/ }).click();
  await page.getByRole("button", { name: "继续" }).click();
  await page.getByRole("button", { name: "继续" }).click();
  await page.getByRole("button", { name: /进入事务所/ }).click();
  await page.getByRole("button", { name: /拆开仍有余温的旋钮/ }).click();

  for (let chapter = 1; chapter <= 5; chapter += 1) {
    if (chapter > 1) {
      await page.getByRole("button", { name: /^今晚$/ }).click();
      await page.getByRole("button", { name: /全部收起，不拆/ }).click();
      await page.locator(".choice-list .choice").first().click();
    }
    await page.getByRole("button", { name: /今晚交给你了/ }).click();
    await page.getByRole("button", { name: /跳到清晨/ }).click();
    await expect(page.locator(".report-hero").getByRole("heading", { name: reportTitles[chapter - 1] })).toBeVisible();
    await page.getByRole("button", { name: chapter === 5 ? /做出最终决定/ : /整理线索，准备下一夜/ }).click();
  }

  await expect(page.getByRole("heading", { name: /最后一次广播/ })).toBeVisible();
  await page.getByRole("button", { name: /封存证词/ }).click();
  await expect(page.getByRole("heading", { name: "封存证词" })).toBeVisible();
  await expect(page.getByText(/雨已经停了/)).toBeVisible();
  await page.getByRole("button", { name: /选择其他案件/ }).click();
  await expect(page.getByRole("button", { name: /CASE 001/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /继续当前案件/ })).toBeVisible();
});

test("restores a real Blackwater Creek expedition after reload and settles it once", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /CASE 003/ }).click();
  await page.getByRole("button", { name: /开始第 003 宗案件/ }).click();

  const bootlegger = page.locator("article", { hasText: "波士顿私酒贩小队" });
  await bootlegger.getByRole("button", { name: /以此身份进入山谷/ }).click();
  await page.locator(".sandbox-map").getByRole("button", { name: /08 卡莫迪农场/ }).click();
  const negotiation = page.locator("article", { hasText: "同达米恩谈一笔更大的生意" });
  await negotiation.getByRole("button", { name: "安排今晚调查" }).click();
  await page.getByRole("button", { name: "真实夜班" }).click();
  await page.getByRole("button", { name: /今晚交给调查队/ }).click();

  await expect(page.getByRole("heading", { name: "同达米恩谈一笔更大的生意" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "同达米恩谈一笔更大的生意" })).toBeVisible();
  await expect(page.getByRole("button", { name: /我回来了，拆开晨报/ })).toBeVisible();
  await page.getByRole("button", { name: /我回来了，拆开晨报/ }).click();
  await expect(page.getByText("昨夜调查完成")).toBeVisible();
  await expect(page.getByText("每周驶向波士顿的货单")).toBeVisible();
  await page.reload();
  await expect(page.getByText("昨夜调查完成")).toBeVisible();
  await expect(page.getByText("每周驶向波士顿的货单")).toHaveCount(1);
});

test.describe("mobile 390x844", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("switches campaign cards without overflow on the landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".campaign-shelf")).toBeVisible();
    await expect(page.locator(".featured-case")).toContainText("零点四十三分的末班车");
    await expectMinimumTapTargets(page.locator(".campaign-shelf button"));
    await page.getByRole("button", { name: /CASE 002/ }).click();
    await expect(page.getByRole("button", { name: /开始第 002 宗案件/ })).toBeVisible();
    await expectNoPageOverflow(page);
    await page.getByRole("button", { name: /CASE 001/ }).click();
    await expect(page.getByRole("button", { name: /开始第 001 宗案件/ })).toBeVisible();
  });

  test("plays the Blackwater Creek bootlegger route through a stateful ending", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /CASE 003/ }).click();
    await page.getByRole("button", { name: /开始第 003 宗案件/ }).click();

    const bootlegger = page.locator("article", { hasText: "波士顿私酒贩小队" });
    await bootlegger.getByRole("button", { name: /以此身份进入山谷/ }).click();
    await page.getByRole("button", { name: /打开睡眠硬件中心/ }).click();
    await page.getByRole("button", { name: /静默枕/ }).click();
    await page.getByRole("button", { name: /授权并连接 静默枕/ }).click();
    await page.getByRole("button", { name: "关闭", exact: true }).click();
    await page.locator(".sandbox-map").getByRole("button", { name: /08 卡莫迪农场/ }).click();

    const negotiation = page.locator("article", { hasText: "同达米恩谈一笔更大的生意" });
    await negotiation.getByRole("button", { name: "安排今晚调查" }).click();
    await expect(page.getByRole("heading", { name: "把这一程交给夜班。" })).toBeVisible();
    await expectNoPageOverflow(page);
    await page.getByRole("button", { name: /今晚交给调查队/ }).click();
    await expect(page.getByRole("heading", { name: "同达米恩谈一笔更大的生意" })).toBeVisible();
    await expect(page.locator(".sleep-live-telemetry")).toContainText("静默枕正在记录");
    await expectNoPageOverflow(page);
    await page.getByRole("button", { name: /跳到清晨/ }).click();
    await expect(page.getByText("昨夜调查完成")).toBeVisible();
    await expect(page.getByText("每周驶向波士顿的货单")).toBeVisible();
    await expect(page.locator(".sleep-morning-receipt")).toContainText("静默枕留下的一夜");
    await expectNoPageOverflow(page);
    await page.getByRole("button", { name: /归档晨报，准备下一夜/ }).click();
    await page.getByRole("navigation", { name: "黑水溪卷宗导航" }).getByRole("button", { name: /收场/ }).click();
    await expect(page.getByRole("heading", { name: "接管威士忌生意" })).toBeVisible();

    await page.getByRole("button", { name: "以此收场" }).click();
    await expect(page.getByRole("heading", { name: "接管威士忌生意" })).toBeVisible();
    await expect(page.getByText(/原作者 Scott Dorward/)).toBeVisible();
    await expectNoPageOverflow(page);

    await page.getByRole("button", { name: "重看证物" }).click();
    await expect(page.getByRole("heading", { name: "证物与展示材料" })).toBeVisible();
    await page.getByRole("navigation", { name: "黑水溪卷宗导航" }).getByRole("button", { name: /收场/ }).click();
    await expect(page.getByRole("heading", { name: "接管威士忌生意" })).toBeVisible();
  });

  test("keeps the first-night loop touchable without page overflow", async ({ page }) => {
    await openFirstNight(page);
    await expect(page.locator(".handoff-portrait img")).toBeVisible();
    await expect(page.locator(".handoff-docket")).toContainText("纸张的证词");
    await expectNoOverlap(page.locator(".scene-copy"), page.locator(".handoff-portrait"));
    await expectNoOverlap(page.locator(".handoff-docket"), page.locator(".handoff-portrait"));
    await expectNoPageOverflow(page);
    await expectMinimumTapTargets(page.locator(".bottom-nav button, .mode-toggle button, .quality-tabs button"));
    await page.locator(".quality-tabs").getByRole("button", { name: "断续" }).click();
    await page.getByRole("button", { name: /今晚交给你了/ }).scrollIntoViewIfNeeded();
    await expectNoOverlap(page.getByRole("button", { name: /今晚交给你了/ }), page.getByRole("navigation", { name: "主要导航" }));
    await page.getByRole("button", { name: /今晚交给你了/ }).click();
    await expect(page.locator(".city-watch-live")).toContainText("夜半时分");
    await expectNoPageOverflow(page);
    await page.getByRole("button", { name: /跳到清晨/ }).click();
    await expect(page.getByText("昨夜调查完成")).toBeVisible();
    await expect(page.locator(".city-watch-report")).toBeVisible();
    await expect(page.locator(".wake-echo-report")).toContainText("纸纤维里的第二场雨");
    await expectNoPageOverflow(page);
    await page.getByRole("button", { name: /整理线索，准备下一夜/ }).click();
    await expect(page.getByRole("button", { name: "案件板" })).toBeVisible();
  });

  test("keeps a maximum unbroken local rest intention inside the mobile report", async ({ page }) => {
    await openFirstNight(page);
    const intention = "x".repeat(160);
    await page.getByLabel("放下纸条").fill(intention);
    await expect(page.getByRole("button", { name: /请 AI 替林渡选择晨间短笺风格/ })).toHaveAttribute("aria-pressed", "false");
    await expectNoPageOverflow(page);
    await page.getByRole("button", { name: /今晚交给你了/ }).click();
    await page.getByRole("button", { name: /跳到清晨/ }).click();
    await expect(page.locator(".rest-reflection-card")).toContainText("仅本机 · 固定回信");
    await expect(page.locator(".rest-reflection-card")).toContainText(intention);
    await expectNoPageOverflow(page);
  });

  test("keeps the sleep hardware panel touchable and contained on a phone", async ({ page }) => {
    await openFirstNight(page);
    const hardwareEntry = page.getByRole("button", { name: /打开睡眠硬件中心/ }).first();
    await expect(hardwareEntry).toContainText("睡眠设备");
    await expectMinimumTapTargets(hardwareEntry);
    await hardwareEntry.click();
    await expect(page.getByRole("dialog", { name: /把一夜的微光/ })).toBeVisible();
    await expect(page.locator(".sleep-device-grid img")).toHaveCount(4);
    await expectMinimumTapTargets(page.locator(".sleep-source-tabs button, .sleep-device-grid > button, .sleep-hardware-panel-header > button"));
    await expectNoPageOverflow(page);
    await page.getByRole("button", { name: /静默枕/ }).click();
    await page.getByRole("button", { name: /授权并连接 静默枕/ }).click();
    await expect(page.getByText("连接完成，可以回到游戏了")).toBeVisible();
    await expectNoPageOverflow(page);
    await page.getByRole("button", { name: "关闭", exact: true }).click();
    await expect(page.locator(".sleep-handoff-card")).toContainText("静默枕已待命");
  });

  test("opens long collections and connects evidence on a phone", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /DEMO MODE/ }).click();
    await page.getByRole("button", { name: /04 地图上被刮掉的线/ }).click();
    await page.getByRole("button", { name: "收藏", exact: true }).click();
    await expect(page.getByText("雾灯温室")).toBeVisible();
    await expectNoPageOverflow(page);
    await page.getByRole("button", { name: "档案", exact: true }).click();
    await expect(page.getByText("雾灯城分区志")).toBeVisible();
    await expectNoPageOverflow(page);

    await page.getByRole("button", { name: /DEMO/ }).click();
    await page.getByRole("button", { name: /解锁完整案件板/ }).click();
    await expect(page.locator(".demo-drawer")).toHaveCount(0);
    await expect(page.getByRole("region", { name: "联合推理操作台" })).toContainText("上下滑动可以继续阅档");
    await expect(page.locator(".board-node-drag-handle").first()).toBeHidden();
    await expect(page.locator(".board-flow .react-flow__pane")).toHaveCSS("touch-action", "pan-y");
    const boardFlow = page.locator(".board-flow");
    await boardFlow.scrollIntoViewIfNeeded();
    const boardFlowBox = await boardFlow.boundingBox();
    expect(boardFlowBox).not.toBeNull();
    const scrollBeforeBoardGesture = await page.evaluate(() => window.scrollY);
    await page.mouse.move(boardFlowBox!.x + boardFlowBox!.width / 2, Math.min(boardFlowBox!.y + boardFlowBox!.height / 2, 760));
    await page.mouse.wheel(0, 360);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(scrollBeforeBoardGesture);
    await page.getByRole("button", { name: /^EVENT · 02 四十三天/ }).click();
    await expect(page.getByRole("heading", { name: "四十三天" })).toBeVisible();
    await expect(page.getByText(/有人七年没有忘记按时想念/)).toBeVisible();
    await expect(page.getByRole("region", { name: "联合推理操作台" })).toContainText("再点一张");
    await page.getByRole("button", { name: /^OBJECT · 02 未寄出的明信片/ }).click();
    const [slotA, slotB, connectAction] = await Promise.all([
      page.locator(".inference-workbench .slot-a").boundingBox(),
      page.locator(".inference-workbench .slot-b").boundingBox(),
      page.getByRole("button", { name: /核对这两件证物/ }).boundingBox(),
    ]);
    expect(slotA).not.toBeNull();
    expect(slotB).not.toBeNull();
    expect(connectAction).not.toBeNull();
    expect(slotA!.y + slotA!.height).toBeLessThanOrEqual(slotB!.y);
    expect(slotB!.y + slotB!.height).toBeLessThanOrEqual(connectAction!.y);
    await expect(page.locator(".relation-panel > :last-child")).toHaveClass(/relation-ledger/);
    await page.getByRole("button", { name: /核对这两件证物/ }).click();
    await expect(page.locator(".relation-ledger").getByText("米娜知道伊芙琳仍然活着", { exact: true })).toBeVisible();
    await expectNoPageOverflow(page);
  });

  test("keeps the five-night closing ledger readable and reversible on a phone", async ({ page }) => {
    await reachFinalDecision(page);
    await page.getByRole("button", { name: /保护证人/ }).click();
    await expect(page.getByRole("heading", { name: "保护证人" })).toBeVisible();
    await expect(page.locator(".ending-night-entry")).toHaveCount(5);
    await expect(page.locator(".ending-evidence-item")).toHaveCount(8);
    await expect(page.getByRole("button", { name: /选择其他案件/ })).toBeEnabled();
    await expectNoPageOverflow(page);

    await page.getByRole("button", { name: /重看档案/ }).click();
    await expect(page.getByRole("button", { name: /回到结案页/ })).toBeVisible();
    await expectNoPageOverflow(page);
    await page.getByRole("button", { name: /回到结案页/ }).click();
    await expect(page.getByRole("heading", { name: "5 夜归来总账" })).toBeVisible();
    await expectNoPageOverflow(page);
  });
});
