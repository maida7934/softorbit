import { easeInOut, phaseProgress } from './math';
import { PHASES } from './types';

export interface ParagraphLineConfig {
  text:     string;
  fontSize: number;
  opacity:  number;
  weight:   400 | 700;
}

export interface ParagraphConfig {
  lines: ParagraphLineConfig[];
}

export class ParagraphBlock {
  el: HTMLDivElement;
  private wordCount: number;

  /**
   * @param container  - DOM element to append to
   * @param config     - line definitions for the paragraph
   * @param wordCount  - total number of orbiting words (ORBIT_WORDS.length)
   *                     used to compute allLandedAt — NEVER hardcoded
   */
  constructor(container: HTMLElement, config: ParagraphConfig, wordCount: number) {
    this.wordCount = wordCount;

    this.el = document.createElement('div');
    this.el.style.cssText = `
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      text-align: center;
      pointer-events: none;
      z-index: 20;
      opacity: 0;
      white-space: nowrap;
    `;
    this.el.innerHTML = config.lines
      .map(
        (line) =>
          `<div style="
            font-family: Georgia, serif;
            font-size: ${line.fontSize}px;
            font-weight: ${line.weight};
            color: rgba(255, 233, 122, ${line.opacity});
            line-height: 1.75;
            letter-spacing: 0.04em;
          ">${line.text}</div>`
      )
      .join('');
    container.appendChild(this.el);
  }

  update(
    scrollProgress: number,
    moonTopY:        number,
    blockHeight:     number
  ): void {
    // Dynamic allLandedAt based on actual word count — never hardcoded
    const allLandedAt = PHASES.PEEL_START
      + (this.wordCount - 1) * PHASES.PEEL_SPACING
      + PHASES.PEEL_DURATION;

    const fadeT = phaseProgress(scrollProgress, allLandedAt, PHASES.CROSSFADE_END);
    const ep    = easeInOut(fadeT);
    const top   = moonTopY - blockHeight - 28 + (1 - ep) * 20;

    this.el.style.top     = `${top}px`;
    this.el.style.opacity = String(ep);
  }

  remove(): void {
    this.el.remove();
  }
}
