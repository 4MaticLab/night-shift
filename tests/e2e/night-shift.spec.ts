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
  await expect(page.getByText(/可能惊动 · 错页登记处/)).toBeVisible();
  await page.getByRole("button", { name: /今晚交给你了/ }).click();
  await expect(page.locator(".night-expedition-art")).toHaveAttribute("src", /night-expedition-v1/);
  await expect(page.getByText("纸张的证词")).toBeVisible();
  await expect(page.getByText("GROWING WHILE YOU REST")).toBeVisible();
  await expect(page.getByText(/旧票据工坊承认这批纸早已销毁/)).toBeVisible();
  await page.getByRole("button", { name: /跳到清晨/ }).click();
  await expect(page.locator(".report-hero-art")).toHaveAttribute("src", /morning-report-v1/);
  await expect(page.getByText("昨夜调查完成")).toBeVisible();
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
  await expect(page.getByText("城市人情簿")).toBeVisible();
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

test("carries the hidden-platform tableau through final choice and ending", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /DEMO MODE/ }).click();
  await page.getByRole("button", { name: /跳到真结局条件/ }).click();
  await page.getByRole("button", { name: /去站台等一辆被否认的车/ }).click();
  await page.getByRole("button", { name: /今晚交给你了/ }).click();
  await page.getByRole("button", { name: /跳到清晨/ }).click();
  await page.getByRole("button", { name: /做出最终决定/ }).click();
  await expect(page.locator(".ending-background")).toHaveAttribute("src", /hidden-platform-tableau-v1/);
  await page.getByRole("button", { name: /公开档案/ }).click();
  await expect(page.getByRole("heading", { name: "公开档案" })).toBeVisible();
  await expect(page.locator(".ending-background")).toHaveAttribute("src", /hidden-platform-tableau-v1/);
});
