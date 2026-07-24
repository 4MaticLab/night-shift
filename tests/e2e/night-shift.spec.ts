import { expect, test } from "@playwright/test";

async function openFirstNight(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /开始第 001 宗案件/ }).click();
  await page.getByRole("button", { name: "继续" }).click();
  await page.getByRole("button", { name: "继续" }).click();
  await page.getByRole("button", { name: /进入事务所/ }).click();
  await page.getByRole("button", { name: /让纸张先开口/ }).click();
}

async function selectCampaign(page: import("@playwright/test").Page, name: string | RegExp) {
  await expect(page.locator(".campaign-wheel")).not.toHaveClass(/inert/);
  const wheel = page.getByRole("listbox", { name: "Option wheel" });
  const option = wheel.getByRole("option", { name });
  await option.dispatchEvent("click");
  await expect(option).toHaveAttribute("aria-selected", "true");
}

async function expectNoPageOverflow(page: import("@playwright/test").Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

async function expectNoOverlap(first: import("@playwright/test").Locator, second: import("@playwright/test").Locator) {
  const [a, b] = await Promise.all([first.boundingBox(), second.boundingBox()]);
  expect(a).not.toBeNull();
  expect(b).not.toBeNull();
  expect(
    a!.x + a!.width <= b!.x || b!.x + b!.width <= a!.x || a!.y + a!.height <= b!.y || b!.y + b!.height <= a!.y,
    `Expected boxes not to overlap: ${JSON.stringify({ a, b })}`,
  ).toBe(true);
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

async function runDemoShortcut(page: import("@playwright/test").Page, name: string | RegExp) {
  await page.getByRole("button", { name }).click();
  const confirmation = page.locator(".demo-confirmation");
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole("button", { name: /确认|Stage/ }).click();
}

async function expectDialogLifecycle(page: import("@playwright/test").Page, dialog: import("@playwright/test").Locator) {
  await expect.poll(() => dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("hidden");
  expect(await page.locator("[inert]").count()).toBeGreaterThan(0);
  for (let index = 0; index < 8; index += 1) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Shift+Tab");
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
}

async function openMintableCollection(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /DEMO MODE/ }).click();
  await runDemoShortcut(page, /跳到真结局条件/);
  await page.getByRole("button", { name: "收藏", exact: true }).click();
  await expect(page.locator(".collection-page")).toBeVisible();
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
  await expect(caseLibrary.getByRole("option", { name: "零点四十三分的末班车" })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".case-teaser")).toHaveCount(0);
});

test("opens demo controls without changing a fresh save and confirms snapshot writes", async ({ page }) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: /DEMO MODE/ });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "演示控制台" });
  await expect(dialog).toContainText("只打开控制台，不会改动存档");
  await expect(dialog).toContainText("其他案件的独立存档不会改变");
  await expectDialogLifecycle(page, dialog);
  expect(await page.evaluate(() => localStorage.getItem("night-shift-save-v1"))).toBeNull();

  await dialog.getByRole("button", { name: /03 没有退房的307/ }).click();
  const confirmation = dialog.locator(".demo-confirmation");
  await expect(confirmation).toContainText("替换成该夜开始时的固定演示快照");
  expect(await page.evaluate(() => localStorage.getItem("night-shift-save-v1"))).toBeNull();
  await confirmation.getByRole("button", { name: "取消" }).click();
  await expect(confirmation).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("night-shift-save-v1"))).toBeNull();

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem("night-shift-save-v1"))).toBeNull();

  await trigger.click();
  await runDemoShortcut(page, /03 没有退房的307/);
  await expect(page.getByText("夜 3")).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("night-shift-save-v1")!).state);
  expect(saved).toMatchObject({ started: true, chapter: 3, phase: "day" });

  await page.getByRole("button", { name: "DEMO", exact: true }).click();
  await dialog.getByRole("button", { name: "重置当前案件存档" }).click();
  await expect(dialog.locator(".demo-confirmation")).toContainText("其他案件的独立存档不会改变");
  await dialog.locator(".demo-confirmation").getByRole("button", { name: "取消" }).click();
  const unchanged = await page.evaluate(() => JSON.parse(localStorage.getItem("night-shift-save-v1")!).state);
  expect(unchanged).toMatchObject({ started: true, chapter: 3, phase: "day" });
  await page.keyboard.press("Escape");
});

test("returns to the surface that opened demo controls", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /DEMO MODE/ }).click();
  await runDemoShortcut(page, /03 没有退房的307/);

  const surfaces = [
    { name: "今晨", locator: ".empty-report" },
    { name: "案件板", locator: ".board-page" },
    { name: "今晚", locator: ".tonight-page" },
    { name: "收藏", locator: ".collection-page" },
    { name: "档案", locator: ".archive-page" },
  ];
  for (const surface of surfaces) {
    const navItem = page.getByRole("button", { name: surface.name, exact: true });
    await navItem.click();
    await expect(page.locator(surface.locator)).toBeVisible();
    await page.getByRole("button", { name: "DEMO", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "演示控制台" });
    await dialog.getByRole("button", { name: "关闭演示控制台" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(navItem).toHaveAttribute("aria-current", "page");
    await expect(page.locator(surface.locator)).toBeVisible();
  }

  await page.getByRole("button", { name: /夜班侦探 NIGHT SHIFT/ }).click();
  const library = page.getByRole("region", { name: "案件剧本选择" });
  await expect(library).toBeVisible();
  await page.getByRole("button", { name: /DEMO MODE/ }).click();
  const libraryDialog = page.getByRole("dialog", { name: "演示控制台" });
  await libraryDialog.getByRole("button", { name: "关闭演示控制台" }).click();
  await expect(libraryDialog).toHaveCount(0);
  await expect(library).toBeVisible();
});

test.describe("small widescreen 963x768", () => {
  test.use({ viewport: { width: 963, height: 768 } });

  test("keeps the pre-investigation handoff typography composed", async ({ page }) => {
    await openFirstNight(page);

    const titleLines = page.locator(".scene-title span");
    await expect(titleLines).toHaveCount(2);
    await expect(titleLines.nth(0)).toHaveText("林渡正在整理");
    await expect(titleLines.nth(1)).toHaveText("今晚的装备。");
    expect(await titleLines.evaluateAll((lines) => lines.every((line) => line.scrollWidth <= line.clientWidth + 1))).toBe(true);

    await expect(page.locator(".tonight-page")).toHaveCSS("display", "grid");
    await expectNoOverlap(page.locator(".scene-copy"), page.locator(".handoff-portrait"));
    await expectNoOverlap(page.locator(".handoff-docket"), page.locator(".handoff-portrait"));
    await expectNoPageOverflow(page);
  });
});

