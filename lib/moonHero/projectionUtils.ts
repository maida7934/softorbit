import * as THREE from 'three';

export interface MoonScreenState {
  /** CSS pixel x of moon centre relative to canvas top-left */
  x: number;
  /** CSS pixel y of moon centre relative to canvas top-left */
  y: number;
  /** Apparent radius in CSS pixels */
  radius: number;
}

export function getMoonScreenState(
  moon: THREE.Group,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer
): MoonScreenState {
  // Compute true world-space bounding box to find the visual center.
  // This handles the case where moon.position was reset to 0,0,0 losing its offset.
  const box = new THREE.Box3().setFromObject(moon);
  const worldPos = box.getCenter(new THREE.Vector3());

  // Project to NDC
  const ndc = worldPos.clone().project(camera);

  const canvas = renderer.domElement;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  const x = (ndc.x * 0.5 + 0.5) * w;
  const y = (-ndc.y * 0.5 + 0.5) * h;

  // Use the true bounding box size for the radius
  const size = box.getSize(new THREE.Vector3());
  const scaledR = Math.max(size.x, size.y, size.z) / 2;

  const edgeWorld = worldPos.clone().add(new THREE.Vector3(scaledR, 0, 0));
  const edgeNDC = edgeWorld.clone().project(camera);
  const edgeX = (edgeNDC.x * 0.5 + 0.5) * w;

  const radius = Math.abs(edgeX - x);

  return { x, y, radius };
}
