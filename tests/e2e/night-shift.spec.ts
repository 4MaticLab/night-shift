import { expect, test } from "@playwright/test";

async function expectNoPageOverflow(page: import("@playwright/test").Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
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

async function openCityChronicle(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /开始第 001 宗案件/ }).click();
  await page.getByRole("button", { name: "继续" }).click();
  await page.getByRole("button", { name: "继续" }).click();
  await page.getByRole("button", { name: /进入事务所/ }).click();
  await expect(page.getByRole("heading", { name: "雾灯城纪事地图" })).toBeVisible();
}

async function openTideStoryline(page: import("@playwright/test").Page) {
  await openCityChronicle(page);
  const mainThread = page.locator(".city-thread-shelf article", { hasText: "零点四十三分的末班车" });
  await mainThread.getByRole("button", { name: /开始这条线/ }).click();
  await page.locator("article", { hasText: "从那张昨天的旧车票开始" }).getByRole("button", { name: /从这条证物进入主线/ }).click();

  const advanceMainThread = async (locationName: RegExp, actionTitle: string) => {
    await page.locator(".sandbox-map").getByRole("button", { name: locationName }).click();
    await page.locator("article", { hasText: actionTitle }).getByRole("button", { name: "安排今晚调查" }).click();
    await page.getByRole("button", { name: /今晚交给调查队/ }).click();
    await page.getByRole("button", { name: /跳到清晨/ }).click();
    await page.getByRole("button", { name: /归档晨报，准备下一夜/ }).click();
  };

  await advanceMainThread(/01 不存在的车票/, "纸张的证词");
  await advanceMainThread(/02 每隔四十三天的花/, "第二版回答");
  await advanceMainThread(/03 没有退房的307/, "请司机再忘一次");
  await page.locator(".sandbox-brand").click();
  await expect(page.locator(".city-storyline-region img")).toHaveAttribute("src", /hero-v1/);
  await page.locator(".city-thread-shelf article", { hasText: "潮汐不肯归档" }).getByRole("button", { name: /开始这条线/ }).click();
}

test("opens the concurrent city chronicle in English without a legacy route", async ({ page }) => {
  await page.goto("/?legacy=1");
  await page.getByRole("button", { name: /ENGLISH/ }).click();
  await page.getByRole("button", { name: /Begin Case 001/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Enter the agency/ }).click();
  await expect(page.getByRole("heading", { name: "Foglight City Chronicle" })).toBeVisible();
  await expect(page.getByText("ONE CITY · CONCURRENT STORY THREADS")).toBeVisible();
  await expect(page.getByRole("button", { name: /Start thread/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tonight", exact: true })).toHaveCount(0);
  await expectNoVisibleHan(page);
  await page.locator(".city-thread-shelf article").first().getByRole("button", { name: /Start thread/ }).click();
  await expect(page.getByRole("heading", { name: "The Last Tram at 00:43 · Main Thread" })).toBeVisible();
  await expectNoVisibleHan(page);
  await page.locator(".origin-cards article").first().getByRole("button", { name: /Enter the main thread/ }).click();
  await page.locator(".sandbox-map button").first().click();
  await expectNoVisibleHan(page);
  await page.locator(".sandbox-action-list article").first().getByRole("button", { name: /Schedule tonight's investigation/ }).click();
  await expectNoVisibleHan(page);
  await page.getByRole("button", { name: /Dispatch the night shift/ }).click();
  await expectNoVisibleHan(page);
  await page.getByRole("button", { name: /Skip to morning/ }).click();
  await expect(page.getByText("Last night's investigation is complete")).toBeVisible();
  await expectNoVisibleHan(page);
});

test("clears incompatible Night Shift saves while retaining the language preference", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("night-shift-save-epoch", "1");
    localStorage.setItem("night-shift-save-v1", JSON.stringify({ state: { started: true }, version: 16 }));
    localStorage.setItem("night-shift-world-v1", JSON.stringify({ state: { campaignId: "case-003", started: true }, version: 1 }));
    localStorage.setItem("night-shift-sandbox-v1", JSON.stringify({ state: { saves: { "case-001:last-tram": { started: true, phase: "night" } } }, version: 2 }));
    localStorage.setItem("night-shift-sleep-hardware-v1", JSON.stringify({ state: { mode: "virtual" }, version: 1 }));
    localStorage.setItem("night-shift-locale", "en");
  });

  await page.goto("/");
  await expect(page.getByRole("button", { name: /Begin Case 001/ })).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("night-shift-save-epoch"))).toBe("2");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("night-shift-save-v1"))).toBeNull();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("night-shift-sandbox-v1"))).toBeNull();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("night-shift-sleep-hardware-v1"))).toBeNull();
  await expect(page.evaluate(() => localStorage.getItem("night-shift-locale"))).resolves.toBe("en");
});

test("restores a real Blackwater Creek expedition after reload and settles it once", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /CASE 003/ }).click();
  await page.getByRole("button", { name: /开始第 003 宗案件/ }).click();

  await page.locator("article", { hasText: "波士顿私酒贩小队" }).getByRole("button", { name: /以此身份进入山谷/ }).click();
  await page.locator(".sandbox-map").getByRole("button", { name: /08 卡莫迪农场/ }).click();
  await page.locator("article", { hasText: "同达米恩谈一笔更大的生意" }).getByRole("button", { name: "安排今晚调查" }).click();
  await page.getByRole("button", { name: "真实夜班" }).click();
  await page.getByRole("button", { name: /今晚交给调查队/ }).click();

  await expect(page.getByRole("heading", { name: "同达米恩谈一笔更大的生意" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "同达米恩谈一笔更大的生意" })).toBeVisible();
  await page.getByRole("button", { name: /我回来了，拆开晨报/ }).click();
  await expect(page.getByText("每周驶向波士顿的货单")).toBeVisible();
  await page.reload();
  await expect(page.getByText("每周驶向波士顿的货单")).toHaveCount(1);
});