test.describe("automatic browser locale", () => {
  test.use({ locale: "en-US" });

  test("renders English on the first response and lets a cookie override it", async ({ page, context }) => {
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(await response?.text()).toContain('<html lang="en"');
    await expect(page.getByRole("heading", { name: /When you fall asleep/ })).toBeVisible();
    await expect(page.locator(".app-boot-screen")).toContainText("The night agency is turning on its lights");
    expect((await context.cookies()).find((cookie) => cookie.name === "night-shift-locale")).toBeUndefined();

    await selectCampaign(page, "The Station That Broadcasts in Rain");
    await expect(page.getByRole("heading", { name: /When you fall asleep/ })).toBeVisible();
    await selectCampaign(page, "黎明前出炉的第十三个面包");
    await expect(page.getByRole("heading", { name: /你睡着以后/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /开始第 003 宗案件/ })).toBeVisible();
    await selectCampaign(page, "千早诺亚的第十三次旅行");
    await expect(page.getByRole("heading", { name: /你睡着以后/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /开始第 004 宗案件/ })).toBeVisible();
    await selectCampaign(page, "The Last Tram at 00:43");
    await expect(page.getByRole("heading", { name: /When you fall asleep/ })).toBeVisible();

    await page.getByRole("button", { name: "中文", exact: true }).click();
    await expect(page.getByRole("heading", { name: /你睡着以后/ })).toBeVisible();
    expect((await context.cookies()).find((cookie) => cookie.name === "night-shift-locale")?.value).toBe("zh-CN");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
    await expect(page.getByRole("heading", { name: /你睡着以后/ })).toBeVisible();
  });
});

test("migrates a legacy local language preference into the cookie", async ({ page, context }) => {
  await page.addInitScript(() => window.localStorage.setItem("night-shift-locale", "en"));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /When you fall asleep/ })).toBeVisible();
  expect((await context.cookies()).find((cookie) => cookie.name === "night-shift-locale")?.value).toBe("en");
});

test("starts an unopened case after returning from a campaign with progress", async ({ page }) => {
  await page.goto("/");
  await selectCampaign(page, "只在雨中播出的电台");
  await page.getByRole("button", { name: /开始第 002 宗案件/ }).click();
  await page.getByRole("button", { name: "继续" }).click();
  await page.getByRole("button", { name: "继续" }).click();
  await page.getByRole("button", { name: /进入事务所/ }).click();

  await page.getByRole("button", { name: /夜班侦探 NIGHT SHIFT/ }).click();
  await selectCampaign(page, "零点四十三分的末班车");
  await page.getByRole("button", { name: /开始第 001 宗案件/ }).click();
  await expect(page.getByRole("heading", { name: "一张来自昨天的旧车票" })).toBeVisible();
});

test("introduces a new case through incident, evidence, and handoff before the first night", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /开始第 001 宗案件/ }).click();
  const prologue = page.locator(".case-prologue");

  await expect(prologue.getByRole("heading", { name: "一张来自昨天的旧车票" })).toBeVisible();
  await expect(prologue).toContainText("事务所门缝");
  await expect(prologue.getByRole("button", { name: "返回案件库" })).toBeVisible();
  await page.getByRole("button", { name: "继续" }).click();
  await expect(prologue.getByRole("heading", { name: "有人仍在为一条废线守夜" })).toBeVisible();
  await expect(prologue).toContainText("被撕掉的终点");
  await page.getByRole("button", { name: "上一幕" }).click();
  await expect(prologue.getByRole("heading", { name: "一张来自昨天的旧车票" })).toBeVisible();
  await page.getByRole("button", { name: "继续" }).click();
  await page.getByRole("button", { name: "继续" }).click();
  await expect(prologue.getByRole("heading", { name: "今晚先让纸张开口" })).toBeVisible();
  await expect(prologue).toContainText("你负责白天推理");
  await page.getByRole("button", { name: /接下案件，进入事务所/ }).click();
  await expect(page.locator(".tonight-page")).toBeVisible();
});

test("plays the first case in English and preserves the language preference", async ({ page, context }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /ENGLISH/ }).click();
  await expect(page.getByRole("button", { name: /Begin Case 001/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /When you fall asleep/ })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: /Begin Case 001/ })).toBeVisible();

  await page.getByRole("button", { name: /Begin Case 001/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /enter the agency/i }).click();
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
  expect((await context.cookies()).find((cookie) => cookie.name === "night-shift-locale")?.value).toBe("en");
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
  await runDemoShortcut(page, /跳到真结局条件/);
  await page.getByRole("button", { name: /去站台等一辆被否认的车/ }).click();
  await page.getByRole("button", { name: /今晚交给你了/ }).click();
  await page.getByRole("button", { name: /跳到清晨/ }).click();
  await page.getByRole("button", { name: /做出最终决定/ }).click();
}

