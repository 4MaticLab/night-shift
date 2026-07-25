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
  /** Horizontal background-position for the magnified image, in percent. */
  backgroundX: number;
  /** Vertical background-position for the magnified image, in percent. */
  backgroundY: number;
  /** Background-size width for the magnified image, in percent of the lens. */
  backgroundSize: number;
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
 * The lens is centred on the pointer but kept fully inside the frame, and the
 * magnified background is positioned so the point under the pointer stays under
 * the lens centre. Pure and deterministic so it can be unit tested without DOM.
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

  const ratioX = clamp(px / width, 0, 1);
  const ratioY = clamp(py / height, 0, 1);

  return {
    lensLeft,
    lensTop,
    backgroundX: ratioX * 100,
    backgroundY: ratioY * 100,
    backgroundSize: zoom * 100,
  };
}
