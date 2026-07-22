import { expect, test } from "@playwright/test";

async function openFirstNight(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /开始第一宗案件/ }).click();
  await page.getByRole("button", { name: "继续" }).click();
  await page.getByRole("button", { name: "继续" }).click();
  await page.getByRole("button", { name: /进入事务所/ }).click();
  await page.getByRole("button", { name: /让纸张先开口/ }).click();
}

test("starts a case and reaches the first morning report", async ({ page }) => {
  await openFirstNight(page);
  await page.getByRole("button", { name: /今晚交给你了/ }).click();
  await page.getByRole("button", { name: /跳到清晨/ }).click();
  await expect(page.getByText("昨夜调查完成")).toBeVisible();
  await expect(page.getByText(/为什么一张已经停运七年的车票/)).toBeVisible();
});

test("restores and settles a real night after reload", async ({ page }) => {
  await openFirstNight(page);
  await page.getByRole("button", { name: /今夜真实交接/ }).click();
  await page.getByRole("button", { name: /开始今夜的真实交接/ }).click();
  await expect(page.getByText(/城市记得交接的时刻/)).toBeVisible();

  await page.reload();
  await expect(page.getByText(/真实夜班/)).toBeVisible();
  await page.getByRole("button", { name: /我醒了，拆开报告/ }).click();
  await expect(page.getByText("昨夜调查完成")).toBeVisible();
  await expect(page.getByText("真实夜班")).toBeVisible();
});