test("starts a case and reaches the first morning report", async ({ page }) => {
  await openFirstNight(page);
  await expect(page.locator(".handoff-portrait img")).toHaveAttribute("src", /lin-du-handoff-portrait-v1/);
  await expect(page.locator(".handoff-docket")).toContainText("纸张的证词");
  await expect(page.locator(".handoff-docket")).toContainText("提灯 · 灯港旧票据工坊");
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
  const [societyCrest, societyLetter] = await Promise.all([
    page.locator(".society-memory-letter > .society-crest").boundingBox(),
    page.locator(".society-memory-letter > .paper-card").boundingBox(),
  ]);
  expect(societyCrest).not.toBeNull();
  expect(societyLetter).not.toBeNull();
  expect(Math.abs(societyCrest!.width - societyLetter!.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(societyCrest!.height - societyLetter!.height)).toBeLessThanOrEqual(1);
  expect(Math.abs(societyCrest!.y - societyLetter!.y)).toBeLessThanOrEqual(1);
  await expect.poll(() => page.locator(".society-memory-letter > .society-crest img").evaluate((image) => {
    const source = image as HTMLImageElement;
    return source.complete && source.naturalWidth > 0;
  })).toBe(true);
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
    preparation: "提灯",
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
  await runDemoShortcut(page, /03 没有退房的307/);
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
  await page.getByRole("button", { name: "档案", exact: true }).click();
  await expect(page.getByText("雾灯城分区志")).toBeVisible();
  await expect(page.getByRole("heading", { name: "灯港区" })).toBeVisible();
  await expect(page.locator(".district-entry.unlocked")).toHaveCount(1);
  await expect(page.locator(".district-entry.locked")).toHaveCount(2);
  await expect(page.getByText("相关人物")).toBeVisible();
  await expect(page.getByRole("heading", { name: "米娜·索莱尔" })).toBeVisible();
  await expect(page.locator(".person-dossier.encountered")).toHaveCount(1);
  await expect(page.locator(".person-dossier.locked")).toHaveCount(3);
});

test("keeps the desktop collection continuous while putting core evidence first", async ({ page }) => {
  await openMintableCollection(page);
  const archiveIndex = page.getByRole("navigation", { name: "收藏档案分类" });
  await expect(archiveIndex).toBeVisible();
  await expectMinimumTapTargets(archiveIndex.locator("button"));
  await expect(page.getByRole("button", { name: /核心物证/ })).toHaveAttribute("aria-pressed", "true");

  const [evidence, journey, city, pocket] = await Promise.all([
    page.locator("#collection-core-evidence").boundingBox(),
    page.locator("#collection-returned-nights").boundingBox(),
    page.locator("#collection-city-echoes").boundingBox(),
    page.locator("#collection-pocket-drawer").boundingBox(),
  ]);
  expect(evidence).not.toBeNull();
  expect(journey).not.toBeNull();
  expect(city).not.toBeNull();
  expect(pocket).not.toBeNull();
  expect(evidence!.y).toBeLessThan(journey!.y);
  expect(journey!.y).toBeLessThan(city!.y);
  expect(city!.y).toBeLessThan(pocket!.y);
  await expect(page.locator(".collection-section")).toHaveCount(9);
  expect(await page.locator(".collection-section").evaluateAll(
    (sections) => sections.every((section) => getComputedStyle(section).display !== "none"),
  )).toBe(true);
  await expectNoPageOverflow(page);
});

test("keeps the Injective keepsake desk honest and responsive when deployment is unconfigured", async ({ page }) => {
  await page.route("**/api/injective/mint-authorization", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        configured: false,
        chainId: 1439,
        chainName: "Injective EVM Testnet",
        rpcUrl: "https://k8s.testnet.json-rpc.injective.network/",
        explorerUrl: "https://testnet.blockscout.injective.network",
      }),
    });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await openMintableCollection(page);
  await expect(page.locator(".collectible-card.locked .collectible-mint-trigger")).toHaveCount(0);
  const mintTrigger = page.getByRole("button", { name: "封进 Injective 链上档案" }).first();
  await mintTrigger.click();

  const dialog = page.getByRole("dialog", { name: "把这件夜班藏品封进链上档案" });
  await expect(dialog).toBeVisible();
  await expectDialogLifecycle(page, dialog);
  await expect(dialog).toContainText("链上档案尚未开门");
  await expect(dialog).toContainText("本地收藏和主线不受影响");
  await expectNoPageOverflow(page);
  await expectMinimumTapTargets(dialog.getByRole("button"));
  const mobileGeometry = await dialog.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      width: rect.width,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
      maxHeight: Number.parseFloat(getComputedStyle(element).maxHeight),
    };
  });
  expect(mobileGeometry.width).toBeGreaterThanOrEqual(380);
  expect(mobileGeometry.width).toBeLessThanOrEqual(390);
  expect(mobileGeometry.scrollWidth).toBe(mobileGeometry.clientWidth);

  await page.setViewportSize({ width: 820, height: 1180 });
  await expect.poll(() => dialog.evaluate((element) => getComputedStyle(element).gridTemplateColumns)).not.toBe("none");
  await expectNoPageOverflow(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  const desktopWidth = await dialog.evaluate((element) => element.getBoundingClientRect().width);
  expect(desktopWidth).toBeLessThanOrEqual(960);
  expect(desktopWidth).toBeGreaterThanOrEqual(900);

  await dialog.getByRole("button", { name: "关闭链上归档" }).click();
  await expect(dialog).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe("hidden");
  await expect(mintTrigger).toBeFocused();
});

test("stores an Injective explorer receipt after the wallet finds an existing mint", async ({ page }) => {
  const wallet = "0x2222222222222222222222222222222222222222";
  const contract = "0x1111111111111111111111111111111111111111";
  const explorerUrl = `https://testnet.blockscout.injective.network/token/${contract}/instance/7`;
  await page.addInitScript((address) => {
    const provider = {
      request: async ({ method }: { method: string }) => {
        if (method === "eth_requestAccounts" || method === "eth_accounts") return [address];
        if (method === "eth_chainId") return "0x59f";
        if (method === "wallet_switchEthereumChain") return null;
        throw new Error(`Unexpected wallet method: ${method}`);
      },
    };
    (window as Window & { ethereum?: typeof provider }).ethereum = provider;
  }, wallet);
  await page.route("**/api/injective/mint-authorization", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          configured: true,
          chainId: 1439,
          chainName: "Injective EVM Testnet",
          rpcUrl: "https://k8s.testnet.json-rpc.injective.network/",
          explorerUrl: "https://testnet.blockscout.injective.network",
          contractAddress: contract,
        }),
      });
      return;
    }
    const request = route.request().postDataJSON();
    expect(request).toMatchObject({ recipient: wallet, campaignId: "case-001" });
    expect(request.requestId).toEqual(expect.any(String));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "already-minted",
        campaignId: request.campaignId,
        collectibleId: request.collectibleId,
        recipient: wallet,
        tokenId: "7",
        explorerUrl,
        contractAddress: contract,
        chainId: 1439,
      }),
    });
  });

  await openMintableCollection(page);
  const trigger = page.getByRole("button", { name: "封进 Injective 链上档案" }).first();
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "把这件夜班藏品封进链上档案" });
  await dialog.getByRole("button", { name: "连接钱包，准备归档" }).click();
  await expect(dialog).toContainText("0x2222…2222");
  await dialog.getByRole("button", { name: "领取签章并铸造" }).click();
  await expect(dialog).toContainText("ARCHIVE RECEIPT · TOKEN #7");
  await expect(dialog.getByRole("link", { name: /在 Injective 浏览器查看回执/ })).toHaveAttribute("href", explorerUrl);
  const savedReceipts = await page.evaluate(() => JSON.parse(localStorage.getItem("night-shift-injective-mints-v1") ?? "{}"));
  expect(Object.values(savedReceipts)).toHaveLength(1);
  expect(JSON.stringify(savedReceipts)).not.toContain("private");

  await dialog.getByRole("button", { name: "收好回执" }).click();
  await expect(page.getByRole("button", { name: "此浏览器已有链上回执" }).first()).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "收藏", exact: true }).click();
  await expect(page.getByRole("button", { name: "此浏览器已有链上回执" }).first()).toBeVisible();
});

