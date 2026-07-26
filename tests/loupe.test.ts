import { describe, expect, it } from "vitest";
import { computeLoupe } from "@/src/lib/ui/loupe";

describe("computeLoupe", () => {
  const frame = { width: 400, height: 300, lensSize: 120, zoom: 2 };

  it("centres the lens on the pointer away from the edges", () => {
    const geo = computeLoupe({ ...frame, pointerX: 200, pointerY: 150 });
    expect(geo.lensLeft).toBe(140); // 200 - 60
    expect(geo.lensTop).toBe(90); // 150 - 60
    // 镜片内背景是整幅图的 zoom 倍：否则就是缩小镜（issue #152）
    expect(geo.backgroundWidth).toBe(800); // 400 × 2
    expect(geo.backgroundHeight).toBe(600); // 300 × 2
    // 指针下的图像点保持在指针下：(200-140) - 200×2 = -340
    expect(geo.backgroundLeft).toBe(-340);
    expect(geo.backgroundTop).toBe(-240); // (150-90) - 150×2
  });

  it("keeps the lens fully inside the frame at the corners", () => {
    const topLeft = computeLoupe({ ...frame, pointerX: 0, pointerY: 0 });
    expect(topLeft.lensLeft).toBe(0);
    expect(topLeft.lensTop).toBe(0);
    expect(topLeft.backgroundLeft).toBe(0);
    expect(topLeft.backgroundTop).toBe(0);

    const bottomRight = computeLoupe({ ...frame, pointerX: 400, pointerY: 300 });
    expect(bottomRight.lensLeft).toBe(280); // width - lensSize
    expect(bottomRight.lensTop).toBe(180); // height - lensSize
    expect(bottomRight.backgroundLeft).toBe(-680); // lensSize - backgroundWidth
    expect(bottomRight.backgroundTop).toBe(-480); // lensSize - backgroundHeight
  });

  it("clamps out-of-bounds pointer input", () => {
    const geo = computeLoupe({ ...frame, pointerX: -50, pointerY: 900 });
    expect(geo.lensLeft).toBe(0);
    expect(geo.lensTop).toBe(180);
    expect(geo.backgroundLeft).toBe(0);
    expect(geo.backgroundTop).toBe(-480);
  });

  it("never enforces a magnification below 1x", () => {
    const geo = computeLoupe({ ...frame, zoom: 0.4, pointerX: 200, pointerY: 150 });
    expect(geo.backgroundWidth).toBe(400); // 1x → 背景就是屏上原尺寸
    expect(geo.backgroundHeight).toBe(300);
  });

  it("keeps the image point under the pointer for interior positions", () => {
    for (const [px, py] of [[120, 90], [200, 150], [310, 220]] as const) {
      const geo = computeLoupe({ ...frame, pointerX: px, pointerY: py });
      // 镜片内指针处显示的图像像素，换算回原图坐标应等于指针位置
      expect(((px - geo.lensLeft) - geo.backgroundLeft) / 2).toBeCloseTo(px);
      expect(((py - geo.lensTop) - geo.backgroundTop) / 2).toBeCloseTo(py);
    }
  });

  it("handles a lens larger than the frame without going negative", () => {
    const geo = computeLoupe({ width: 80, height: 80, lensSize: 120, zoom: 2, pointerX: 40, pointerY: 40 });
    expect(geo.lensLeft).toBe(0);
    expect(geo.lensTop).toBe(0);
    expect(geo.backgroundLeft).toBe(-40); // (40-0) - 40×2
    expect(geo.backgroundTop).toBe(-40);
  });
});
