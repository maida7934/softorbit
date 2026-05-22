import { WordElement } from './wordElement';
import { lerp, phaseProgress } from './math';
import type { MoonScreenState, WordConfig, WordDestination } from './types';

const ORBIT_RATIO    = 1.35; // orbit radius = moonRadius * this
const SPIN_ROTATIONS = 1.5;  // full orbits across entire scroll
const FONT_MIN       = 11;
const FONT_MAX       = 17;

export class OrbitSystem {
  private words: WordElement[] = [];
  private n:     number;

  constructor(configs: WordConfig[], container: HTMLElement) {
    this.words = configs.map(
      (c) => new WordElement(c.text, c.index, container)
    );
    this.n = configs.length;
  }

  setDestinations(destinations: WordDestination[]): void {
    destinations.forEach((dest, i) => {
      if (this.words[i]) this.words[i].dest = dest;
    });
  }

  update(scrollProgress: number, moon: MoonScreenState): void {
    const orbitRadius   = moon.radius * ORBIT_RATIO;
    const orbitFontSize = lerp(FONT_MIN, FONT_MAX, phaseProgress(scrollProgress, 0, 0.5));

    // Fade in at start
    const entryOpacity = phaseProgress(scrollProgress, 0, 0.08);

    this.words.forEach((word, i) => {
      const baseAngle = (i / this.n) * Math.PI * 2 - Math.PI / 2;
      const spin      = scrollProgress * Math.PI * 2 * SPIN_ROTATIONS;
      const angle     = baseAngle + spin;

      const orbitX = moon.x + Math.cos(angle) * orbitRadius;
      const orbitY = moon.y + Math.sin(angle) * orbitRadius;

      if (word.state === 'orbit' && !word.shouldPeel(scrollProgress)) {
        word.updateOrbit(orbitX, orbitY, angle, orbitFontSize);
        // Apply entry fade on top
        if (scrollProgress < 0.08) {
          word.el.style.opacity = String(
            parseFloat(word.el.style.opacity) * entryOpacity
          );
        }
        return;
      }

      if (word.state !== 'landed') {
        word.state = 'flying';
        if (word.hasLanded(scrollProgress)) {
          word.land();
        } else {
          // Store last orbit position before peel for smooth handoff
          word.orbitX = orbitX;
          word.orbitY = orbitY;
          word.updatePeel(scrollProgress);
        }
      }
    });
  }

  fadeOutAll(opacity: number): void {
    this.words.forEach((w) => {
      w.el.style.opacity = String(opacity);
    });
  }

  destroy(): void {
    this.words.forEach((w) => w.remove());
    this.words = [];
  }
}
