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

  // ── Fill color phase ──
  FILL_START: 0.20,
  FILL_DURATION: 0.15,

  CROSSFADE_START: 0.35,
  CROSSFADE_END: 0.38,

  // ── Section 2: moon curves to RIGHT, text on LEFT ──
  SECTION2_START: 0.38,
  SECTION2_END: 0.51,
  SECTION2_TEXT_START: 0.41,
  SECTION2_TEXT_END: 0.44,

  // ── Section 3: moon curves to LEFT, text on RIGHT ──
  SECTION3_START: 0.58,
  SECTION3_END: 0.69,
  SECTION3_TEXT_START: 0.61,
  SECTION3_TEXT_END: 0.64,

  // ── Section 4: moon curves to MIDDLE BOTTOM ──
  SECTION4_START: 0.76,
  SECTION4_END: 0.88,

  // ── Section 4: 6 cards float past moon ──
  SECTION4_CARDS_START: 0.80,
  SECTION4_CARDS_END: 1.00,

  // ── Particle burst (synced with Section 2 start) ──
  PARTICLE_BURST_START: 0.38,   // same as SECTION2_START
  PARTICLE_BURST_END:   0.44,   // burst completes over 0.06 scroll
} as const;
