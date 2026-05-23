import * as THREE from 'three';

const ROT_SPEED        = 0.005; // radians per second
const TARGET_FILL      = 0.42;  // moon fills 42% of screen height on load

export class MoonController {
  private mesh:         THREE.Group;
  private rotation:     number = 0;
  private targetScale:  number = 1;
  private nativeRadius: number;

  constructor(mesh: THREE.Group, nativeRadius: number) {
    this.mesh         = mesh;
    this.nativeRadius = nativeRadius;
    this.targetScale  = this.computeScale();

    // Apply immediately so first frame is correct
    this.mesh.scale.setScalar(this.targetScale);
    this.mesh.position.set(0, -1.0, 0);

    console.log('[MoonController] nativeRadius:', nativeRadius.toFixed(4));
    console.log('[MoonController] targetScale:', this.targetScale.toFixed(4));
  }

  private computeScale(): number {
    // Camera is at z=7, FOV=50, looking at origin
    // Visible height at z=0: 2 * 7 * tan(25°) = 6.528 world units
    const cameraZ         = 7;
    const fovRadians      = (50 * Math.PI) / 180;
    const visibleHeight   = 2 * cameraZ * Math.tan(fovRadians / 2);

    // Target: moon diameter fills TARGET_FILL of screen height
    const targetDiameter  = visibleHeight * TARGET_FILL;

    // nativeRadius is the half-extent at scale=1
    // We need: nativeRadius * 2 * scale = targetDiameter
    const scale = targetDiameter / (this.nativeRadius * 2);

    console.log('[MoonController] visibleHeight:', visibleHeight.toFixed(4));
    console.log('[MoonController] targetDiameter:', targetDiameter.toFixed(4));
    console.log('[MoonController] computed scale:', scale.toFixed(4));

    return scale;
  }

  getMesh(): THREE.Group {
    return this.mesh;
  }

  updateBreakpoint(): void {
    // Recompute on resize in case viewport changed
    this.targetScale = this.computeScale();
  }

  update(scrollProgress: number, dt: number): void {
    // Rotation only — no scroll yet
    this.rotation += ROT_SPEED * dt * 60;
    this.mesh.rotation.y = this.rotation;
    
    // Scale up to 1.5x as user scrolls (reduced from 2.5x to keep it in frame)
    const forwardScale = this.targetScale + (this.targetScale * 0.5 * scrollProgress);
    this.mesh.scale.setScalar(forwardScale);
    
    this.mesh.position.set(0, -1.0, 0);
  }
}
