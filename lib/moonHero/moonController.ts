import * as THREE from 'three';
import { quadBezier, easeInOut, clamp } from './math';
import { PHASES } from './types';

const ROT_SPEED   = 0.005;  // radians per second
const TARGET_FILL = 0.42;   // moon fills 42% of screen height on load

// ── Section 2 Bézier: centre → RIGHT ──
const S2_START   = { x:  0,    y: -1.0, z: 0 };
const S2_CONTROL = { x:  1.5,  y:  0.6, z: 0 };
const S2_END     = { x:  3.0,  y: -0.8, z: 0 };

// ── Section 3 Bézier: RIGHT → LEFT ──
const S3_START   = { x:  3.0,  y: -0.8, z: 0 }; // matches S2_END
const S3_CONTROL = { x:  0,    y:  0.6, z: 0 };
const S3_END     = { x: -2.8,  y: -1.4, z: 0 };

// ── Section 4 Bézier: LEFT → MIDDLE BOTTOM ──
const S4_START   = { x: -2.8,  y: -1.4, z: 0 }; // matches S3_END
const S4_CONTROL = { x: -1.0,  y:  0.2, z: 0 };
const S4_END     = { x:  0.0,  y: -1.8, z: 0 };

export class MoonController {
  private mesh:         THREE.Group;
  private rotation:     number = 0;
  private targetScale:  number = 1;
  private nativeRadius: number;

  constructor(mesh: THREE.Group, nativeRadius: number) {
    this.mesh         = mesh;
    this.nativeRadius = nativeRadius;
    this.targetScale  = this.computeScale();

    this.mesh.scale.setScalar(this.targetScale);
    this.mesh.position.set(S2_START.x, S2_START.y, S2_START.z);
  }

  private computeScale(): number {
    const cameraZ        = 7;
    const fovRadians     = (50 * Math.PI) / 180;
    const visibleHeight  = 2 * cameraZ * Math.tan(fovRadians / 2);
    const targetDiameter = visibleHeight * TARGET_FILL;
    return targetDiameter / (this.nativeRadius * 2);
  }

  getMesh(): THREE.Group {
    return this.mesh;
  }

  updateBreakpoint(): void {
    this.targetScale = this.computeScale();
  }

  update(scrollProgress: number, dt: number): void {
    // ── Continuous rotation (always spins) ──
    this.rotation += ROT_SPEED * dt * 60;

    // ── Section 2 progress ──
    const s2Raw = clamp(
      (scrollProgress - PHASES.SECTION2_START) /
      (PHASES.SECTION2_END - PHASES.SECTION2_START),
      0, 1
    );
    const s2T = easeInOut(s2Raw);

    // ── Section 3 progress ──
    const s3Raw = clamp(
      (scrollProgress - PHASES.SECTION3_START) /
      (PHASES.SECTION3_END - PHASES.SECTION3_START),
      0, 1
    );
    const s3T = easeInOut(s3Raw);

    if (scrollProgress <= PHASES.SECTION2_START) {
      // ── Hero phase: scale up, stay centred ──
      const heroP = clamp(scrollProgress / PHASES.SECTION2_START, 0, 1);
      const heroScale = this.targetScale + (this.targetScale * 0.5 * heroP);
      this.mesh.scale.setScalar(heroScale);
      this.mesh.position.set(S2_START.x, S2_START.y, S2_START.z);
      this.mesh.rotation.y = this.rotation;

    } else if (scrollProgress <= PHASES.SECTION3_START) {
      // ── Section 2: curve centre → right ──
      const maxHeroScale = this.targetScale * 1.5;
      const s2Scale = maxHeroScale + (this.targetScale * 1.1 - maxHeroScale) * s2T;
      this.mesh.scale.setScalar(s2Scale);

      const px = quadBezier(S2_START.x, S2_CONTROL.x, S2_END.x, s2T);
      const py = quadBezier(S2_START.y, S2_CONTROL.y, S2_END.y, s2T);
      const pz = quadBezier(S2_START.z, S2_CONTROL.z, S2_END.z, s2T);
      this.mesh.position.set(px, py, pz);

      // Progressive extra rotation during the curve (SET, not +=)
      this.mesh.rotation.y = this.rotation + s2T * Math.PI * 2;

    } else if (scrollProgress <= PHASES.SECTION4_START) {
      // ── Section 3: curve right → left ──
      const s3Scale = this.targetScale * 1.1;
      this.mesh.scale.setScalar(s3Scale);

      const px = quadBezier(S3_START.x, S3_CONTROL.x, S3_END.x, s3T);
      const py = quadBezier(S3_START.y, S3_CONTROL.y, S3_END.y, s3T);
      const pz = quadBezier(S3_START.z, S3_CONTROL.z, S3_END.z, s3T);
      this.mesh.position.set(px, py, pz);

      // Continue from S2's final extra rotation + S3's own
      this.mesh.rotation.y = this.rotation + Math.PI * 2 + s3T * Math.PI * 2;

    } else {
      // ── Section 4: curve left → middle bottom ──
      // Calculate s4 progress
      const s4Raw = clamp(
        (scrollProgress - PHASES.SECTION4_START) /
        (PHASES.SECTION4_END - PHASES.SECTION4_START),
        0, 1
      );
      const s4T = easeInOut(s4Raw);

      const s4Scale = this.targetScale * 1.1;
      this.mesh.scale.setScalar(s4Scale);

      const px = quadBezier(S4_START.x, S4_CONTROL.x, S4_END.x, s4T);
      const py = quadBezier(S4_START.y, S4_CONTROL.y, S4_END.y, s4T);
      const pz = quadBezier(S4_START.z, S4_CONTROL.z, S4_END.z, s4T);
      this.mesh.position.set(px, py, pz);

      // Extra rotation for S4
      this.mesh.rotation.y = this.rotation + Math.PI * 4 + s4T * Math.PI * 2;
    }
  }
}
