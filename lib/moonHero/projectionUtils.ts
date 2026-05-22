import * as THREE from 'three';
import type { MoonScreenState } from './types';

const _worldPos  = new THREE.Vector3();
const _edgePos   = new THREE.Vector3();

export function getMoonScreenState(
  moon:     THREE.Group,
  camera:   THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
): MoonScreenState {
  moon.getWorldPosition(_worldPos);

  // Project centre
  const projected = _worldPos.clone().project(camera);
  const W = renderer.domElement.clientWidth;
  const H = renderer.domElement.clientHeight;
  const cx = (projected.x *  0.5 + 0.5) * W;
  const cy = (projected.y * -0.5 + 0.5) * H;

  // Project a point offset by the moon's current world-space radius
  // moon.scale.x === normalised scale, so world radius ≈ 0.5 * scale
  const worldRadius = 0.5 * moon.scale.x;
  _edgePos.copy(_worldPos).add(new THREE.Vector3(worldRadius, 0, 0));
  const projectedEdge = _edgePos.clone().project(camera);
  const ex = (projectedEdge.x * 0.5 + 0.5) * W;
  const screenRadius = Math.abs(ex - cx);

  return { x: cx, y: cy, radius: screenRadius };
}
