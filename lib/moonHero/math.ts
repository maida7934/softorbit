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

/**
 * Quadratic Bézier: B(t) = (1-t)²·P0 + 2·(1-t)·t·P1 + t²·P2
 */
export function quadBezier(
  p0: number,
  p1: number,
  p2: number,
  t: number
): number {
  const mt = 1 - t;
  return mt * mt * p0 + 2 * mt * t * p1 + t * t * p2;
}

/**
 * Catmull-Rom spline interpolation through 4 points.
 * Returns the point at parameter t ∈ [0,1] between p1 and p2.
 * Alpha=0.5 gives centripetal parameterisation (avoids cusps).
 */
export function catmullRom(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number
): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}
