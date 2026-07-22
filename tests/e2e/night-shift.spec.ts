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
  await expect(page.getByText("纸张的证词")).toBeVisible();
  await expect(page.getByText("GROWING WHILE YOU REST")).toBeVisible();
  await expect(page.getByText(/旧票据工坊承认这批纸早已销毁/)).toBeVisible();
  await page.getByRole("button", { name: /跳到清晨/ }).click();
  await expect(page.getByText("昨夜调查完成")).toBeVisible();
  await expect(page.getByText("灯港拒收件")).toBeVisible();
  await expect(page.getByText(/市政厅的否认牌在雨里站了七年/)).toBeVisible();
  await expect(page.getByText(/我先让纸张开口/)).toBeVisible();
  await expect(page.getByText("票根灯蕨").first()).toBeVisible();
  await expect(page.getByText(/断续|普通|安稳/).first()).toBeVisible();
  await expect(page.getByText(/为什么一张已经停运七年的车票/)).toBeVisible();
});

test("keeps returned postcards in the journey album", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /DEMO MODE/ }).click();
  await page.getByRole("button", { name: /03 没有退房的307/ }).click();
  await page.getByRole("button", { name: /收藏/ }).click();

  await expect(page.getByText("灯港拒收件")).toBeVisible();
  await expect(page.getByText("寄往无人之处")).toBeVisible();
  await expect(page.getByText(/第二版回答 · 灯港花店后室/)).toBeVisible();
  await expect(page.getByText("雾灯城寄回的五个夜晚")).toBeVisible();
  await expect(page.getByText("雾灯温室")).toBeVisible();
  await expect(page.getByRole("heading", { name: "票根灯蕨" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "四十三日夜香" })).toBeVisible();
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

test("builds a core inference by connecting two evidence cards", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /DEMO MODE/ }).click();
  await page.getByRole("button", { name: /解锁完整案件板/ }).click();
  await page.getByRole("button", { name: /^EVENT · 02 四十三天/ }).click();
  await page.getByRole("button", { name: /^OBJECT · 02 未寄出的明信片/ }).click();
  await page.getByRole("button", { name: /建立证物连接/ }).click();

  await expect(page.getByText("米娜知道伊芙琳仍然活着")).toBeVisible();
  await expect(page.getByText(/共同证明米娜一直替她维持联络/)).toBeVisible();
});
