'use client';

import { useEffect, useRef } from 'react';
import { createScene, handleResize } from '@/lib/moonHero/sceneSetup';
import { loadMoon } from '@/lib/moonHero/moonLoader';
import { MoonController } from '@/lib/moonHero/moonController';
import { OrbitSystem } from '@/lib/moonHero/orbitSystem';
import { FluidTrail } from '@/lib/moonHero/fluidTrail';
import { getMoonScreenState } from '@/lib/moonHero/projectionUtils';
import { computeDestinations } from '@/lib/moonHero/destinationCalc';
import { phaseProgress, easeInOut } from '@/lib/moonHero/math';
import { PHASES } from '@/lib/moonHero/types';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
import styles from './MoonHero.module.css';

// ── CONFIG ────────────────────────────────────────────────────
const ALL_ORBIT_WORDS = [
  'Built', 'around', 'motion,', 'where', 'everything',
  'stays', 'in', 'a', 'state', 'of', 'becoming',
];

const ALL_PARA_LINES: string[][] = [
  ['Built', 'around', 'motion,'],
  ['where', 'everything', 'stays'],
  ['in', 'a', 'state', 'of', 'becoming'],
];

const ALL_PARA_FONT_SIZES = [64, 48, 48];

const MOBILE_ORBIT_WORDS = ALL_ORBIT_WORDS.slice(0, 7);

const MOBILE_PARA_LINES: string[][] = [
  ['Built', 'around', 'motion,'],
  ['where', 'everything', 'stays', 'in'],
];

const MOBILE_PARA_FONT_SIZES = [50, 40];

// ── Section text content ──────────────────────────────────────
const SECTION2_LINES = ['LUNAR', 'MOTION', 'in orbit'];
const SECTION3_LINES = ['ETERNAL', 'DRIFT', 'through space'];

// ── Cards Data ────────────────────────────────────────────────
const CARDS_DATA = [
  { title: 'Phase I', desc: 'The genesis of movement, where raw energy forms into structured arcs.', bg: '/note1.jpg' },
  { title: 'Phase II', desc: 'Equilibrium reached. The system balances centrifugal and centripetal forces.', bg: '/note2.jpg' },
  { title: 'Phase III', desc: 'Expansion. The orbit widens, capturing distant celestial bodies.', bg: '/note3.jpg' },
  { title: 'Phase IV', desc: 'Harmonic resonance. All elements vibrate at the same frequency.', bg: '/note1.jpg' },
  { title: 'Phase V', desc: 'Decay and rebirth. Old orbits shatter to form new rings.', bg: '/note2.jpg' },
  { title: 'Phase VI', desc: 'Eternal drift. The final state of infinite, frictionless motion.', bg: '/note3.jpg' },
  { title: 'Phase VII', desc: 'Quantum entanglement. The particles begin to reflect each other instantly.', bg: '/note1.jpg' },
];
// ─────────────────────────────────────────────────────────────

