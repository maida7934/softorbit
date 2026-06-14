// src/lib/moonHero/waveGrid.ts
import * as THREE from 'three';

const COLS       = 35;
const ROWS       = 25;
const SPACING    = 0.14;
const WAVE_SPEED = 0.35;
const WAVE_AMP   = 0.22;

export class WaveGrid {
  private points:    THREE.Points;
  private geo:       THREE.BufferGeometry;
  private positions: Float32Array;
  private time = 0;

  constructor(scene: THREE.Scene) {
    const total = COLS * ROWS;
    this.positions = new Float32Array(total * 3);

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const idx = (row * COLS + col) * 3;
        this.positions[idx]     = (col - COLS / 2) * SPACING;
        this.positions[idx + 1] = 0;
        this.positions[idx + 2] = (row - ROWS / 2) * SPACING;
      }
    }

    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute(
      'position',
      new THREE.BufferAttribute(this.positions, 3)
    );

    const mat = new THREE.PointsMaterial({
      color:           0xd4cce8,
      size:            0.025,
      sizeAttenuation: true,
      transparent:     true,
      opacity:         0.7,
      depthWrite:      false,
    });

    this.points = new THREE.Points(this.geo, mat);

    // Tilted like the reference — pushed to right side of screen
    this.points.rotation.x = -Math.PI * 0.32;
    this.points.rotation.z = -Math.PI * 0.05;   // very slight roll
    this.points.position.set(2.8, 0.2, 0);       // right side in world space
    scene.add(this.points);
  }

  update(dt: number, scrollProgress: number, visible: boolean): void {
    if (!visible) return;
    this.time += dt * WAVE_SPEED;

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const idx = (row * COLS + col) * 3;

        const x = (col - COLS / 2) * SPACING;
        const z = (row - ROWS / 2) * SPACING;

        // Slow layered waves — organic cloth feel
        const w1 = Math.sin(col * 0.5 + this.time * 1.4) * WAVE_AMP;
        const w2 = Math.sin(row * 0.6 + this.time * 1.1) * WAVE_AMP * 0.45;
        const w3 = Math.sin((col + row) * 0.35 + this.time * 0.9) * WAVE_AMP * 0.35;

        // Edge fade — dots near grid border are subtler
        const edgeFadeCol = Math.min(col, COLS - 1 - col) / (COLS * 0.25);
        const edgeFadeRow = Math.min(row, ROWS - 1 - row) / (ROWS * 0.25);
        const edgeFade    = Math.min(1, edgeFadeCol) * Math.min(1, edgeFadeRow);

        this.positions[idx]     = x;
        this.positions[idx + 1] = (w1 + w2 + w3) * edgeFade;
        this.positions[idx + 2] = z;
      }
    }

    this.geo.attributes.position.needsUpdate = true;
  }

  setOpacity(alpha: number): void {
    (this.points.material as THREE.PointsMaterial).opacity = alpha * 0.7;
  }

  destroy(): void {
    this.geo.dispose();
    (this.points.material as THREE.PointsMaterial).dispose();
    this.points.removeFromParent();
  }
}
