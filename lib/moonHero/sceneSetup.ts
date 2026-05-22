import * as THREE from 'three';
import type { SceneRefs } from './types';

export function createScene(canvas: HTMLCanvasElement): SceneRefs {
  const isMobile = window.innerWidth < 768;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha:            true,
    antialias:        true,
    powerPreference:  'high-performance',
  });
  renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace    = THREE.SRGBColorSpace;
  renderer.toneMapping         = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled   = false; // not needed, saves GPU

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, 7);
  camera.lookAt(0, 0, 0);

  // Verify camera can see origin at scale 2.5
  // visible height at z=7 FOV=50: 6.53 units
  // moon diameter at FIXED_SCALE=2.5: 2.5 units → 38% screen fill
  console.log('[SceneSetup] camera z:', camera.position.z, '| FOV:', camera.fov);

  // Key light — warm sun, upper right
  const keyLight = new THREE.DirectionalLight(0xfff4d6, 2.8);
  keyLight.position.set(4, 3, 2);
  scene.add(keyLight);

  // Fill light — cool, opposite side, dim
  const fillLight = new THREE.DirectionalLight(0xaad4ff, 0.4);
  fillLight.position.set(-4, -1, -2);
  scene.add(fillLight);

  // Ambient — reveal the dark side slightly
  const ambient = new THREE.AmbientLight(0xffffff, 0.15);
  scene.add(ambient);

  // Rim light — edge highlight from behind
  const rimLight = new THREE.DirectionalLight(0xffe0a0, 0.8);
  rimLight.position.set(0, 6, -4);
  scene.add(rimLight);

  return { renderer, scene, camera };
}

export function handleResize(refs: SceneRefs): void {
  const { renderer, camera } = refs;
  const isMobile = window.innerWidth < 768;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
}