test("returns a prior society answer in a later letter", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /DEMO MODE/ }).click();
  await runDemoShortcut(page, /03 没有退房的307/);
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
  await page.getByRole("button", { name: /结束今日，准备下一夜|整理线索，准备下一夜/ }).click();
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

  await page.getByRole("button", { name: /结束今日，准备下一夜|整理线索，准备下一夜/ }).click();
  await page.getByRole("button", { name: /收藏/ }).click();
  await expect(page.getByText("城市剪报册")).toBeVisible();
  await expect(page.locator(".city-clipping-book article.filed")).toHaveCount(1);
  await expect(page.locator(".city-clipping-book article.pending")).toHaveCount(3);
  await expect(page.locator(".clipping-envelope")).toHaveCount(4);
  const clippingCards = await page.locator(".clipping-envelope-grid article").evaluateAll((cards) => cards.map((card) => {
    const box = card.getBoundingClientRect();
    return { width: box.width, height: box.height };
  }));
  expect(Math.max(...clippingCards.map((card) => card.width)) - Math.min(...clippingCards.map((card) => card.width))).toBeLessThanOrEqual(1);
  expect(Math.max(...clippingCards.map((card) => card.height)) - Math.min(...clippingCards.map((card) => card.height))).toBeLessThanOrEqual(1);
  const [clippingHeading, clippingGrid] = await Promise.all([
    page.locator(".clipping-book-heading").boundingBox(),
    page.locator(".clipping-envelope-grid").boundingBox(),
  ]);
  expect(clippingHeading).not.toBeNull();
  expect(clippingGrid).not.toBeNull();
  expect(Math.abs(clippingHeading!.x - clippingGrid!.x)).toBeLessThanOrEqual(1);
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
  await page.getByRole("button", { name: /结束今日，准备下一夜|整理线索，准备下一夜/ }).click();
  await page.getByRole("button", { name: "收藏", exact: true }).click();
  await expect(page.getByText("睡隙回声簿")).toBeVisible();
  await expect(page.locator(".sleep-gap-entry.returned")).toHaveCount(1);
});

test("builds a core inference by connecting two evidence cards", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /DEMO MODE/ }).click();
  await runDemoShortcut(page, /解锁完整案件板/);
  await expect(page.getByRole("region", { name: "线索索引" })).toContainText("12 份档案 · 3 条未结线");
  await expect(page.locator(".board-node.checkable")).toHaveCount(6);
  await expect(page.locator(".clue-index-track i.checkable")).toHaveCount(6);
  await expect(page.locator(".relation-panel")).toHaveCount(0);
  await expect(page.locator(".core-inference-dock")).toBeVisible();
  await page.getByRole("button", { name: /^EVENT · 02 四十三天/ }).click();
  const selectedFlower = page.locator('.react-flow__node[data-id="flower-cycle"] .board-node');
  const matchingPostcard = page.locator('.react-flow__node[data-id="postcard"] .board-node');
  await expect(selectedFlower).toHaveClass(/selected/);
  await expect(selectedFlower.locator(".evidence-slot-mark")).toHaveText("A");
  await expect(matchingPostcard).toHaveClass(/compatible/);
  await expect(matchingPostcard.locator(".evidence-relation-cue.compatible")).toBeVisible();
  await expect(page.getByRole("dialog", { name: "四十三天" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "线索索引" })).toContainText("再点一张");
  await page.getByRole("button", { name: /打开证物档案：四十三天/ }).click();
  const dossierDialog = page.getByRole("dialog", { name: "四十三天" });
  await expect(dossierDialog).toBeVisible();
  await expect(dossierDialog.getByText(/某位顾客长期迟到而形成的礼貌习惯/)).toBeVisible();
  await expect(dossierDialog.getByText(/有人七年没有忘记按时想念/)).toBeVisible();
  await dossierDialog.getByRole("button", { name: "关闭证物档案" }).click();
  await expect(dossierDialog).toHaveCount(0);
  await expectNoPageOverflow(page);
  await page.setViewportSize({ width: 900, height: 720 });
  await expect(page.locator(".board-workspace-solo")).toBeVisible();
  await expect(page.locator(".relation-panel")).toHaveCount(0);
  await expectNoPageOverflow(page);
  const boardFlow = page.locator(".board-flow");
  await page.evaluate(() => window.scrollTo(0, 0));
  const boardFlowBox = await boardFlow.boundingBox();
  expect(boardFlowBox).not.toBeNull();
  const viewportTransformBeforeWheel = await page.locator(".react-flow__viewport").getAttribute("style");
  const scrollBeforeBoardWheel = await page.evaluate(() => window.scrollY);
  await page.mouse.move(boardFlowBox!.x + boardFlowBox!.width / 2, boardFlowBox!.y + Math.min(220, boardFlowBox!.height / 2));
  await page.mouse.wheel(0, 360);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(scrollBeforeBoardWheel);
  await expect(page.locator(".react-flow__viewport")).toHaveAttribute("style", viewportTransformBeforeWheel ?? "");
  await page.locator(".react-flow__pane").dispatchEvent("dblclick");
  await expect(page.locator(".react-flow__viewport")).toHaveAttribute("style", viewportTransformBeforeWheel ?? "");
  await page.getByRole("button", { name: "Zoom In" }).click();
  await expect(page.locator(".react-flow__viewport")).not.toHaveAttribute("style", viewportTransformBeforeWheel ?? "");
  const nodeBoxes = await page.locator(".react-flow__node").evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
  }));
  for (let first = 0; first < nodeBoxes.length; first += 1) {
    for (let second = first + 1; second < nodeBoxes.length; second += 1) {
      const a = nodeBoxes[first];
      const b = nodeBoxes[second];
      expect(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top).toBe(true);
    }
  }
  await page.getByRole("button", { name: /^OBJECT · 02 未寄出的明信片/ }).click();
  const relationDialog = page.getByRole("dialog", { name: "米娜知道伊芙琳仍然活着" });
  await expect(relationDialog).toBeVisible();
  await expect(relationDialog.getByText(/共同证明米娜一直替她维持联络/)).toBeVisible();
  await expect(page.locator(".core-inference-dock").getByText("米娜知道伊芙琳仍然活着", { exact: true })).toBeVisible();
  await relationDialog.getByRole("button", { name: "关闭核心推论" }).click();
  await expect(relationDialog).toHaveCount(0);
  await expect(page.locator(".react-flow__edge")).toHaveCount(1);
  await expect(page.getByRole("region", { name: "线索索引" })).toContainText("12 份档案 · 2 条未结线");
  await expect(page.locator(".clue-index-track i.checkable")).toHaveCount(4);
  await expect(selectedFlower).not.toHaveClass(/checkable/);
  await expect(matchingPostcard).not.toHaveClass(/checkable/);
  await page.getByRole("button", { name: /查看核心推论：米娜知道伊芙琳仍然活着/ }).click();
  await expect(page.getByRole("dialog", { name: "米娜知道伊芙琳仍然活着" })).toBeVisible();
});