export default function MoonHero() {
  const outerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const paraRef = useRef<HTMLDivElement>(null);
  const section2Ref = useRef<HTMLDivElement>(null);
  const accent2Ref = useRef<HTMLDivElement>(null);
  const section3Ref = useRef<HTMLDivElement>(null);
  const accent3Ref = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const sticky = stickyRef.current;
    const canvas = canvasRef.current;
    const orbitLayer = orbitRef.current;
    const paraLayer = paraRef.current;
    const section2El = section2Ref.current;
    const accent2El = accent2Ref.current;
    const section3El = section3Ref.current;
    const accent3El = accent3Ref.current;
    const cardsEl = cardsRef.current;

    if (!outer || !sticky || !canvas || !orbitLayer || !paraLayer) return;

    // ── Responsive config ─────────────────────────────────
    const isMobile = window.innerWidth < 768;
    const ORBIT_WORDS = isMobile ? MOBILE_ORBIT_WORDS : ALL_ORBIT_WORDS;
    const PARA_LINES = isMobile ? MOBILE_PARA_LINES : ALL_PARA_LINES;
    const PARA_FONT_SIZES = isMobile ? MOBILE_PARA_FONT_SIZES : ALL_PARA_FONT_SIZES;

    // ── Scene ──────────────────────────────────────────────
    const sceneRefs = createScene(canvas);
    const { renderer, scene, camera } = sceneRefs;

    // ── State ──────────────────────────────────────────────
    let scrollProgress = 0;
    let rafId: number;
    let lastTime = performance.now();
    let moonController: MoonController | null = null;
    let orbitSystem: OrbitSystem | null = null;

    // ── Fluid trail (separate 2D canvas) ───────────────
    const moonWrapper = document.getElementById('moon-wrapper');
    const fluidTrail = new FluidTrail(moonWrapper || sticky);

    // ── Scroll driver — 4000vh ──
    const trigger = ScrollTrigger.create({
      trigger: outer,
      start: 'top top',
      end: 'bottom top',
      pin: false,
      scrub: true,
      onUpdate: (self) => {
        scrollProgress = self.progress;
      }
    });

    // ── Resize ─────────────────────────────────────────────
    const onResize = () => {
      handleResize(sceneRefs);
      fluidTrail.resize();
      if (moonController) {
        moonController.updateBreakpoint();
      }
      if (orbitSystem && moonController) {
        const moonState = getMoonScreenState(
          moonController.getMesh(), camera, renderer
        );
        const dests = computeDestinations(
          ORBIT_WORDS, PARA_LINES, PARA_FONT_SIZES,
          moonState.x, moonState.y - moonState.radius
        );
        orbitSystem.setDestinations(dests);
      }
    };
    window.addEventListener('resize', onResize);

    // ── Load GLTF, then start loop ─────────────────────────
    loadMoon(
      scene,
      (moon, nativeRadius) => {
        moonController = new MoonController(moon, nativeRadius);

        orbitSystem = new OrbitSystem(
          ORBIT_WORDS.map((text, index) => ({ text, index })),
          orbitLayer
        );

        const initState = getMoonScreenState(moon, camera, renderer);
        const dests = computeDestinations(
          ORBIT_WORDS, PARA_LINES, PARA_FONT_SIZES,
          initState.x, initState.y - initState.radius
        );
        orbitSystem.setDestinations(dests);

        // ── rAF loop ───────────────────────────────────────
        function tick(now: number): void {
          rafId = requestAnimationFrame(tick);

          const dt = (now - lastTime) / 1000;
          lastTime = now;

          moonController!.update(scrollProgress, dt);

          const moonState = getMoonScreenState(moon, camera, renderer);

          orbitSystem!.update(scrollProgress, moonState);

          fluidTrail.setMoonZone({ x: moonState.x, y: moonState.y, radius: moonState.radius });
          fluidTrail.update(dt);

          // ── Update background color based on section ──
          if (sticky) updateBackgroundColor(scrollProgress, sticky);

          // ── Section 2 text animation (slide from left) ──
          if (section2El) {
            animateSection2(scrollProgress, section2El, accent2El);
          }

          // ── Section 3 text animation (slide up on right) ──
          if (section3El) {
            animateSection3(scrollProgress, section3El, accent3El);
          }

          // ── Section 4 cards animation ──
          if (cardsEl) {
            animateSection4Cards(scrollProgress, cardsEl);
          }

          // ── Fade out orbit words as Section 2 starts ──
          if (scrollProgress > PHASES.SECTION2_START) {
            const fadeOut = 1 - phaseProgress(
              scrollProgress,
              PHASES.SECTION2_START,
              PHASES.SECTION2_START + 0.04
            );
            orbitSystem!.fadeOutAll(fadeOut);
          }

          renderer.render(scene, camera);
        }

        rafId = requestAnimationFrame(tick);
      },
      (err) => console.error('Moon load error:', err)
    );

    // ── Cleanup ────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      trigger.kill();
      window.removeEventListener('resize', onResize);
      orbitSystem?.destroy();
      fluidTrail.destroy();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={outerRef} className={styles.outer}>
      <div className={styles.sticky} ref={stickyRef}>
        <div id="moon-wrapper" className={styles.moonWrapper}>
          <canvas ref={canvasRef} className={styles.canvas} />
        </div>
        <div ref={orbitRef} className={styles.orbitLayer} />
        <div ref={paraRef} className={styles.paraLayer} />

        {/* Section 2: Text on LEFT */}
        <div ref={section2Ref} className={styles.section2Text}>
          {SECTION2_LINES.map((line, i) => (
            <div key={i} className={styles.sectionLine}>{line}</div>
          ))}
          <div ref={accent2Ref} className={styles.section2Accent} />
        </div>

        {/* Section 3: Text on RIGHT */}
        <div ref={section3Ref} className={styles.section3Text}>
          {SECTION3_LINES.map((line, i) => (
            <div key={i} className={styles.sectionLine}>{line}</div>
          ))}
          <div ref={accent3Ref} className={styles.section3Accent} />
        </div>

        {/* Section 4: Floating Cards */}
        <div ref={cardsRef} className={styles.cardsLayer}>
          {CARDS_DATA.map((card, i) => {
            const isLeft = i % 2 === 0;
            const tilt = isLeft ? -6 : 6;
            return (
              <div
                key={i}
                className={`${styles.cardContainer} ${isLeft ? styles.left : styles.right}`}
              >
                <div
                  className={styles.card}
                  data-tilt={tilt}
                  onPointerDown={(e) => {
                    const el = e.currentTarget;
                    el.setPointerCapture(e.pointerId);
                    el.dataset.dragging = 'true';
                    el.dataset.startX = e.clientX.toString();
                    el.dataset.startY = e.clientY.toString();
                    el.dataset.baseX = el.dataset.curX || '0';
                    el.dataset.baseY = el.dataset.curY || '0';
                    el.style.transition = 'none';
                  }}
                  onPointerMove={(e) => {
                    const el = e.currentTarget;
                    const baseTilt = Number(el.dataset.tilt || 0);

                    if (el.dataset.dragging === 'true') {
                      const dx = e.clientX - Number(el.dataset.startX);
                      const dy = e.clientY - Number(el.dataset.startY);
                      const newX = Number(el.dataset.baseX) + dx;
                      const newY = Number(el.dataset.baseY) + dy;
                      el.dataset.curX = newX.toString();
                      el.dataset.curY = newY.toString();
                      el.style.transform = `translate(${newX}px, ${newY}px) rotate(${baseTilt}deg)`;
                    } else {
                      const rect = el.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      const centerX = rect.width / 2;
                      const centerY = rect.height / 2;
                      const rotateX = ((y - centerY) / centerY) * -15;
                      const rotateY = ((x - centerX) / centerX) * 15;

                      const curX = Number(el.dataset.curX || 0);
                      const curY = Number(el.dataset.curY || 0);

                      el.style.transform = `translate(${curX}px, ${curY}px) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${baseTilt}deg) scale3d(1.05, 1.05, 1.05)`;
                      el.style.transition = 'transform 0.1s ease-out';
                    }
                  }}
                  onPointerUp={(e) => {
                    const el = e.currentTarget;
                    el.releasePointerCapture(e.pointerId);
                    el.dataset.dragging = 'false';
                    el.style.transition = 'transform 0.5s ease-out';

                    const baseTilt = Number(el.dataset.tilt || 0);
                    const curX = Number(el.dataset.curX || 0);
                    const curY = Number(el.dataset.curY || 0);
                    el.style.transform = `translate(${curX}px, ${curY}px) rotate(${baseTilt}deg)`;
                  }}
                  onPointerLeave={(e) => {
                    const el = e.currentTarget;
                    if (el.dataset.dragging === 'true') return;

                    const baseTilt = Number(el.dataset.tilt || 0);
                    const curX = Number(el.dataset.curX || 0);
                    const curY = Number(el.dataset.curY || 0);
                    el.style.transform = `translate(${curX}px, ${curY}px) rotate(${baseTilt}deg)`;
                    el.style.transition = 'transform 0.5s ease-out';
                  }}
                  style={{
                    backgroundImage: `url(${card.bg})`,
                    transform: `rotate(${tilt}deg)`
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Section 2 text: slides in from the LEFT and lands on the LEFT.
// ────────────────────────────────────────────────────────────────
function animateSection2(
  scrollProgress: number,
  el: HTMLElement,
  accentEl: HTMLElement | null
): void {
  const t = phaseProgress(
    scrollProgress,
    PHASES.SECTION2_TEXT_START,
    PHASES.SECTION2_TEXT_END
  );
  const eased = easeInOut(t);

  el.style.opacity = `${eased}`;

  const lines = el.querySelectorAll<HTMLElement>(`.${styles.sectionLine}`);
  lines.forEach((line, i) => {
    const staggerDelay = i * 0.015;
    const lineT = phaseProgress(
      scrollProgress,
      PHASES.SECTION2_TEXT_START + staggerDelay,
      PHASES.SECTION2_TEXT_END + staggerDelay
    );
    const lineEased = easeInOut(lineT);

    const translateY = 120 * (1 - lineEased);
    const lineOpacity = lineEased;
    line.style.transform = `translateY(${translateY}px)`;
    line.style.opacity = `${lineOpacity}`;
  });

  if (accentEl) {
    const accentT = phaseProgress(
      scrollProgress,
      PHASES.SECTION2_TEXT_START + 0.02,
      PHASES.SECTION2_TEXT_END
    );
    const accentEased = easeInOut(accentT);
    accentEl.style.opacity = `${accentEased}`;
    accentEl.style.transform = `scaleX(${accentEased})`;
  }

  // Fade out when Section 3 starts
  if (scrollProgress > PHASES.SECTION3_START) {
    const fadeOut = 1 - phaseProgress(
      scrollProgress,
      PHASES.SECTION3_START,
      PHASES.SECTION3_START + 0.05
    );
    el.style.opacity = `${Math.max(0, fadeOut)}`;
  }
}

// ────────────────────────────────────────────────────────────────
// Section 3 text: slides UP and lands on the RIGHT.
// ────────────────────────────────────────────────────────────────
function animateSection3(
  scrollProgress: number,
  el: HTMLElement,
  accentEl: HTMLElement | null
): void {
  const t = phaseProgress(
    scrollProgress,
    PHASES.SECTION3_TEXT_START,
    PHASES.SECTION3_TEXT_END
  );
  const eased = easeInOut(t);

  el.style.opacity = `${eased}`;

  const lines = el.querySelectorAll<HTMLElement>(`.${styles.sectionLine}`);
  lines.forEach((line, i) => {
    const staggerDelay = i * 0.015;
    const lineT = phaseProgress(
      scrollProgress,
      PHASES.SECTION3_TEXT_START + staggerDelay,
      PHASES.SECTION3_TEXT_END + staggerDelay
    );
    const lineEased = easeInOut(lineT);

    const translateY = 120 * (1 - lineEased);
    const lineOpacity = lineEased;
    line.style.transform = `translateY(${translateY}px)`;
    line.style.opacity = `${lineOpacity}`;
  });

  if (accentEl) {
    const accentT = phaseProgress(
      scrollProgress,
      PHASES.SECTION3_TEXT_START + 0.02,
      PHASES.SECTION3_TEXT_END
    );
    const accentEased = easeInOut(accentT);
    accentEl.style.opacity = `${accentEased}`;
    accentEl.style.transform = `scaleX(${accentEased})`;
  }

  // Fade out when Section 4 starts
  if (scrollProgress > PHASES.SECTION4_START) {
    const fadeOut = 1 - phaseProgress(
      scrollProgress,
      PHASES.SECTION4_START,
      PHASES.SECTION4_START + 0.05
    );
    el.style.opacity = `${Math.max(0, fadeOut)}`;
  }
}

// ────────────────────────────────────────────────────────────────
// Section 4 Cards: Float up from bottom and out through the top.
// Staggered intervals so they alternate left and right.
// ────────────────────────────────────────────────────────────────
function animateSection4Cards(
  scrollProgress: number,
  cardsEl: HTMLElement
): void {
  const containers = cardsEl.querySelectorAll<HTMLElement>(`.${styles.cardContainer}`);
  const totalCards = containers.length;
  if (totalCards === 0) return;

  const start = PHASES.SECTION4_CARDS_START;
  const end = PHASES.SECTION4_CARDS_END;
  const duration = end - start;

  // Cards take 50% of total duration to traverse the full screen.
  // This guarantees a very large vertical gap between cards on the same side.
  const cardDuration = duration * 0.50;

  // Staggering them evenly guarantees they do not overlap vertically.
  const stagger = (duration - cardDuration) / Math.max(totalCards - 1, 1);

  containers.forEach((container, i) => {
    // Alternating left/right is handled by CSS classes.
    // We just stagger them sequentially.
    const cardStart = start + (i * stagger);
    const cardEnd = cardStart + cardDuration;

    const t = phaseProgress(scrollProgress, cardStart, cardEnd);

    if (t <= 0) {
      // Below the screen, waiting
      container.style.opacity = '0';
      container.style.transform = `translateY(80vh)`;
    } else if (t >= 1) {
      // Fully above the screen, exited
      container.style.opacity = '0';
      container.style.transform = `translateY(-80vh)`;
    } else {
      // Smooth ease for position
      const eased = easeInOut(t);

      // Fade in over first 10%, but do NOT fade out at the end so it goes through the top naturally
      let opacity = 1;
      if (t < 0.10) opacity = t / 0.10;

      // Full traverse: 80vh (below) → -80vh (above)
      const yPos = 80 - (eased * 160);

      container.style.opacity = `${opacity}`;
      container.style.transform = `translateY(${yPos}vh)`;
    }
  });
}

// ────────────────────────────────────────────────────────────────
// Background Color Interpolation
// ────────────────────────────────────────────────────────────────
function interpolateColor(color1: number[], color2: number[], factor: number): string {
  const r = Math.round(color1[0] + factor * (color2[0] - color1[0]));
  const g = Math.round(color1[1] + factor * (color2[1] - color1[1]));
  const b = Math.round(color1[2] + factor * (color2[2] - color1[2]));
  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex: string): number[] {
  // Support 6-digit or 8-digit hex (ignoring alpha channel)
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}

// Whimsical colors matching the moon's magical vibe
const BG_COLORS = [
  { p: 0.0, color: '#886868ff' },                       // Hero: Deep night
  { p: PHASES.SECTION2_END, color: '#69606cff' },       // Section 2: Soft purple
  { p: PHASES.SECTION3_END, color: '#bf9f92ff' },       // Section 3: Deep blue
  { p: PHASES.SECTION4_END, color: '#989fb5ff' },       // Section 4: Muted rose
];

function updateBackgroundColor(progress: number, el: HTMLElement): void {
  let activeColor = hexToRgb(BG_COLORS[0].color);

  for (let i = 0; i < BG_COLORS.length - 1; i++) {
    const currentPhaseEnd = BG_COLORS[i + 1].p;

    // The color transitions FAST just after the moon lands (over 0.04 progress)
    const transitionStart = currentPhaseEnd;
    const transitionEnd = currentPhaseEnd + 0.04;

    if (progress > transitionStart) {
      if (progress < transitionEnd) {
        // We are inside the rapid crossfade window
        const factor = (progress - transitionStart) / (transitionEnd - transitionStart);
        const colorA = hexToRgb(BG_COLORS[i].color);
        const colorB = hexToRgb(BG_COLORS[i + 1].color);
        activeColor = [
          Math.round(colorA[0] + factor * (colorB[0] - colorA[0])),
          Math.round(colorA[1] + factor * (colorB[1] - colorA[1])),
          Math.round(colorA[2] + factor * (colorB[2] - colorA[2])),
        ] as number[];
      } else {
        // We have fully transitioned to the new color
        activeColor = hexToRgb(BG_COLORS[i + 1].color);
      }
    }
  }

  el.style.backgroundColor = `rgb(${activeColor[0]}, ${activeColor[1]}, ${activeColor[2]})`;
}
