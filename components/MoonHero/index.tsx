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
  { title: 'Phase I',   desc: 'The genesis of movement, where raw energy forms into structured arcs.',        bg: '/note1.jpg' },
  { title: 'Phase II',  desc: 'Equilibrium reached. The system balances centrifugal and centripetal forces.', bg: '/note2.jpg' },
  { title: 'Phase III', desc: 'Expansion. The orbit widens, capturing distant celestial bodies.',             bg: '/note3.jpg' },
  { title: 'Phase IV',  desc: 'Harmonic resonance. All elements vibrate at the same frequency.',              bg: '/note1.jpg' },
  { title: 'Phase V',   desc: 'Decay and rebirth. Old orbits shatter to form new rings.',                    bg: '/note2.jpg' },
  { title: 'Phase VI',  desc: 'Eternal drift. The final state of infinite, frictionless motion.',             bg: '/note3.jpg' },
];
// ─────────────────────────────────────────────────────────────

export default function MoonHero() {
  const outerRef     = useRef<HTMLDivElement>(null);
  const stickyRef    = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const orbitRef     = useRef<HTMLDivElement>(null);
  const paraRef      = useRef<HTMLDivElement>(null);
  const section2Ref  = useRef<HTMLDivElement>(null);
  const accent2Ref   = useRef<HTMLDivElement>(null);
  const section3Ref  = useRef<HTMLDivElement>(null);
  const accent3Ref   = useRef<HTMLDivElement>(null);
  const cardsRef     = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outer       = outerRef.current;
    const sticky      = stickyRef.current;
    const canvas      = canvasRef.current;
    const orbitLayer  = orbitRef.current;
    const paraLayer   = paraRef.current;
    const section2El  = section2Ref.current;
    const accent2El   = accent2Ref.current;
    const section3El  = section3Ref.current;
    const accent3El   = accent3Ref.current;
    const cardsEl     = cardsRef.current;

    if (!outer || !sticky || !canvas || !orbitLayer || !paraLayer) return;

    // ── Responsive config ─────────────────────────────────
    const isMobile       = window.innerWidth < 768;
    const ORBIT_WORDS    = isMobile ? MOBILE_ORBIT_WORDS : ALL_ORBIT_WORDS;
    const PARA_LINES     = isMobile ? MOBILE_PARA_LINES : ALL_PARA_LINES;
    const PARA_FONT_SIZES = isMobile ? MOBILE_PARA_FONT_SIZES : ALL_PARA_FONT_SIZES;

    // ── Scene ──────────────────────────────────────────────
    const sceneRefs = createScene(canvas);
    const { renderer, scene, camera } = sceneRefs;

    // ── State ──────────────────────────────────────────────
    let scrollProgress = 0;
    let rafId: number;
    let lastTime = performance.now();
    let moonController: MoonController | null = null;
    let orbitSystem:    OrbitSystem    | null = null;

    // ── Fluid trail (separate 2D canvas) ───────────────
    const fluidTrail = new FluidTrail(sticky);

    // ── Scroll driver — 4000% for 4 sections + cards ──
    const trigger = ScrollTrigger.create({
      trigger: outer,
      start: 'top top',
      end: '+=4000%',
      pin: true,
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
      <div ref={stickyRef} className={styles.sticky}>
        <canvas ref={canvasRef} className={styles.canvas} />
        <div ref={orbitRef}  className={styles.orbitLayer} />
        <div ref={paraRef}   className={styles.paraLayer}  />

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
            return (
              <div 
                key={i} 
                className={`${styles.cardContainer} ${isLeft ? styles.left : styles.right}`}
              >
                <div
                  className={styles.card}
                  style={{ backgroundImage: `url(${card.bg})` }}
                >
                  <div className={styles.cardOverlay} />
                  <div className={styles.cardContent}>
                    <div className={styles.cardTitle}>{card.title}</div>
                    <div className={styles.cardDesc}>{card.desc}</div>
                  </div>
                </div>
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
    const staggerDelay = i * 0.08;
    const lineT = phaseProgress(
      scrollProgress,
      PHASES.SECTION2_TEXT_START + staggerDelay,
      PHASES.SECTION2_TEXT_END + staggerDelay
    );
    const lineEased = easeInOut(lineT);

    const translateX = (-window.innerWidth) * (1 - lineEased);
    const lineOpacity = lineEased;
    line.style.transform = `translateX(${translateX}px)`;
    line.style.opacity = `${lineOpacity}`;
  });

  if (accentEl) {
    const accentT = phaseProgress(
      scrollProgress,
      PHASES.SECTION2_TEXT_START + 0.06,
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
    const staggerDelay = i * 0.06;
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
      PHASES.SECTION3_TEXT_START + 0.06,
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

  // Each card takes 50% of total duration to traverse the full screen.
  // This allows adjacent cards (left + right) to overlap and be visible simultaneously.
  const cardDuration = duration * 0.50;

  // Cards are staggered in PAIRS: left+right cards of the same pair start together,
  // but the left card is slightly ahead. Each pair starts after ~30% of duration.
  const pairCount = Math.ceil(totalCards / 2); // 3 pairs
  const pairStagger = (duration - cardDuration) / Math.max(pairCount - 1, 1);

  containers.forEach((container, i) => {
    // Pair index: cards 0&1 are pair 0, cards 2&3 are pair 1, etc.
    const pairIndex = Math.floor(i / 2);
    // Within the pair, odd cards (right side) start slightly later
    const withinPairDelay = (i % 2 === 1) ? pairStagger * 0.15 : 0;

    const cardStart = start + (pairIndex * pairStagger) + withinPairDelay;
    const cardEnd = cardStart + cardDuration;

    const t = phaseProgress(scrollProgress, cardStart, cardEnd);

    if (t <= 0) {
      // Below the screen, waiting
      container.style.opacity = '0';
      container.style.transform = `translateY(120vh)`;
    } else if (t >= 1) {
      // Fully above the screen, exited
      container.style.opacity = '0';
      container.style.transform = `translateY(-120vh)`;
    } else {
      // Smooth ease for position
      const eased = easeInOut(t);

      // Fade in over first 15%, stay fully visible, fade out over last 10%
      let opacity = 1;
      if (t < 0.15) opacity = t / 0.15;
      if (t > 0.90) opacity = (1 - t) / 0.10;

      // Full traverse: 120vh (below) → -120vh (above)
      const yPos = 120 - (eased * 240);

      container.style.opacity = `${opacity}`;
      container.style.transform = `translateY(${yPos}vh)`;
    }
  });
}