test("shares one clue as a QR deep link", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /DEMO MODE/ }).click();
  await runDemoShortcut(page, /解锁完整案件板/);
  await page.getByRole("button", { name: /打开证物档案：四十三天/ }).click();
  const shareTrigger = page.getByRole("button", { name: /送给好友/ });
  await shareTrigger.click();

  const dialog = page.getByRole("dialog", { name: /把「四十三天」/ });
  await expect(dialog).toBeVisible();
  await expectDialogLifecycle(page, dialog);
  await expect(dialog.getByText(/不会附带你的夜班进度/)).toBeVisible();
  await expect(dialog.getByLabel("好友线索链接")).toHaveValue(`${new URL(page.url()).origin}/?case=case-001&clue=flower-cycle`);
  await expect(dialog.getByRole("img", { name: /分享线索「四十三天」的二维码/ })).toHaveAttribute("src", /^data:image\/png;base64,/);
  await dialog.getByRole("button", { name: "复制链接" }).click();
  await expect(dialog.getByRole("button", { name: "链接已复制" })).toBeVisible();
  await dialog.getByRole("button", { name: "关闭线索分享" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(shareTrigger).toBeFocused();
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
  await selectCampaign(page, "零点四十三分的末班车");
  await expect(page.getByRole("button", { name: /开始第 001 宗案件/ })).toBeVisible();
  await selectCampaign(page, "只在雨中播出的电台");
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
  await runDemoShortcut(page, /解锁完整案件板/);
  await expect(page.locator(".demo-drawer")).toHaveCount(0);
  const handle = page.locator('.react-flow__node[data-id="ticket-date"] .board-node-drag-handle');
  await handle.scrollIntoViewIfNeeded();
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

test("remembers the case library after reload (issue #35)", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /开始第 001 宗案件/ }).click();
  await page.getByRole("button", { name: "继续" }).click();
  await page.getByRole("button", { name: "继续" }).click();
  await page.getByRole("button", { name: /进入事务所/ }).click();
  await page.getByRole("button", { name: /让纸张先开口/ }).click();
  await expect(page.locator(".app-shell")).toBeVisible();
  await expect(page.locator(".hero-shell")).toHaveCount(0);

  await page.locator(".brand-mark.compact").click();
  await expect(page.locator(".hero-shell")).toBeVisible();
  await expect(page.getByRole("heading", { name: /When you fall asleep|你睡着以后/ })).toBeVisible();
  await expect(page.locator(".campaign-wheel")).toBeVisible();

  await page.reload();
  await expect(page.locator(".hero-shell")).toBeVisible();
  await expect(page.getByRole("heading", { name: /When you fall asleep|你睡着以后/ })).toBeVisible();
  await expect(page.locator(".campaign-wheel")).toBeVisible();
  await expect(page.locator(".app-shell")).toHaveCount(0);
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
    await page.getByRole("button", { name: chapter === 5 ? /做出最终决定/ : /结束今日，准备下一夜|整理线索，准备下一夜/ }).click();
  }

  await expect(page.getByRole("heading", { name: /最后的决定/ })).toBeVisible();
  await page.getByRole("button", { name: /保护证人/ }).click();
  await expect(page.getByRole("heading", { name: "保护证人" })).toBeVisible();
});

test("switches to the rain-radio campaign and completes its five-night story", async ({ page }) => {
  const reportTitles = ["无人频率", "比明天早一天的新闻", "沉默的接线间", "被蓝笔删掉的街区", "把频率还给谁"];
  await page.goto("/");
  await selectCampaign(page, "只在雨中播出的电台");
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
    await page.getByRole("button", { name: chapter === 5 ? /做出最终决定/ : /结束今日，准备下一夜|整理线索，准备下一夜/ }).click();
  }

  await expect(page.getByRole("heading", { name: /最后一次广播/ })).toBeVisible();
  await page.getByRole("button", { name: /封存证词/ }).click();
  await expect(page.getByRole("heading", { name: "封存证词" })).toBeVisible();
  await expect(page.getByText(/雨已经停了/)).toBeVisible();
  await page.getByRole("button", { name: /选择其他案件/ }).click();
  await expect(page.getByRole("option", { name: "零点四十三分的末班车" })).toBeVisible();
  await expect(page.getByRole("button", { name: /继续当前案件/ })).toBeVisible();
});

test("switches to the thirteenth-loaf campaign and completes its five-night story", async ({ page }) => {
  const reportTitles = ["柜中多出的一只", "没有第十三名烘焙师", "火从炉外开始", "整座街区保管一块酵母", "把一份归还给无人"];
  await page.goto("/");
  await selectCampaign(page, "黎明前出炉的第十三个面包");
  await page.getByRole("button", { name: /开始第 003 宗案件/ }).click();
  await page.getByRole("button", { name: "继续" }).click();
  await page.getByRole("button", { name: "继续" }).click();
  await page.getByRole("button", { name: /进入事务所/ }).click();
  await page.getByRole("button", { name: /守着街边保温柜/ }).click();

  for (let chapter = 1; chapter <= 5; chapter += 1) {
    if (chapter > 1) {
      await page.getByRole("button", { name: /^今晚$/ }).click();
      await page.getByRole("button", { name: /全部收起，不拆/ }).click();
      await page.locator(".choice-list .choice").first().click();
    }
    await page.getByRole("button", { name: /今晚交给你了/ }).click();
    await page.getByRole("button", { name: /跳到清晨/ }).click();
    await expect(page.locator(".report-hero").getByRole("heading", { name: reportTitles[chapter - 1] })).toBeVisible();
    await expect(page.locator(".report-hero-art")).toHaveAttribute("src", /cases\/thirteenth-loaf\/headers\/morning-report-v1/);
    await page.getByRole("button", { name: chapter === 5 ? /做出最终决定/ : /结束今日，准备下一夜|整理线索，准备下一夜/ }).click();
  }

  await expect(page.getByRole("heading", { name: /房契还给十二人以后/ })).toBeVisible();
  await expect(page.locator(".ending-background")).toHaveAttribute("src", /cases\/thirteenth-loaf\/headers\/ending-tableau-v1/);
  await page.getByRole("button", { name: /把火灾报告贴满全城/ }).click();
  await expect(page.getByRole("heading", { name: "把火灾报告贴满全城" })).toBeVisible();
  await expect(page.getByText(/第十三只面包仍用空白纸包着/)).toBeVisible();
});

