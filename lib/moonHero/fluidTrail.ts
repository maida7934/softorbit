/**
 * FluidTrail — a silk-thread mouse trail with starry sparkle particles.
 *
 * Design:
 *   - Uses a dedicated 2D canvas (not WebGL) layered above the Three.js moon.
 *   - Trail drawn as a single smooth Catmull-Rom spline — no sharp turns.
 *   - Per-point alpha decay gives a natural width + opacity taper.
 *   - Sparkle particles drift outward from the trail with twinkle oscillation.
 *   - Core: high-brightness white.
 *   - Bloom: faint pink (#FFD1DC) and soft green (#E1E8E0) halos at large radius.
 *   - Moon interaction: dissolve + tangential nudge near the moon's edge.
 */

import { catmullRom } from './math';

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

interface Sparkle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;      // total lifespan in seconds
  size: number;       // radius in px
  hue: number;        // 0 = white-pink, 1 = white-green, 2 = pure white
  phase: number;      // twinkle phase offset
}

// ── CONFIG ──────────────────────────────────────────────────
const MAX_POINTS   = 100;
const POINT_LIFE   = 1.0;        // seconds before full fade
const EASE_FACTOR  = 0.12;       // lower = more lag = softer motion
const MIN_DIST     = 4;          // px – more points = smoother
const BRUSH_RADIUS = 6;          // px – soft stamp radius
const LINE_WIDTH   = 3;          // base stroke width

const MAX_SPARKLES       = 150;
const SPARKLE_SPAWN_RATE = 1;    // sparkles per trail point per frame
const SPARKLE_DRIFT      = 25;   // max px/s drift speed
const SPARKLE_LIFE_MIN   = 0.3;
const SPARKLE_LIFE_MAX   = 0.8;
const SPARKLE_SIZE_MIN   = 0.5;
const SPARKLE_SIZE_MAX   = 2.0;

// Bloom halo colors
const BLOOM_PINK  = { r: 255, g: 209, b: 220 }; // #FFD1DC
const BLOOM_GREEN = { r: 225, g: 232, b: 224 }; // #E1E8E0

export class FluidTrail {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private points: TrailPoint[] = [];
  private sparkles: Sparkle[] = [];
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

  setMoonZone(zone: MoonHitZone): void {
    this.moonZone = zone;
  }

  update(dt: number): void {
    if (!this.active) return;

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

      // Spawn sparkles near the new point
      this.spawnSparkles(this.smoothX, this.smoothY, vx, vy);
    }

    // Age all points
    for (const p of this.points) {
      p.age += safeDt;
    }

    // Remove dead points
    this.points = this.points.filter(p => p.age < POINT_LIFE);

    // Update sparkles
    this.updateSparkles(safeDt);

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

  /* ── Private — Mouse ───────────────────────────────── */

