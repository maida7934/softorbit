import * as THREE from 'three';
import { clamp, easeInOut, lerp } from './math';
import { PHASES } from './types';

const COUNT = 1200;
const DRIFT_SPEED = 0.3;
const CAMERA_Z = 7;
const FOV_DEG = 50;
const HALF_FOV = (FOV_DEG * Math.PI) / 180 / 2;
const VIS_HEIGHT = 2 * CAMERA_Z * Math.tan(HALF_FOV);

// Mouse repulsion config
const REPULSE_RADIUS = 1.8;   // world units — how far mouse influence reaches
const REPULSE_FORCE = 0.12;  // how far particles get pushed per frame
const REPULSE_DECAY = 0.88;  // velocity damping per frame (lower = snappier return)

export class ParticleSystem {
  private points: THREE.Points;
  private geo: THREE.BufferGeometry;
  private positions: Float32Array;
  private origins: Float32Array;
  private targets: Float32Array;
  private driftPhase: Float32Array;
  private velX: Float32Array;  // per-particle velocity for mouse repulsion
  private velY: Float32Array;
  private time = 0;
  private visW: number;
  private visH: number;

  constructor(scene: THREE.Scene) {
    this.visH = VIS_HEIGHT;
    this.visW = VIS_HEIGHT * (window.innerWidth / window.innerHeight);

    this.positions = new Float32Array(COUNT * 3);
    this.origins = new Float32Array(COUNT * 3);
    this.targets = new Float32Array(COUNT * 3);
    this.driftPhase = new Float32Array(COUNT);
    this.velX = new Float32Array(COUNT);
    this.velY = new Float32Array(COUNT);

    const halfW = this.visW / 2;
    const halfH = this.visH / 2;
    const bandH = this.visH * 0.18;

    for (let i = 0; i < COUNT; i++) {
      const ox = (Math.random() - 0.5) * this.visW * 0.95;
      const oy = -halfH + Math.random() * bandH;
      const oz = (Math.random() - 0.5) * 0.5;

      this.origins[i * 3] = ox;
      this.origins[i * 3 + 1] = oy;
      this.origins[i * 3 + 2] = oz;

      let tx: number, ty: number;
      do {
        tx = (Math.random() - 0.5) * this.visW * 0.9;
        ty = (Math.random() - 0.5) * this.visH * 0.9;
      } while (Math.abs(tx) < halfW * 0.3 && ty > -halfH * 0.2 && ty < halfH * 0.4);

      this.targets[i * 3] = tx;
      this.targets[i * 3 + 1] = ty;
      this.targets[i * 3 + 2] = (Math.random() - 0.5) * 0.5;

      this.positions[i * 3] = ox;
      this.positions[i * 3 + 1] = oy;
      this.positions[i * 3 + 2] = oz;

      this.driftPhase[i] = Math.random() * Math.PI * 2;
    }

    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xd4cce8,
      size: 0.05,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85,        // visible and punchy from the start
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geo, mat);
    scene.add(this.points);
  }

  update(
    scrollProgress: number,
    dt: number,
    mouse: { x: number; y: number }   // NDC -1→1 from MoonHero
  ): void {
    this.time += dt;

    // Convert mouse NDC → world coordinates (same plane as particles, z=0)
    const mx = mouse.x * (this.visW / 2);
    const my = mouse.y * (this.visH / 2);

    const burstRaw = clamp(
      (scrollProgress - PHASES.PARTICLE_BURST_START) /
      (PHASES.PARTICLE_BURST_END - PHASES.PARTICLE_BURST_START),
      0, 1
    );
    const burstT = easeInOut(burstRaw);

    // Always visible at full opacity — no scroll gating
    (this.points.material as THREE.PointsMaterial).opacity = 0.85;

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;

      // ── Burst lerp ──────────────────────────────────────
      const stagger = (i / COUNT) * 0.35;
      const pRaw = clamp((burstT - stagger * burstT), 0, 1);
      const particleT = easeInOut(pRaw);

      const baseX = lerp(this.origins[i3], this.targets[i3], particleT);
      const baseY = lerp(this.origins[i3 + 1], this.targets[i3 + 1], particleT);
      const baseZ = lerp(this.origins[i3 + 2], this.targets[i3 + 2], particleT);

      // ── Idle drift ──────────────────────────────────────
      const driftAmt = (1 - particleT) * 0.04;
      const driftY = Math.sin(this.time * DRIFT_SPEED + this.driftPhase[i]) * driftAmt;
      const driftX = Math.cos(this.time * DRIFT_SPEED * 0.6 + this.driftPhase[i]) * driftAmt * 0.4;

      // ── Mouse repulsion ──────────────────────────────────
      const dx = this.positions[i3] - mx;
      const dy = this.positions[i3 + 1] - my;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < REPULSE_RADIUS && dist > 0.001) {
        // Push particle away from mouse, stronger when closer
        const strength = (1 - dist / REPULSE_RADIUS) * REPULSE_FORCE;
        this.velX[i] += (dx / dist) * strength;
        this.velY[i] += (dy / dist) * strength;
      }

      // Decay velocity (spring back toward base position)
      this.velX[i] *= REPULSE_DECAY;
      this.velY[i] *= REPULSE_DECAY;

      // Pull back toward base so particles don't drift off screen forever
      const pullStrength = 0.04;
      this.velX[i] += (baseX - this.positions[i3]) * pullStrength;
      this.velY[i] += (baseY - this.positions[i3 + 1]) * pullStrength;

      // ── Final position ───────────────────────────────────
      this.positions[i3] = this.positions[i3] + this.velX[i] + driftX;
      this.positions[i3 + 1] = this.positions[i3 + 1] + this.velY[i] + driftY;
      this.positions[i3 + 2] = baseZ;
    }

    this.geo.attributes.position.needsUpdate = true;
  }

  resize(): void {
    this.visW = this.visH * (window.innerWidth / window.innerHeight);
  }

  destroy(): void {
    this.geo.dispose();
    (this.points.material as THREE.PointsMaterial).dispose();
    this.points.removeFromParent();
  }
}