test("switches to the Chihaya Noa campaign and completes its five-night story", async ({ page }) => {
  const reportTitles = ["明日才抵达的委托人", "两个都记得昨夜的人", "拱灯学会的假东方", "未成线的十二个地址", "拒绝唯一原本"];
  await page.goto("/");
  await selectCampaign(page, "千早诺亚的第十三次旅行");
  await page.getByRole("button", { name: /开始第 004 宗案件/ }).click();
  await page.getByRole("button", { name: "继续" }).click();
  await page.getByRole("button", { name: "继续" }).click();
  await page.getByRole("button", { name: /进入事务所/ }).click();
  await page.getByRole("button", { name: /核对寄宿学校/ }).click();

  for (let chapter = 1; chapter <= 5; chapter += 1) {
    if (chapter > 1) {
      await page.getByRole("button", { name: /^今晚$/ }).click();
      await page.getByRole("button", { name: /全部收起，不拆/ }).click();
      await page.locator(".choice-list .choice").first().click();
    }
    await page.getByRole("button", { name: /今晚交给你了/ }).click();
    await page.getByRole("button", { name: /跳到清晨/ }).click();
    await expect(page.locator(".report-hero").getByRole("heading", { name: reportTitles[chapter - 1] })).toBeVisible();
    await expect(page.locator(".report-hero-art")).toHaveAttribute("src", /cases\/chihaya-noa\/headers\/morning-report-v1/);
    await page.getByRole("button", { name: chapter === 5 ? /做出最终决定/ : /结束今日，准备下一夜|整理线索，准备下一夜/ }).click();
  }

  await expect(page.getByRole("heading", { name: /十三段人生都能自证以后/ })).toBeVisible();
  await expect(page.locator(".ending-background")).toHaveAttribute("src", /cases\/chihaya-noa\/headers\/ending-tableau-v1/);
  await page.getByRole("button", { name: /公开十三次抵达/ }).click();
  await expect(page.getByRole("heading", { name: "公开十三次抵达" })).toBeVisible();
  await expect(page.getByText(/十三次抵达都被看见了/)).toBeVisible();
});

test.describe("tablet portrait 820x1180", () => {
  test.use({ viewport: { width: 820, height: 1180 } });

  test("keeps the three-act case prologue readable and touchable", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /开始第 001 宗案件/ }).click();
    const prologue = page.locator(".case-prologue");

    await expect(prologue.getByRole("heading", { name: "一张来自昨天的旧车票" })).toBeVisible();
    await expectMinimumTapTargets(prologue.locator("button"));
    await expectNoPageOverflow(page);
    await page.getByRole("button", { name: "继续" }).click();
    await page.getByRole("button", { name: "继续" }).click();
    await expect(prologue.getByRole("heading", { name: "今晚先让纸张开口" })).toBeVisible();
    await expectNoPageOverflow(page);
  });

  test("stacks the pre-investigation handoff into a calm reading flow", async ({ page }) => {
    await openFirstNight(page);

    await expect(page.locator(".tonight-page")).toHaveCSS("display", "block");
    await expectNoOverlap(page.locator(".scene-copy"), page.locator(".handoff-portrait"));
    await expectNoOverlap(page.locator(".handoff-docket"), page.locator(".handoff-portrait"));
    const [scene, plan] = await Promise.all([
      page.locator(".desk-scene").boundingBox(),
      page.locator(".plan-panel").boundingBox(),
    ]);
    expect(scene).not.toBeNull();
    expect(plan).not.toBeNull();
    expect(plan!.y).toBeGreaterThanOrEqual(scene!.y + scene!.height - 1);
    await expectNoPageOverflow(page);
  });

  test("keeps the case board and inference desk in one touch-scroll flow", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /DEMO MODE/ }).click();
    await runDemoShortcut(page, /解锁完整案件板/);
    await expect(page.locator(".demo-drawer")).toHaveCount(0);

    await expect(page.locator(".board-workspace")).toHaveCSS("flex-direction", "column");
    await expect(page.locator(".board-flow .react-flow__pane")).toHaveCSS("touch-action", "pan-y");
    await expect(page.locator(".mobile-board-hint")).toBeVisible();
    await expect(page.locator(".desktop-board-hint")).toBeHidden();
    await expectNoPageOverflow(page);

    const [shell, flow, relation] = await Promise.all([
      page.locator(".board-shell").boundingBox(),
      page.locator(".board-flow").boundingBox(),
      page.locator(".relation-panel").boundingBox(),
    ]);
    expect(shell).not.toBeNull();
    expect(flow).not.toBeNull();
    expect(relation).not.toBeNull();
    expect(shell!.width).toBeGreaterThan(780);
    expect(flow!.width).toBeGreaterThan(750);
    expect(relation!.width).toBeGreaterThan(760);
    expect(relation!.y - (shell!.y + shell!.height)).toBeLessThanOrEqual(24);
    expect(await page.locator(".board-node-drag-handle").evaluateAll(
      (handles) => handles.every((handle) => getComputedStyle(handle).display === "none"),
    )).toBe(true);

    await page.locator(".relation-panel").scrollIntoViewIfNeeded();
    await expect(page.getByRole("region", { name: "联合推理操作台" })).toBeVisible();
    await expect(page.getByRole("button", { name: /还需选择 2 件证物/ })).toBeVisible();
    const cipherDisclosure = page.locator(".board-cipher-disclosure");
    await expect(cipherDisclosure).not.toHaveAttribute("open", "");
    await expect(cipherDisclosure.getByText("可选解密")).toBeVisible();
    const [workspaceBox, cipherBox] = await Promise.all([
      page.locator(".board-workspace").boundingBox(),
      cipherDisclosure.boundingBox(),
    ]);
    expect(workspaceBox).not.toBeNull();
    expect(cipherBox).not.toBeNull();
    expect(cipherBox!.y).toBeGreaterThanOrEqual(workspaceBox!.y + workspaceBox!.height - 1);
    await page.locator(".board-cipher-disclosure > summary").click();
    await expect(page.locator(".cipher-desk")).toBeVisible();
    await expectNoPageOverflow(page);
  });

  test("focuses one collection drawer at a time and keeps evidence first", async ({ page }) => {
    await openMintableCollection(page);
    const archiveIndex = page.getByRole("navigation", { name: "收藏档案分类" });
    await expect(archiveIndex).toBeVisible();
    await expectMinimumTapTargets(archiveIndex.locator("button"));
    await expect(page.locator("#collection-core-evidence")).toBeVisible();
    await expect(page.locator("#collection-returned-nights")).toBeHidden();
    await expect(page.locator("#collection-city-echoes")).toBeHidden();
    await expect(page.locator("#collection-pocket-drawer")).toBeHidden();

    await page.getByRole("button", { name: /夜班归来/ }).click();
    await expect(page.locator("#collection-returned-nights")).toBeVisible();
    await expect(page.locator(".night-greenhouse")).toBeVisible();
    await expect(page.locator("#collection-core-evidence")).toBeHidden();
    await page.getByRole("button", { name: /城市回声/ }).click();
    await expect(page.locator("#collection-city-echoes")).toBeVisible();
    await expect(page.locator(".city-watch-ledger")).toBeVisible();
    await expect(page.locator("#collection-returned-nights")).toBeHidden();
    await expectNoPageOverflow(page);
  });
});

