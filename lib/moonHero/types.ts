import * as THREE from 'three';

export interface SceneRefs {
  renderer: THREE.WebGLRenderer;
  scene:    THREE.Scene;
  camera:   THREE.PerspectiveCamera;
}

export interface MoonScreenState {
  x:      number;
  y:      number;
  radius: number;
}

export interface WordConfig {
  text:     string;
  index:    number;
}

export interface WordDestination {
  x:        number;
  y:        number;
  fontSize: number;
}

export interface ParagraphLine {
  words:    string[];
  fontSize: number;  // px
  opacity:  number;  // 0–1
}

export interface AnimationPhases {
  GROW_END:       number;
  PEEL_START:     number;
  PEEL_SPACING:   number;
  PEEL_DURATION:  number;
  CROSSFADE_END:  number;
}

export const PHASES: AnimationPhases = {
  GROW_END:      0.50,   // was 0.85
  PEEL_START:    0.38,   // was 0.32 — start peel slightly earlier
  PEEL_SPACING:  0.055,
  PEEL_DURATION: 0.10,
  CROSSFADE_END: 0.92,
};
