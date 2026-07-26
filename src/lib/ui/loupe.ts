export interface LoupeInput {
  /** Pointer X relative to the framed image, in pixels. */
  pointerX: number;
  /** Pointer Y relative to the framed image, in pixels. */
  pointerY: number;
  /** Rendered width of the framed image, in pixels. */
  width: number;
  /** Rendered height of the framed image, in pixels. */
  height: number;
  /** Diameter of the circular lens, in pixels. */
  lensSize: number;
  /** Magnification factor applied inside the lens (>= 1). */
  zoom: number;
}

export interface LoupeGeometry {
  /** Left offset of the lens box relative to the framed image, in pixels. */
  lensLeft: number;
  /** Top offset of the lens box relative to the framed image, in pixels. */
  lensTop: number;
  /** background-position-x for the magnified image, in pixels (≤ 0). */
  backgroundLeft: number;
  /** background-position-y for the magnified image, in pixels (≤ 0). */
  backgroundTop: number;
  /** background-size width in pixels: rendered frame width × zoom. */
  backgroundWidth: number;
  /** background-size height in pixels: rendered frame height × zoom. */
  backgroundHeight: number;
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Derive the circular loupe geometry for a pointer hovering a framed image.
 *
 * The lens is centred on the pointer but kept fully inside the frame. The
 * background is the frame rendered at zoom × its on-screen size and offset in
 * pixels so the image point under the pointer stays under the pointer inside
 * the lens — sizing against the lens box instead would shrink the image
 * whenever the frame renders wider than lensSize × zoom (issue #152).
 * Pure and deterministic so it can be unit tested without DOM.
 */
export function computeLoupe(input: LoupeInput): LoupeGeometry {
  const width = Math.max(1, input.width);
  const height = Math.max(1, input.height);
  const lensSize = Math.max(1, input.lensSize);
  const zoom = Math.max(1, input.zoom);

  const px = clamp(input.pointerX, 0, width);
  const py = clamp(input.pointerY, 0, height);

  const half = lensSize / 2;
  const lensLeft = clamp(px - half, 0, Math.max(0, width - lensSize));
  const lensTop = clamp(py - half, 0, Math.max(0, height - lensSize));

  const backgroundWidth = width * zoom;
  const backgroundHeight = height * zoom;

  return {
    lensLeft,
    lensTop,
    backgroundLeft: clamp((px - lensLeft) - px * zoom, Math.min(0, lensSize - backgroundWidth), 0),
    backgroundTop: clamp((py - lensTop) - py * zoom, Math.min(0, lensSize - backgroundHeight), 0),
    backgroundWidth,
    backgroundHeight,
  };
}