test.describe("mobile 390x844", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("keeps the case prologue inside the phone viewport", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /开始第 001 宗案件/ }).click();
    const prologue = page.locator(".case-prologue");

    await expect(prologue.getByRole("heading", { name: "一张来自昨天的旧车票" })).toBeVisible();
    await expectMinimumTapTargets(prologue.locator("button"));
    await expectNoPageOverflow(page);
    await page.getByRole("button", { name: "继续" }).click();
    await expect(prologue.getByRole("heading", { name: "有人仍在为一条废线守夜" })).toBeVisible();
    await expectNoPageOverflow(page);
    await page.getByRole("button", { name: "继续" }).click();
    await expect(prologue.getByRole("button", { name: /接下案件，进入事务所/ })).toBeVisible();
    await expectMinimumTapTargets(prologue.locator("button"));
    await expectNoPageOverflow(page);
  });

  test("switches campaign wheel options without overflow on the landing page", async ({ page }) => {
    await page.goto("/");
    const campaignWheel = page.locator(".campaign-wheel");
    await expect(campaignWheel).toBeVisible();
    await expect(campaignWheel.getByRole("option", { name: "零点四十三分的末班车" })).toHaveAttribute("aria-selected", "true");
    await expectMinimumTapTargets(campaignWheel);
    await selectCampaign(page, "只在雨中播出的电台");
    await expect(page.getByRole("button", { name: /开始第 002 宗案件/ })).toBeVisible();
    await expectNoPageOverflow(page);
    await selectCampaign(page, "黎明前出炉的第十三个面包");
    await expect(page.getByRole("button", { name: /开始第 003 宗案件/ })).toBeVisible();
    await expect(page.getByRole("img", { name: /林渡站在夜班事务所门边/ })).toHaveAttribute(
      "src",
      /cases\/thirteenth-loaf\/headers\/shift-handoff-v1/,
    );
    await expectNoPageOverflow(page);
    await selectCampaign(page, "千早诺亚的第十三次旅行");
    await expect(page.getByRole("button", { name: /开始第 004 宗案件/ })).toBeVisible();
    await expect(page.getByRole("img", { name: /千早诺亚在夜班事务所交接桌前/ })).toHaveAttribute(
      "src",
      /cases\/chihaya-noa\/headers\/shift-handoff-v1/,
    );
    await expectNoPageOverflow(page);
    await selectCampaign(page, "零点四十三分的末班车");
    await expect(page.getByRole("button", { name: /开始第 001 宗案件/ })).toBeVisible();
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
    const reportArchive = page.locator(".report-archive-details");
    await expect(reportArchive).not.toHaveAttribute("open", "");
    await expect(reportArchive.getByText("可选详读")).toBeVisible();
    await expect(page.locator(".city-watch-report")).toBeHidden();
    const compactReportHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(compactReportHeight).toBeLessThan(6000);
    await page.getByRole("button", { name: /结束今日，准备下一夜|整理线索，准备下一夜/ }).scrollIntoViewIfNeeded();
    await expect(page.getByRole("button", { name: /结束今日，准备下一夜|整理线索，准备下一夜/ })).toBeVisible();
    await page.locator(".report-archive-details > summary").click();
    await expect(page.locator(".city-watch-report")).toBeVisible();
    await expect(page.locator(".wake-echo-report")).toContainText("纸纤维里的第二场雨");
    await expectNoPageOverflow(page);
    await page.getByRole("button", { name: /结束今日，准备下一夜|整理线索，准备下一夜/ }).click();
    await expect(page.getByRole("button", { name: "案件板" })).toBeVisible();
  });

  test("keeps a maximum unbroken local rest intention inside the mobile report", async ({ page }) => {
    await openFirstNight(page);
    const intention = "x".repeat(160);
    await page.getByLabel("放下纸条").fill(intention);
    await page.getByLabel("放下纸条").press("Shift+D");
    await expect(page.locator(".demo-drawer")).toHaveCount(0);
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
    const hardwareDialog = page.getByRole("dialog", { name: /把一夜的微光/ });
    await expect(hardwareDialog).toBeVisible();
    await expectDialogLifecycle(page, hardwareDialog);
    await page.keyboard.press("Shift+D");
    await expect(page.locator(".demo-drawer")).toHaveCount(0);
    await expect(page.locator(".sleep-device-grid img")).toHaveCount(4);
    await expectMinimumTapTargets(page.locator(".sleep-source-tabs button, .sleep-device-grid > button, .sleep-hardware-panel-header > button"));
    await expectNoPageOverflow(page);
    await page.getByRole("button", { name: /静默枕/ }).click();
    await page.getByRole("button", { name: /授权并连接 静默枕/ }).click();
    await expect(page.getByText("连接完成，可以回到游戏了")).toBeVisible();
    await expectNoPageOverflow(page);
    await page.getByRole("button", { name: "关闭", exact: true }).click();
    await expect(hardwareDialog).toHaveCount(0);
    await expect(page.locator(".sleep-handoff-card")).toContainText("静默枕已待命");
    await expect(hardwareEntry).toBeFocused();
  });

  test("switches focused collection drawers and connects evidence on a phone", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /DEMO MODE/ }).click();
    await runDemoShortcut(page, /04 地图上被刮掉的线/);
    await page.getByRole("button", { name: "收藏", exact: true }).click();
    await expect(page.locator(".collection-page")).toBeVisible();
    const archiveIndex = page.getByRole("navigation", { name: "收藏档案分类" });
    await expectMinimumTapTargets(archiveIndex.locator("button"));
    await expect(page.locator("#collection-core-evidence")).toBeVisible();
    await expect(page.locator(".night-greenhouse")).toBeHidden();
    await expect(page.getByRole("button", { name: /核心物证/ })).toHaveAttribute("aria-pressed", "true");
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThan(5200);
    await page.getByRole("button", { name: /夜班归来/ }).click();
    await expect(page.getByText("雾灯温室")).toBeVisible();
    await expect(page.locator("#collection-core-evidence")).toBeHidden();
    await page.getByRole("button", { name: /城市回声/ }).click();
    await expect(page.getByText("城市人情簿")).toBeVisible();
    await expect(page.locator(".clipping-envelope")).toHaveCount(4);
    await expect(page.locator(".clipping-envelope-grid")).toHaveCSS("grid-template-columns", /.+/);
    expect(await page.locator(".clipping-envelope-grid").evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(" ").length)).toBe(1);
    await expectNoPageOverflow(page);
    await expect(page.locator(".night-greenhouse")).toBeHidden();
    await page.getByRole("button", { name: /口袋小物/ }).click();
    await expect(page.getByText("口袋抽屉")).toBeVisible();
    await expect(page.getByText("城市人情簿")).toBeHidden();
    await page.getByRole("button", { name: /核心物证/ }).click();
    await expect(page.locator("#collection-core-evidence")).toBeVisible();
    await expectNoPageOverflow(page);
    await page.getByRole("button", { name: "档案", exact: true }).click();
    await expect(page.getByText("雾灯城分区志")).toBeVisible();
    await expectNoPageOverflow(page);

    await page.getByRole("button", { name: /DEMO/ }).click();
    await runDemoShortcut(page, /解锁完整案件板/);
    await expect(page.locator(".demo-drawer")).toHaveCount(0);
    await expect(page.locator(".relation-panel")).toHaveCount(0);
    await expect(page.locator(".core-inference-dock")).toBeVisible();
    await expect(page.getByRole("region", { name: "线索索引" })).toContainText("点选证物进行配对");
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
    await expect(page.getByRole("dialog", { name: "四十三天" })).toHaveCount(0);
    await expect(page.getByRole("region", { name: "线索索引" })).toContainText("再点一张");
    await page.getByRole("button", { name: /打开证物档案：四十三天/ }).click();
    const dossierDialog = page.getByRole("dialog", { name: "四十三天" });
    await expect(dossierDialog).toBeVisible();
    await expect(dossierDialog.getByText(/有人七年没有忘记按时想念/)).toBeVisible();
    await dossierDialog.getByRole("button", { name: "关闭证物档案" }).click();
    await page.getByRole("button", { name: /^OBJECT · 02 未寄出的明信片/ }).click();
    const relationDialog = page.getByRole("dialog", { name: "米娜知道伊芙琳仍然活着" });
    await expect(relationDialog).toBeVisible();
    await expect(page.locator(".core-inference-dock").getByText("米娜知道伊芙琳仍然活着", { exact: true })).toBeVisible();
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

