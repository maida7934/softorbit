/**
 * FluidTrail — a silk-thread mouse trail rendered on a separate 2D canvas.
 * 
 * Design decisions:
 *   - Uses a dedicated 2D canvas (not WebGL) to avoid any interference with
 *     the Three.js moon renderer. Canvas2D compositing + radial-gradient
 *     "brush stamps" produce the soft, painterly look we want.
 *   - Trail points are stored in a ring buffer and drawn as chained quadratic
 *     bezier curves with per-point alpha decay, giving a natural taper.
 *   - Moon interaction: when a trail segment is within the moon's screen-space
 *     radius, its opacity drops sharply (dissolve effect) and the control-point
 *     is nudged tangentially around the sphere edge (wrap effect).
 */

export interface MoonHitZone {
  x: number;
  y: number;
  radius: number;
}

interface TrailPoint {
  x: number;
  y: number;
  age: number;   // seconds since creation
  vx: number;
  vy: number;
}

const MAX_POINTS   = 120;
const POINT_LIFE   = 1.2;    // seconds before full fade
const EASE_FACTOR  = 0.12;   // mouse-follow lag (lower = more lag)
const MIN_DIST     = 4;      // px – don't add point if mouse barely moved
const BRUSH_RADIUS = 6;      // px – soft stamp radius
const LINE_WIDTH   = 3;      // base stroke width

export class FluidTrail {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private points: TrailPoint[] = [];
  private mouseX = -1000;
  private mouseY = -1000;
  private smoothX = -1000;
  private smoothY = -1000;
  private moonZone: MoonHitZone = { x: -9999, y: -9999, radius: 0 };
  private active = true;
  private dpr = 1;

  // Handlers (stored so we can removeEventListener)
  private onMouseMoveBound: (e: MouseEvent) => void;
  private onMouseLeaveBound: () => void;

  constructor(container: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 5;
    `;
    container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d')!;
    this.resize();

    this.onMouseMoveBound = this.onMouseMove.bind(this);
    this.onMouseLeaveBound = this.onMouseLeave.bind(this);

    window.addEventListener('mousemove', this.onMouseMoveBound);
    window.addEventListener('mouseleave', this.onMouseLeaveBound);
  }

  /* ── Public API ─────────────────────────────────────── */

  /** Call every frame with the moon's current screen-space position */
  setMoonZone(zone: MoonHitZone): void {
    this.moonZone = zone;
  }

  /** Call every frame from the rAF loop, passing delta in seconds */
  update(dt: number): void {
    if (!this.active) return;

    // Clamp dt to avoid jump after tab switch
    const safeDt = Math.min(dt, 0.1);

    // Smooth the cursor position (eased follow)
    this.smoothX += (this.mouseX - this.smoothX) * EASE_FACTOR;
    this.smoothY += (this.mouseY - this.smoothY) * EASE_FACTOR;

    // Add new point if moved enough
    const last = this.points[this.points.length - 1];
    if (!last || this.dist(last.x, last.y, this.smoothX, this.smoothY) > MIN_DIST) {
      const vx = last ? this.smoothX - last.x : 0;
      const vy = last ? this.smoothY - last.y : 0;
      this.points.push({
        x: this.smoothX,
        y: this.smoothY,
        age: 0,
        vx, vy,
      });
      if (this.points.length > MAX_POINTS) {
        this.points.shift();
      }
    }

    // Age all points
    for (const p of this.points) {
      p.age += safeDt;
    }

    // Remove dead points
    this.points = this.points.filter(p => p.age < POINT_LIFE);

    // Draw
    this.draw();
  }

  resize(): void {
    this.dpr = Math.min(window.devicePixelRatio, 2);
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.canvas.width = w * this.dpr;
    this.canvas.height = h * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  destroy(): void {
    this.active = false;
    window.removeEventListener('mousemove', this.onMouseMoveBound);
    window.removeEventListener('mouseleave', this.onMouseLeaveBound);
    this.canvas.remove();
  }

  /* ── Private ────────────────────────────────────────── */

  private onMouseMove(e: MouseEvent): void {
    // Convert to position relative to the canvas
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
  }

  private onMouseLeave(): void {
    this.mouseX = -1000;
    this.mouseY = -1000;
  }

  private draw(): void {
    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    // Clear
    ctx.clearRect(0, 0, w, h);

    const pts = this.points;
    if (pts.length < 2) return;

    // Draw the trail as a smooth curve with tapered opacity
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];

      // Life ratio: 1 = fresh, 0 = dead
      const life = 1 - curr.age / POINT_LIFE;
      if (life <= 0) continue;

      // Moon interaction — dissolve + nudge
      const moonDist = this.dist(curr.x, curr.y, this.moonZone.x, this.moonZone.y);
      const moonR = this.moonZone.radius;
      let moonFade = 1;
      let nudgeX = 0;
      let nudgeY = 0;

      if (moonR > 0 && moonDist < moonR * 1.3) {
        // Dissolve: fade out as we get closer to the center
        moonFade = Math.max(0, (moonDist - moonR * 0.6) / (moonR * 0.7));

        // Nudge tangentially around the moon edge
        if (moonDist < moonR * 1.1 && moonDist > 1) {
          const dx = curr.x - this.moonZone.x;
          const dy = curr.y - this.moonZone.y;
          // Tangent = perpendicular to radial vector
          const len = Math.sqrt(dx * dx + dy * dy);
          nudgeX = (-dy / len) * (moonR * 0.15);
          nudgeY = (dx / len) * (moonR * 0.15);
        }
      }

      const alpha = life * life * moonFade * 0.65;   // quadratic fade for softness
      const width = LINE_WIDTH * life;

      // Midpoint for quadratic bezier control
      const mx = (prev.x + curr.x) / 2 + nudgeX;
      const my = (prev.y + curr.y) / 2 + nudgeY;

      // Soft stroke
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.quadraticCurveTo(mx, my, curr.x + nudgeX * 0.5, curr.y + nudgeY * 0.5);

      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Soft glow brush stamp at the current point
      if (alpha > 0.05) {
        const grad = ctx.createRadialGradient(
          curr.x + nudgeX * 0.5, curr.y + nudgeY * 0.5, 0,
          curr.x + nudgeX * 0.5, curr.y + nudgeY * 0.5, BRUSH_RADIUS * life
        );
        grad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.4})`);
        grad.addColorStop(1, `rgba(255, 255, 255, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(
          curr.x + nudgeX * 0.5, curr.y + nudgeY * 0.5,
          BRUSH_RADIUS * life, 0, Math.PI * 2
        );
        ctx.fill();
      }
    }
  }

  private dist(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
