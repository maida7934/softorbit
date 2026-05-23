import * as THREE from 'three';

export interface SceneRefs {
  renderer: THREE.WebGLRenderer;
  scene:    THREE.Scene;
  camera:   THREE.PerspectiveCamera;
}

export const PHASES = {
  /** Scroll progress at which first word begins peeling off orbit */
  PEEL_START: 0.25,

  /** Each successive word starts this much later */
  PEEL_SPACING: 0.035,

  /** How long a single word's travel from orbit → destination takes (in progress units) */
  PEEL_DURATION: 0.15,

  /** Progress at which orbit word spans begin cross-fading out */
  CROSSFADE_START: 0.65,

  /** Progress at which cross-fade completes and paragraph div is fully visible */
  CROSSFADE_END: 0.75,
} as const;
