export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

export const clamp = (v: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, v));

export const easeInOut = (t: number): number =>
  t < 0.5 ? 2 * t * t : (4 - 2 * t) * t - 1;

export const phaseProgress = (
  p: number,
  start: number,
  end: number
): number => clamp((p - start) / (end - start), 0, 1);
