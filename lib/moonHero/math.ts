export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export function easeOut3(t: number): number {
  return 1 - (1 - t) ** 3;
}

/**
 * Maps globalProgress through a sub-phase window [start, start+duration]
 * Returns 0→1 clamped within that window.
 */
export function phaseProgress(
  globalP: number,
  start: number,
  end: number
): number {
  return clamp((globalP - start) / (end - start), 0, 1);
}
