import { lerp, easeInOut, phaseProgress, clamp } from './math';
import type { WordDestination } from './types';
import { PHASES } from './types';

export type WordState = 'orbit' | 'flying' | 'landed';

export class WordElement {
  el:         HTMLSpanElement;
  index:      number;
  orbitX:     number = 0;
  orbitY:     number = 0;
  dest:       WordDestination | null = null;
  state:      WordState = 'orbit';
  orbitFontSize: number = 14;

  private peelAt:  number;
  private landAt:  number;

  constructor(text: string, index: number, container: HTMLElement) {
    this.index   = index;
    this.peelAt  = PHASES.PEEL_START + index * PHASES.PEEL_SPACING;
    this.landAt  = this.peelAt + PHASES.PEEL_DURATION;

    this.el = document.createElement('span');
    this.el.textContent = text;
    this.el.style.cssText = `
      position: absolute;
      transform: translate(-50%, -50%);
      font-family: Georgia, serif;
      font-weight: 700;
      color: #ffe97a;
      letter-spacing: 0.06em;
      pointer-events: none;
      will-change: left, top, opacity;
      text-shadow: 0 0 12px rgba(255,220,80,0.5);
      white-space: nowrap;
      opacity: 0;
    `;
    container.appendChild(this.el);
  }

  updateOrbit(
    x:             number,
    y:             number,
    angle:         number,
    orbitFontSize: number
  ): void {
    this.orbitX        = x;
    this.orbitY        = y;
    this.orbitFontSize = orbitFontSize;

    const sinDepth = Math.sin(angle);
    const isBehind = sinDepth < -0.08;

    if (isBehind) {
      const fade = 1 - clamp((Math.abs(sinDepth) - 0.08) / 0.37, 0, 1);
      this.el.style.opacity = String(fade);
      this.el.style.zIndex  = '4';
    } else {
      this.el.style.opacity = '1';
      this.el.style.zIndex  = '7';
    }

    this.el.style.left     = `${x}px`;
    this.el.style.top      = `${y}px`;
    this.el.style.fontSize = `${orbitFontSize}px`;
  }

  updatePeel(scrollProgress: number): void {
    if (!this.dest) return;

    const peelT = phaseProgress(scrollProgress, this.peelAt, this.landAt);
    const ep    = easeInOut(peelT);

    const x    = lerp(this.orbitX, this.dest.x, ep);
    const y    = lerp(this.orbitY, this.dest.y, ep);
    const fs   = lerp(this.orbitFontSize, this.dest.fontSize, ep);

    this.el.style.left     = `${x}px`;
    this.el.style.top      = `${y}px`;
    this.el.style.fontSize = `${fs}px`;
    this.el.style.opacity  = '1';
    this.el.style.zIndex   = '12';
  }

  land(): void {
    if (!this.dest) return;
    this.el.style.left     = `${this.dest.x}px`;
    this.el.style.top      = `${this.dest.y}px`;
    this.el.style.fontSize = `${this.dest.fontSize}px`;
    this.el.style.opacity  = '1';
    this.el.style.zIndex   = '12';
    this.state = 'landed';
  }

  shouldPeel(scrollProgress: number): boolean {
    return scrollProgress >= this.peelAt;
  }

  hasLanded(scrollProgress: number): boolean {
    return scrollProgress >= this.landAt;
  }

  remove(): void {
    this.el.remove();
  }
}