  private onMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = e.clientY - rect.top;
  }

  private onMouseLeave(): void {
    this.mouseX = -1000;
    this.mouseY = -1000;
  }

  /* ── Private — Sparkles ────────────────────────────── */

  private spawnSparkles(x: number, y: number, vx: number, vy: number): void {
    const speed = Math.sqrt(vx * vx + vy * vy);
    // More sparkles at higher cursor speed
    const count = Math.min(SPARKLE_SPAWN_RATE, Math.floor(1 + speed * 0.15));

    for (let i = 0; i < count; i++) {
      if (this.sparkles.length >= MAX_SPARKLES) {
        // Recycle oldest
        this.sparkles.shift();
      }

      // Random perpendicular drift direction
      const angle = Math.random() * Math.PI * 2;
      const driftSpeed = SPARKLE_DRIFT * (0.3 + Math.random() * 0.7);

      this.sparkles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * driftSpeed,
        vy: Math.sin(angle) * driftSpeed,
        age: 0,
        life: SPARKLE_LIFE_MIN + Math.random() * (SPARKLE_LIFE_MAX - SPARKLE_LIFE_MIN),
        size: SPARKLE_SIZE_MIN + Math.random() * (SPARKLE_SIZE_MAX - SPARKLE_SIZE_MIN),
        hue: Math.floor(Math.random() * 3), // 0=pink, 1=green, 2=white
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  private updateSparkles(dt: number): void {
    for (const s of this.sparkles) {
      s.age += dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      // Dampen drift
      s.vx *= 0.97;
      s.vy *= 0.97;
    }
    this.sparkles = this.sparkles.filter(s => s.age < s.life);
  }

  /* ── Private — Drawing ─────────────────────────────── */

  private draw(): void {
    const ctx = this.ctx;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    ctx.clearRect(0, 0, w, h);

    this.drawTrail(ctx);
    this.drawSparkles(ctx);
  }

  /**
   * Draw the trail as a smooth Catmull-Rom spline with tapered width and alpha.
   * We sample sub-points between each pair, using the 4-point Catmull-Rom window.
   */
  private drawTrail(ctx: CanvasRenderingContext2D): void {
    const pts = this.points;
    if (pts.length < 2) return;

    // --- Pass 1: Wide bloom glow layer ---
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    this.drawTrailPass(ctx, pts, true);
    ctx.restore();

    // --- Pass 2: Core bright white trail ---
    this.drawTrailPass(ctx, pts, false);
  }

  private drawTrailPass(
    ctx: CanvasRenderingContext2D,
    pts: TrailPoint[],
    isBloom: boolean
  ): void {
    const n = pts.length;
    for (let i = 1; i < n; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];

      const life = 1 - curr.age / POINT_LIFE;
      if (life <= 0) continue;

      // Moon interaction
      const mx = (prev.x + curr.x) / 2;
      const my = (prev.y + curr.y) / 2;
      const moonDist = this.dist(mx, my, this.moonZone.x, this.moonZone.y);
      const moonR = this.moonZone.radius;
      let moonFade = 1;
      let nudgeX = 0;
      let nudgeY = 0;

      if (moonR > 0 && moonDist < moonR * 1.3) {
        moonFade = Math.max(0, (moonDist - moonR * 0.6) / (moonR * 0.7));
        if (moonDist < moonR * 1.1 && moonDist > 1) {
          const dx = mx - this.moonZone.x;
          const dy = my - this.moonZone.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          nudgeX = (-dy / len) * (moonR * 0.15);
          nudgeY = (dx / len) * (moonR * 0.15);
        }
      }

      if (isBloom) {
        const bloomAlpha = life * life * moonFade * 0.15;
        const bloomWidth = LINE_WIDTH * life * 4;

        if (bloomAlpha > 0.005) {
          const isEven = i % 2 === 0;
          const c = isEven ? BLOOM_PINK : BLOOM_GREEN;

          ctx.beginPath();
          ctx.moveTo(prev.x + nudgeX, prev.y + nudgeY);
          ctx.quadraticCurveTo(mx + nudgeX, my + nudgeY, curr.x + nudgeX * 0.5, curr.y + nudgeY * 0.5);
          ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${bloomAlpha})`;
          ctx.lineWidth = bloomWidth;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }
      } else {
        const alpha = life * life * moonFade * 0.7;
        const width = LINE_WIDTH * life;

        if (alpha > 0.01) {
          ctx.beginPath();
          ctx.moveTo(prev.x + nudgeX, prev.y + nudgeY);
          ctx.quadraticCurveTo(mx + nudgeX, my + nudgeY, curr.x + nudgeX * 0.5, curr.y + nudgeY * 0.5);
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.lineWidth = width;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }

        // Soft glow brush stamp
        if (alpha > 0.05) {
          const grad = ctx.createRadialGradient(
            curr.x + nudgeX * 0.5, curr.y + nudgeY * 0.5, 0,
            curr.x + nudgeX * 0.5, curr.y + nudgeY * 0.5, BRUSH_RADIUS * life
          );
          grad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.35})`);
          grad.addColorStop(1, `rgba(255, 255, 255, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(curr.x + nudgeX * 0.5, curr.y + nudgeY * 0.5, BRUSH_RADIUS * life, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  /**
   * Draw sparkle particles — tiny bright dots with bloom halos and twinkle.
   */
  private drawSparkles(ctx: CanvasRenderingContext2D): void {
    for (const s of this.sparkles) {
      const lifeRatio = 1 - s.age / s.life;
      if (lifeRatio <= 0) continue;

      // Twinkle: oscillate opacity with a sine wave
      const twinkle = 0.5 + 0.5 * Math.sin(s.age * 12 + s.phase);
      const alpha = lifeRatio * twinkle;

      if (alpha < 0.01) continue;

      // Moon zone fade
      const moonDist = this.dist(s.x, s.y, this.moonZone.x, this.moonZone.y);
      const moonR = this.moonZone.radius;
      let moonFade = 1;
      if (moonR > 0 && moonDist < moonR * 1.1) {
        moonFade = Math.max(0, (moonDist - moonR * 0.5) / (moonR * 0.6));
      }

      const finalAlpha = alpha * moonFade;
      if (finalAlpha < 0.01) continue;

      // ── Bloom halo (large, faint colored circle) ──
      const bloomRadius = s.size * 6;
      let bloomColor: typeof BLOOM_PINK;
      if (s.hue === 0) bloomColor = BLOOM_PINK;
      else if (s.hue === 1) bloomColor = BLOOM_GREEN;
      else bloomColor = { r: 255, g: 255, b: 255 };

      const bloomGrad = ctx.createRadialGradient(
        s.x, s.y, 0,
        s.x, s.y, bloomRadius
      );
      bloomGrad.addColorStop(0, `rgba(${bloomColor.r}, ${bloomColor.g}, ${bloomColor.b}, ${finalAlpha * 0.25})`);
      bloomGrad.addColorStop(1, `rgba(${bloomColor.r}, ${bloomColor.g}, ${bloomColor.b}, 0)`);
      ctx.fillStyle = bloomGrad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, bloomRadius, 0, Math.PI * 2);
      ctx.fill();

      // ── Core dot (bright white) ──
      const coreGrad = ctx.createRadialGradient(
        s.x, s.y, 0,
        s.x, s.y, s.size * lifeRatio
      );
      coreGrad.addColorStop(0, `rgba(255, 255, 255, ${finalAlpha * 0.95})`);
      coreGrad.addColorStop(0.5, `rgba(255, 255, 255, ${finalAlpha * 0.4})`);
      coreGrad.addColorStop(1, `rgba(255, 255, 255, 0)`);
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * lifeRatio, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private dist(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
