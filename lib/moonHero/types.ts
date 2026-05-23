import * as THREE from 'three';

export interface SceneRefs {
  renderer: THREE.WebGLRenderer;
  scene:    THREE.Scene;
  camera:   THREE.PerspectiveCamera;
}

/**
 * Scroll phases — all values are 0→1 progress within the pinned section.
 *
 * Total scroll distance is 4000% (40 viewport heights).
 * Hero phases are scaled to preserve the same absolute scroll distance.
 */
export const PHASES = {
  // ── Hero (words orbit → paragraph) ──
  PEEL_START: 0.062,
  PEEL_SPACING: 0.0087,
  PEEL_DURATION: 0.0375,
  CROSSFADE_START: 0.162,
  CROSSFADE_END: 0.187,

  // ── Section 2: moon curves to RIGHT, text on LEFT ──
  SECTION2_START: 0.187,
  SECTION2_END: 0.312,
  SECTION2_TEXT_START: 0.217,
  SECTION2_TEXT_END: 0.307,

  // ── Section 3: moon curves to LEFT, text on RIGHT ──
  SECTION3_START: 0.425,
  SECTION3_END: 0.537,
  SECTION3_TEXT_START: 0.450,
  SECTION3_TEXT_END: 0.530,

  // ── Section 4: moon curves to MIDDLE BOTTOM ──
  SECTION4_START: 0.612,
  SECTION4_END: 0.737,

  // ── Section 4: 6 cards float past moon ──
  SECTION4_CARDS_START: 0.650,
  SECTION4_CARDS_END: 0.950,
} as const;
