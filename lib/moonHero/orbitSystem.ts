import { lerp, clamp, easeInOut } from './math';
import { PHASES } from './types';
import type { WordDestination } from './destinationCalc';
import type { MoonScreenState } from './projectionUtils';

export interface OrbitWord {
  text: string;
  index: number;
}

const FONT_MIN = 15;
const FONT_MAX = 24;

export class OrbitSystem {
  private words: OrbitWord[];
  private container: HTMLElement;
  private spans: HTMLElement[] = [];
  private destinations: WordDestination[] = [];
  private orbitAngle = 0;

  // Orbit ellipse proportions relative to moon radius
  private readonly ORB_RX_MULT = 1.55;
  private readonly ORB_RY_MULT = 0.44;
  private readonly ORBIT_SPEED = 0.007; // radians per frame at 60fps

  constructor(words: OrbitWord[], container: HTMLElement) {
    this.words = words;
    this.container = container;
    this.container.innerHTML = ''; // Clear orphaned spans from StrictMode
    this.spans = words.map((w) => this.createSpan(w.text, w.index));
  }

  private createSpan(text: string, index: number): HTMLElement {
    const el = document.createElement('span');
    el.textContent = text;
    
    // First 3 words are bold Cormorant, rest are Pinyon Script
    const isHighlight = index < 3;
    const fontFamily = isHighlight ? 'var(--font-cormorant), serif' : 'var(--font-pinyon), cursive';
    const fontWeight = isHighlight ? '700' : '400';
    // Pinyon script runs small, so we bump its relative scale
    const scaleTransform = isHighlight ? 'translate(-50%, -50%)' : 'translate(-50%, -50%) scale(1.3)';
    
    el.style.cssText = `
      position: absolute;
      font-family: ${fontFamily};
      font-weight: ${fontWeight};
      color: #f7eef7;
      text-shadow: 0 0 14px rgba(95, 73, 73, 0.65);
      white-space: nowrap;
      transform: ${scaleTransform};
      pointer-events: none;
      will-change: transform, opacity, font-size;
      opacity: 0;
      font-size: 16px;
    `;
    this.container.appendChild(el);
    return el;
  }

  setDestinations(dests: WordDestination[]): void {
    this.destinations = dests;
  }

  /**
   * Called every frame from the rAF loop.
   * @param scrollProgress  0→1
   * @param moonState       current moon screen position + radius
   */
  update(scrollProgress: number, moonState: MoonScreenState): void {
    this.orbitAngle += this.ORBIT_SPEED;

    const { x: mcx, y: mcy, radius: R } = moonState;
    const n = this.words.length;

    const orbitFontSize = lerp(FONT_MIN, FONT_MAX, clamp(scrollProgress * 2, 0, 1));

    this.spans.forEach((span, i) => {
      const orbitAngle = this.orbitAngle * 0.66 + (i / n) * Math.PI * 2;
      const orbX = mcx + R * this.ORB_RX_MULT * Math.cos(orbitAngle);
      const orbY = mcy + R * this.ORB_RY_MULT * Math.sin(orbitAngle);
      const zDepth = Math.sin(orbitAngle); // -1 = behind moon, +1 = in front

      const wordPeelStart =
        PHASES.PEEL_START + (i / n) * (PHASES.PEEL_SPACING * n);
      const wordPeelEnd = wordPeelStart + PHASES.PEEL_DURATION;
      const peelRaw = clamp(
        (scrollProgress - wordPeelStart) / (wordPeelEnd - wordPeelStart),
        0,
        1
      );
      const peelT = easeInOut(peelRaw);

      const dst = this.destinations[i] ?? { x: mcx, y: mcy - R - 20, fontSize: 40 };

      const wx = lerp(orbX, dst.x, peelT);
      const wy = lerp(orbY, dst.y, peelT);
      const fs = lerp(orbitFontSize, dst.fontSize, peelT);

      // Hide when passing behind the moon
      let alpha = 1;
      if (peelRaw < 0.12 && zDepth < 0) {
        const dx = wx - mcx;
        const dy = wy - mcy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const hideEdge = R - fs * 0.4;
        const showEdge = R + fs * 0.6;
        alpha = clamp((dist - hideEdge) / (showEdge - hideEdge), 0, 1);
      }

      // Appear only after moon is visible (small R means nothing to see yet)
      const appear = clamp((R - 30) / 50, 0, 1);
      alpha *= appear;

      span.style.left = `${wx}px`;
      span.style.top = `${wy}px`;
      span.style.fontSize = `${Math.round(fs)}px`;
      span.style.opacity = `${alpha}`;
    });
  }

  /** Fade all spans to a given alpha (used during crossfade) */
  fadeOutAll(alpha: number): void {
    this.spans.forEach((s) => {
      s.style.opacity = `${Math.max(0, parseFloat(s.style.opacity || '1') * alpha)}`;
    });
  }

  destroy(): void {
    this.spans.forEach((s) => s.remove());
    this.spans = [];
  }
}