test("keeps the latest morning report stable while evidence is filed and after the day ends", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /DEMO MODE/ }).click();
  await runDemoShortcut(page, /02 每隔四十三天的花/);
  await page.getByRole("button", { name: /给米娜一次说谎的机会/ }).click();
  await page.getByRole("button", { name: /夜香花笺/ }).click();
  await page.locator(".quality-tabs").getByRole("button", { name: /8小时 · 安稳/ }).click();
  await page.getByLabel("放下纸条").fill("明天再整理花店的回信，今晚先休息。");
  await page.getByRole("button", { name: /今晚交给你了/ }).click();
  await page.getByRole("button", { name: /跳到清晨/ }).click();

  const reportHeading = page.locator(".report-hero").getByRole("heading", { name: "每隔四十三天的花" });
  const readReportFingerprint = async () => ({
    hero: await page.locator(".report-hero").innerText(),
    watch: await page.locator(".city-watch-report").innerText(),
    rest: await page.locator(".rest-reflection-card").innerText(),
    character: await page.locator(".character-encounter").innerText(),
    souvenir: await page.locator(".souvenir-reveal").innerText(),
    society: {
      title: await page.locator(".society-memory-letter h3").innerText(),
      letter: await page.locator(".society-memory-letter .paper-card > blockquote").innerText(),
      reason: await page.locator(".society-postscript").innerText(),
    },
    sleep: await page.locator(".sleep-summary").innerText(),
    preparation: await page.locator(".preparation-echo").innerText(),
    route: await page.locator(".route-report").innerText(),
    evidence: await page.locator(".discoveries").innerText(),
    contradiction: await page.locator(".contradiction").innerText(),
  });
  await expect(reportHeading).toBeVisible();
  const originalReport = await readReportFingerprint();
  expect(originalReport.sleep).toContain("8 小时");
  expect(originalReport.sleep).toContain("雾散得很早");
  expect(originalReport.preparation).toContain("夜香花笺");
  expect(originalReport.rest).toContain("明天再整理花店的回信，今晚先休息。");
  await page.reload();
  await expect(reportHeading).toBeVisible();
  expect(await readReportFingerprint()).toEqual(originalReport);

  await page.getByRole("button", { name: /去案件板整理线索/ }).click();
  await page.getByRole("button", { name: /^EVENT · 02 四十三天/ }).click();
  await page.getByRole("button", { name: /^OBJECT · 02 未寄出的明信片/ }).click();
  await page.getByRole("button", { name: /核对这两件证物/ }).click();
  await expect(page.locator(".relation-ledger").getByText("米娜知道伊芙琳仍然活着", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "关闭核心推论" }).click();

  await page.getByRole("button", { name: "今晨", exact: true }).click();
  await expect(reportHeading).toBeVisible();
  await expect(page.getByText("最新晨报重读")).toHaveCount(0);
  expect(await readReportFingerprint()).toEqual(originalReport);
  let saved = await page.evaluate(() => JSON.parse(localStorage.getItem("night-shift-save-v1")!).state);
  expect(saved).toMatchObject({ chapter: 2, phase: "morning" });
  expect(saved.confirmedRelations).toContain("mina-evelyn");

  await page.getByRole("button", { name: "收藏", exact: true }).click();
  await expect(page.locator(".collection-page")).toBeVisible();
  await page.getByRole("button", { name: "档案", exact: true }).click();
  await expect(page.locator(".archive-page")).toBeVisible();
  await page.getByRole("button", { name: "今晨", exact: true }).click();
  expect(await readReportFingerprint()).toEqual(originalReport);

  await page.getByRole("button", { name: /结束今日，准备下一夜/ }).click();
  await expect(page.locator(".tonight-page")).toBeVisible();
  saved = await page.evaluate(() => JSON.parse(localStorage.getItem("night-shift-save-v1")!).state);
  expect(saved).toMatchObject({ chapter: 3, phase: "day" });

  await page.getByRole("button", { name: "今晨", exact: true }).click();
  await expect(reportHeading).toBeVisible();
  await expect(page.getByText("最新晨报重读")).toBeVisible();
  await expect(page.getByRole("button", { name: /去案件板整理线索/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /去准备今晚/ })).toBeVisible();
  const correspondenceReplies = page.locator(".correspondence-replies button");
  await expect(correspondenceReplies).toHaveCount(2);
  await expect(correspondenceReplies.nth(0)).toBeDisabled();
  await expect(correspondenceReplies.nth(1)).toBeDisabled();
  await expect(page.getByText(/今日已经结束；这封未寄出的答复作为空白留在档案里/)).toBeVisible();
  const correspondenceBeforeReload = (await page.evaluate(() => JSON.parse(localStorage.getItem("night-shift-save-v1")!).state)).correspondenceHistory;
  expect(await readReportFingerprint()).toEqual(originalReport);
  await page.reload();
  await page.getByRole("button", { name: "今晨", exact: true }).click();
  await expect(reportHeading).toBeVisible();
  await expect(page.getByText("最新晨报重读")).toBeVisible();
  expect((await page.evaluate(() => JSON.parse(localStorage.getItem("night-shift-save-v1")!).state)).correspondenceHistory).toEqual(correspondenceBeforeReload);
  expect(await readReportFingerprint()).toEqual(originalReport);
});