test("returns a deterministic report from the illustrated Lower-River storyline", async ({ page }) => {
  await openTideStoryline(page);
  await page.locator("article", { hasText: "沿被刮掉的线路进入" }).getByRole("button", { name: /以此身份进入低潮/ }).click();
  await page.locator(".sandbox-map").getByRole("button", { name: /03 第七泄洪闸/ }).click();
  await expect(page.locator(".sandbox-location-art img")).toHaveAttribute("src", /location-floodgate-v1/);
  await page.locator("article", { hasText: "取出闸齿日志" }).getByRole("button", { name: "安排今晚调查" }).click();
  await page.getByRole("button", { name: /今晚交给调查队/ }).click();
  await page.getByRole("button", { name: /跳到清晨/ }).click();
  await expect(page.getByText("紧急闸门日志")).toBeVisible();
  await expect(page.getByText(/睡眠质量只改变晨报的叙事层次/)).toBeVisible();
});

test("runs the main thread and Lower-River side thread concurrently", async ({ page }) => {
  await openTideStoryline(page);
  await page.locator("article", { hasText: "沿箱子上的姓氏进入" }).getByRole("button", { name: /以此身份进入低潮/ }).click();
  await page.locator(".sandbox-map").getByRole("button", { name: /02 夜渡船码头/ }).click();
  await page.locator("article", { hasText: "重抄最后一班名册" }).getByRole("button", { name: "安排今晚调查" }).click();
  await page.getByRole("button", { name: /今晚交给调查队/ }).click();
  await page.locator(".sandbox-night-brand").click();

  const mainThread = page.locator(".city-thread-shelf article", { hasText: "零点四十三分的末班车" });
  await expect(mainThread).toContainText("可安排下一段");
  await expect(page.locator(".city-thread-shelf article", { hasText: "潮汐不肯归档" })).toContainText("夜班计时中");
  await mainThread.getByRole("button", { name: /继续推进/ }).click();
  await page.locator(".sandbox-map").getByRole("button", { name: /04 地图上被刮掉的线/ }).click();
  await page.locator("article", { hasText: "不存在的地下室" }).getByRole("button", { name: "安排今晚调查" }).click();
  await page.getByRole("button", { name: /今晚交给调查队/ }).click();
  await page.locator(".sandbox-night-brand").click();

  await expect(page.locator(".city-chronicle-heading dl div", { hasText: "夜班进行中" }).locator("dd")).toHaveText("2");
  await expect(page.locator(".city-thread-shelf article.phase-night")).toHaveCount(2);
});

test.describe("mobile 390x844", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("shows only the main world and Blackwater structure sample without overflow", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".campaign-shelf button")).toHaveCount(2);
    await expectMinimumTapTargets(page.locator(".campaign-shelf button"));
    await expect(page.getByRole("button", { name: /CASE 002/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /CASE 004/ })).toHaveCount(0);
    await page.getByRole("button", { name: /STRUCTURE SAMPLE · CASE 003/ }).click();
    await expect(page.getByRole("button", { name: /开始第 003 宗案件/ })).toBeVisible();
    await expectNoPageOverflow(page);
  });

  test("plays the Lower-River storyline through the resident-return ending", async ({ page }) => {
    test.setTimeout(90_000);
    await openTideStoryline(page);
    await expectNoPageOverflow(page);
    await page.locator("article", { hasText: "沿箱子上的姓氏进入" }).getByRole("button", { name: /以此身份进入低潮/ }).click();

    const runAction = async (locationName: RegExp, actionTitle: string) => {
      await page.locator(".sandbox-map").getByRole("button", { name: locationName }).click();
      await page.locator("article", { hasText: actionTitle }).getByRole("button", { name: "安排今晚调查" }).click();
      await page.getByRole("button", { name: /今晚交给调查队/ }).click();
      await page.getByRole("button", { name: /跳到清晨/ }).click();
      await expectNoPageOverflow(page);
      await page.getByRole("button", { name: /归档晨报，准备下一夜/ }).click();
    };

    await runAction(/02 夜渡船码头/, "重抄最后一班名册");
    await runAction(/02 夜渡船码头/, "让返程票靠近空座");
    await runAction(/05 停钟棚/, "播放未播警报");
    await runAction(/05 停钟棚/, "让迟到的钟响完");
    await runAction(/06 淹没排屋/, "逐户拓下门牌");
    await runAction(/06 淹没排屋/, "听完住户的那一夜");
    await runAction(/06 淹没排屋/, "逐户送人上夜渡船");
    await page.getByRole("navigation", { name: "零点四十三分的末班车河下区支线导航" }).getByRole("button", { name: /收场/ }).click();
    await page.getByRole("button", { name: "以此收场" }).click();
    await expect(page.getByRole("heading", { name: "让夜渡船先送人回家" })).toBeVisible();
    await expect(page.locator(".sandbox-ending-reveal")).toHaveCSS("background-image", /hero-v1/);
    await expectNoPageOverflow(page);
  });
});
