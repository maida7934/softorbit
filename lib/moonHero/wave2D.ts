// src/lib/moonHero/wave2D.ts

const COLS       = 60;
const ROWS       = 35;
const WAVE_SPEED = 0.35;
const WAVE_AMP   = 18;    // pixels

export class Wave2D {
  private canvas: HTMLCanvasElement;
  private ctx:    CanvasRenderingContext2D;
  private time  = 0;
  private rafId = 0;
  private W = 0;
  private H = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', this.resize);
    this.tick(0);
  }

  private resize = () => {
    const rect  = this.canvas.parentElement!.getBoundingClientRect();
    this.W      = rect.width;
    this.H      = rect.height;
    this.canvas.width  = this.W * devicePixelRatio;
    this.canvas.height = this.H * devicePixelRatio;
    this.ctx.scale(devicePixelRatio, devicePixelRatio);
  };

  private tick = (now: number) => {
    this.rafId = requestAnimationFrame(this.tick);
    const dt   = Math.min(now / 1000 - this.time, 0.05);
    this.time += dt * WAVE_SPEED;
    this.draw();
  };

  private draw() {
    const { ctx, W, H, time } = this;
    ctx.clearRect(0, 0, W, H);

    const colSpacing = W / (COLS - 1);
    const rowSpacing = H / (ROWS - 1);

    // Tilt the grid like the reference — project with perspective
    const tiltY = 0.38;   // vertical compression (perspective feel)
    const shiftX = W * 0.05;  // slight horizontal offset

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {

        // Wave displacement
        const w1 = Math.sin(c * 0.28 + time * 2.2) * WAVE_AMP;
        const w2 = Math.sin(r * 0.35 + time * 1.6) * WAVE_AMP * 0.5;
        const w3 = Math.sin((c + r) * 0.18 + time * 1.1) * WAVE_AMP * 0.6;

        const waveY = w1 + w2 + w3;

        // Edge fade — dots near border are more subtle
        const edgeC = Math.min(c, COLS - 1 - c) / (COLS * 0.2);
        const edgeR = Math.min(r, ROWS - 1 - r) / (ROWS * 0.2);
        const fade  = Math.min(1, edgeC) * Math.min(1, edgeR);

        // Base grid position with perspective tilt
        const baseX = c * colSpacing + shiftX;
        const baseY = r * rowSpacing * tiltY + H * 0.15;

        const x = baseX;
        const y = baseY + waveY * fade * tiltY;

        // Depth-based opacity — far rows more transparent
        const depthAlpha = 0.15 + (r / ROWS) * 0.65;
        const dotSize    = 1 + (r / ROWS) * 1.2;  // larger dots toward viewer

        ctx.beginPath();
        ctx.arc(x, y, dotSize * fade, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(10, 10, 10, ${depthAlpha * fade})`;
        ctx.fill();
      }
    }
  }

  destroy() {
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.resize);
  }
}
