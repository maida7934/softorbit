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
  SECTION2_TEXT_END: 0.247,

  // ── Section 3: moon curves to LEFT, text on RIGHT ──
  SECTION3_START: 0.380,
  SECTION3_END: 0.490,
  SECTION3_TEXT_START: 0.410,
  SECTION3_TEXT_END: 0.440,

  // ── Section 4: moon curves to MIDDLE BOTTOM ──
  SECTION4_START: 0.560,
  SECTION4_END: 0.685,

  // ── Section 4: 6 cards float past moon ──
  SECTION4_CARDS_START: 0.600,
  SECTION4_CARDS_END: 1.000,

  // ── Particle burst (synced with Section 2 start) ──
  PARTICLE_BURST_START: 0.187,   // same as SECTION2_START
  PARTICLE_BURST_END:   0.247,   // burst completes over 0.06 scroll
} as const;
