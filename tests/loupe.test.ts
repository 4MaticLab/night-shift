import { describe, expect, it } from "vitest";
import { computeLoupe } from "@/src/lib/ui/loupe";

describe("computeLoupe", () => {
  const frame = { width: 400, height: 300, lensSize: 120, zoom: 2 };

  it("centres the lens on the pointer away from the edges", () => {
    const geo = computeLoupe({ ...frame, pointerX: 200, pointerY: 150 });
    expect(geo.lensLeft).toBe(140); // 200 - 60
    expect(geo.lensTop).toBe(90); // 150 - 60
    expect(geo.backgroundX).toBeCloseTo(50);
    expect(geo.backgroundY).toBeCloseTo(50);
    expect(geo.backgroundSize).toBe(200);
  });

  it("keeps the lens fully inside the frame at the corners", () => {
    const topLeft = computeLoupe({ ...frame, pointerX: 0, pointerY: 0 });
    expect(topLeft.lensLeft).toBe(0);
    expect(topLeft.lensTop).toBe(0);
    expect(topLeft.backgroundX).toBe(0);
    expect(topLeft.backgroundY).toBe(0);

    const bottomRight = computeLoupe({ ...frame, pointerX: 400, pointerY: 300 });
    expect(bottomRight.lensLeft).toBe(280); // width - lensSize
    expect(bottomRight.lensTop).toBe(180); // height - lensSize
    expect(bottomRight.backgroundX).toBe(100);
    expect(bottomRight.backgroundY).toBe(100);
  });

  it("clamps out-of-bounds pointer input", () => {
    const geo = computeLoupe({ ...frame, pointerX: -50, pointerY: 900 });
    expect(geo.lensLeft).toBe(0);
    expect(geo.lensTop).toBe(180);
    expect(geo.backgroundX).toBe(0);
    expect(geo.backgroundY).toBe(100);
  });

  it("never enforces a magnification below 1x", () => {
    const geo = computeLoupe({ ...frame, zoom: 0.4, pointerX: 200, pointerY: 150 });
    expect(geo.backgroundSize).toBe(100);
  });

  it("handles a lens larger than the frame without going negative", () => {
    const geo = computeLoupe({ width: 80, height: 80, lensSize: 120, zoom: 2, pointerX: 40, pointerY: 40 });
    expect(geo.lensLeft).toBe(0);
    expect(geo.lensTop).toBe(0);
  });
});
