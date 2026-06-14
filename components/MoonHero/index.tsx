'use client';

import { useEffect, useRef } from 'react';
import { createScene, handleResize } from '@/lib/moonHero/sceneSetup';
import { loadMoon } from '@/lib/moonHero/moonLoader';
import { MoonController } from '@/lib/moonHero/moonController';
import { OrbitSystem } from '@/lib/moonHero/orbitSystem';
import { ParticleSystem } from '@/lib/moonHero/particleSystem';
import { FluidTrail } from '@/lib/moonHero/fluidTrail';
import { Wave2D } from '@/lib/moonHero/wave2D';
import { getMoonScreenState } from '@/lib/moonHero/projectionUtils';
import { computeDestinations } from '@/lib/moonHero/destinationCalc';
import { phaseProgress, easeInOut, clamp } from '@/lib/moonHero/math';
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

const MOBILE_PARA_FONT_SIZES = [28, 24];

// ── Section 2 text blocks (matching reference layout) ─────────
const S2_BLOCK_TOP_LEFT = {
  label: 'orbital design',
  title: 'soft orbit',
  subtitle: 'Crafted with motion',
};

const S2_BLOCK_TOP_RIGHT = {
  heading: 'introduction to orbit',
  body: "Soft Orbit is a creative studio forging brands through motion and precision. Blending cutting-edge design with strategic clarity, we create systems that captivate. Designed for founders who think in futures.",
};

const S2_BLOCK_BOTTOM_LEFT = {
  heading: 'capabilities',
  body: "Branding, Motion Design, Web Development, 3D Visualization, Creative Direction",
};

const S2_BLOCK_BOTTOM_RIGHT = {
  body: "We pull your audience into orbit. Frictionless motion, infinite engagement.",
  cta: 'explore orbit',
};

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
  const heroTitleRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const paraRef = useRef<HTMLDivElement>(null);
  const section2Ref = useRef<HTMLDivElement>(null);
  const boundaryRingRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const waveCanvasRef = useRef<HTMLCanvasElement>(null);
  const section3ScrollRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const sticky = stickyRef.current;
    const canvas = canvasRef.current;
    const orbitLayer = orbitRef.current;
    const paraLayer = paraRef.current;
    const section2El = section2Ref.current;
    const boundaryRingEl = boundaryRingRef.current;
    const cardsEl = cardsRef.current;
    const section3El = section3ScrollRef.current;
    const waveCanvas = waveCanvasRef.current;

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
    let particleSystem: ParticleSystem | null = null;
    let wave2D: Wave2D | null = null;
    let section3Observer: IntersectionObserver | null = null;

    const mouse = { x: 0, y: 0 };
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove);

    // ── Fluid trail (separate 2D canvas) ───────────────
    const moonWrapper = document.getElementById('moon-wrapper');
    const fluidTrail = new FluidTrail(moonWrapper || sticky);

    // Section 3 reveal and standalone 2D wave canvas.
    if (section3El) {
      section3Observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            section3El.classList.add(styles.section3Visible);
          }
        },
        { threshold: 0.2 }
      );
      section3Observer.observe(section3El);
    }

    if (waveCanvas) {
      wave2D = new Wave2D(waveCanvas);
    }

    // ── Scroll driver ──
    const trigger = ScrollTrigger.create({
      trigger: outer,
      start: 'top top',
      end: 'bottom bottom',
      pin: sticky,
      pinSpacing: false,
      scrub: true,
      onUpdate: (self) => {
        scrollProgress = self.progress * 0.55;
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

        // Particle system
        particleSystem = new ParticleSystem(scene);

        // ── rAF loop ───────────────────────────────────────
        function tick(now: number): void {
          rafId = requestAnimationFrame(tick);

          const dt = (now - lastTime) / 1000;
          lastTime = now;

          moonController!.update(scrollProgress, dt);

          const moonState = getMoonScreenState(moon, camera, renderer);

          orbitSystem!.update(scrollProgress, moonState);

          particleSystem?.update(scrollProgress, dt, mouse);

          fluidTrail.setMoonZone({ x: moonState.x, y: moonState.y, radius: moonState.radius });
          fluidTrail.update(dt);

          // ── Background color remains black during parallax ──
          // (No update needed as sticky is #121212 by default)

          // ── Hero Title Animation (Depth + Detach Effect) ──
          if (heroTitleRef.current) {
            const t = Math.min(1, Math.max(0, scrollProgress / PHASES.SECTION2_START));
            const easeOut = 1 - Math.pow(1 - t, 3);

            const scale = 1 - easeOut * 0.6;
            const translateZ = -easeOut * 800;
            const translateY = -easeOut * 100;

            heroTitleRef.current.style.transform = `translate3d(0, ${translateY}vh, ${translateZ}px) scale(${scale})`;
            const opacity = Math.max(0, 1 - easeOut * 1.5);
            heroTitleRef.current.style.opacity = `${opacity}`;
          }

          // ── Section 2 text animation (slide up) ──
          if (section2El) {
            animateSection2(scrollProgress, section2El);
          }

          // ── Moon boundary ring ──
          if (boundaryRingEl) {
            animateBoundaryRing(scrollProgress, boundaryRingEl);
          }

          // (Section 4 removed to let Section 3 scroll up immediately)

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
      particleSystem?.destroy();
      wave2D?.destroy();
      section3Observer?.disconnect();
      fluidTrail.destroy();
      renderer.dispose();
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <>
      <div ref={outerRef} className={styles.outer}>
        <div className={styles.sticky} ref={stickyRef}>
          <div ref={heroTitleRef} className={styles.heroTitleLayer}>
            <div className={styles.heroTitleTopLeft}>Forging<br/>companies that</div>
            <div className={styles.heroTitleBottomRight}>shape<br/>the future</div>
          </div>
          <div id="moon-wrapper" className={styles.moonWrapper}>
            <canvas ref={canvasRef} className={styles.canvas} />
          </div>
          <div ref={orbitRef} className={styles.orbitLayer} />
          <div ref={paraRef} className={styles.paraLayer} />

          {/* Moon boundary ring */}
          <div ref={boundaryRingRef} className={styles.moonBoundaryRing} />

          {/* Section 2: Four Text Blocks surrounding the moon */}
          <div ref={section2Ref} className={styles.section2Text}>
            {/* Top Left: Label + Title */}
            <div className={`${styles.s2Block} ${styles.s2BlockTopLeft}`}>
              <span className={styles.clipLine}>
                <span className={styles.textLine}>{S2_BLOCK_TOP_LEFT.label}</span>
              </span>
              <span className={styles.clipLine}>
                <span className={`${styles.textLine}`} style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'var(--font-roc), sans-serif', letterSpacing: '-0.02em' }}>
                  {S2_BLOCK_TOP_LEFT.title}
                </span>
              </span>
              <span className={styles.clipLine}>
                <span className={styles.textLine}>{S2_BLOCK_TOP_LEFT.subtitle}</span>
              </span>
            </div>

            {/* Top Right: Heading + Body */}
            <div className={`${styles.s2Block} ${styles.s2BlockTopRight}`}>
              <span className={styles.clipLine}>
                <span className={styles.textLine} style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                  {S2_BLOCK_TOP_RIGHT.heading}
                </span>
              </span>
              {S2_BLOCK_TOP_RIGHT.body.match(/.{1,52}(\s|$)/g)?.map((line, j) => (
                <span key={j} className={styles.clipLine}>
                  <span className={styles.textLine}>{line.trim()}</span>
                </span>
              ))}
            </div>

            {/* Bottom Left: Sub-label */}
            <div className={`${styles.s2Block} ${styles.s2BlockBottomLeft}`}>
              <span className={styles.clipLine}>
                <span className={styles.textLine} style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                  {S2_BLOCK_BOTTOM_LEFT.heading}
                </span>
              </span>
              {S2_BLOCK_BOTTOM_LEFT.body.split(', ').map((item, j) => (
                <span key={j} className={styles.clipLine}>
                  <span className={styles.textLine}>{item}</span>
                </span>
              ))}
            </div>

            {/* Bottom Right: Body + CTA */}
            <div className={`${styles.s2Block} ${styles.s2BlockBottomRight}`}>
              {S2_BLOCK_BOTTOM_RIGHT.body.match(/.{1,45}(\s|$)/g)?.map((line, j) => (
                <span key={j} className={styles.clipLine}>
                  <span className={styles.textLine}>{line.trim()}</span>
                </span>
              ))}
              <span className={styles.clipLine}>
                <span className={styles.textLine}>
                  <button className={styles.s2Cta}>{S2_BLOCK_BOTTOM_RIGHT.cta}</button>
                </span>
              </span>
            </div>
          </div>

          {/* Section 4 removed */}
        </div>
      </div>

      {/* ── Section 3: Normal-scroll white panel ── */}
      <section className={styles.section3Scroll} ref={section3ScrollRef}>
        <div className={styles.section3Left}>
          <span className={styles.section3Label}>about soft orbit</span>
          <h2 className={styles.section3Heading}>
            where motion<br/>
            meets meaning
          </h2>
          <p className={styles.section3Body}>
            We don&apos;t just design — we choreograph. Every pixel is placed
            with intention, every animation engineered for emotion. Our process
            transforms static brands into living, breathing digital ecosystems
            that captivate audiences and drive lasting engagement.
          </p>
          <button
            className={styles.section3Btn}
            onClick={(e) => {
              const btn = e.currentTarget;
              btn.style.transform = 'scale(0.96)';
              setTimeout(() => {
                btn.style.transform = 'scale(1)';
              }, 150);
            }}
          >
            discover our process
            <span className={styles.btnArrow}>→</span>
          </button>
        </div>

        <div className={styles.section3Right}>
          <canvas ref={waveCanvasRef} className={styles.waveCanvas} />
        </div>
      </section>
    </>
  );
}

// ────────────────────────────────────────────────────────────────
// Section 2 text: 4 blocks sliding up from clip
// ────────────────────────────────────────────────────────────────
function animateTextSlideUp(
  scrollProgress: number,
  lines: NodeListOf<HTMLElement>,
  phaseStart: number,
  phaseEnd: number,
  staggerPerLine = 0.02
): void {
  lines.forEach((line, i) => {
    const start = phaseStart + i * staggerPerLine;
    const end   = phaseEnd   + i * staggerPerLine;

    const raw   = clamp((scrollProgress - start) / (end - start), 0, 1);
    const eased = easeInOut(raw);

    line.style.transform = `translateY(${(1 - eased) * 100}%)`;
    line.style.opacity   = `${eased}`;
  });
}

function animateSection2(
  scrollProgress: number,
  el: HTMLElement,
): void {
  const lines = el.querySelectorAll<HTMLElement>(`.${styles.textLine}`);
  animateTextSlideUp(
    scrollProgress,
    lines,
    PHASES.SECTION2_TEXT_START,
    PHASES.SECTION2_TEXT_END,
    0.02
  );

  // Smooth fade out toward section 3
  if (scrollProgress > PHASES.SECTION3_START - 0.06) {
    const fadeOut = 1 - phaseProgress(
      scrollProgress,
      PHASES.SECTION3_START - 0.06,
      PHASES.SECTION3_START
    );
    el.style.opacity = `${Math.max(0, fadeOut)}`;
  } else if (scrollProgress > PHASES.SECTION2_TEXT_START) {
    el.style.opacity = '1';
  } else {
    el.style.opacity = '0';
  }
}

// ────────────────────────────────────────────────────────────────
// Boundary ring around the moon
// ────────────────────────────────────────────────────────────────
function animateBoundaryRing(
  scrollProgress: number,
  el: HTMLElement,
): void {
  // Ring fades in as Section 2 text appears, fades out before Section 3
  const fadeIn = phaseProgress(
    scrollProgress,
    PHASES.SECTION2_TEXT_START,
    PHASES.SECTION2_TEXT_END
  );
  const fadeOut = scrollProgress > PHASES.SECTION3_START - 0.06
    ? 1 - phaseProgress(scrollProgress, PHASES.SECTION3_START - 0.06, PHASES.SECTION3_START)
    : 1;

  const alpha = easeInOut(fadeIn) * Math.max(0, fadeOut);
  el.style.opacity = `${alpha}`;

  // Subtle scale pulse
  const scale = 1 + Math.sin(scrollProgress * Math.PI * 8) * 0.02;
  el.style.transform = `translateX(-50%) scale(${scale})`;
}

// ────────────────────────────────────────────────────────────────
// Section 4 Cards: Float up from bottom and out through the top.
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

  const cardDuration = duration * 0.50;
  const stagger = (duration - cardDuration) / Math.max(totalCards - 1, 1);

  containers.forEach((container, i) => {
    const cardStart = start + (i * stagger);
    const cardEnd = cardStart + cardDuration;

    const t = phaseProgress(scrollProgress, cardStart, cardEnd);

    if (t <= 0) {
      container.style.opacity = '0';
      container.style.transform = `translateY(80vh)`;
    } else if (t >= 1) {
      container.style.opacity = '0';
      container.style.transform = `translateY(-80vh)`;
    } else {
      const eased = easeInOut(t);
      let opacity = 1;
      if (t < 0.10) opacity = t / 0.10;

      const yPos = 80 - (eased * 160);

      container.style.opacity = `${opacity}`;
      container.style.transform = `translateY(${yPos}vh)`;
    }
  });
}

// ────────────────────────────────────────────────────────────────
// Background Color Interpolation
// ────────────────────────────────────────────────────────────────
function hexToRgb(hex: string): number[] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}

const BG_COLORS = [
  { p: 0.0, color: '#121212' },                         // Hero: Blackish grey
  { p: PHASES.SECTION2_END, color: '#69606c' },         // Section 2: Soft purple
  { p: PHASES.SECTION3_END, color: '#bf9f92' },         // Section 3: Deep blue
  { p: PHASES.SECTION4_END, color: '#989fb5' },         // Section 4: Muted rose
];

function updateBackgroundColor(progress: number, el: HTMLElement): void {
  let activeColor = hexToRgb(BG_COLORS[0].color);

  for (let i = 0; i < BG_COLORS.length - 1; i++) {
    const currentPhaseEnd = BG_COLORS[i + 1].p;

    const transitionStart = currentPhaseEnd;
    const transitionEnd = currentPhaseEnd + 0.04;

    if (progress > transitionStart) {
      if (progress < transitionEnd) {
        const factor = (progress - transitionStart) / (transitionEnd - transitionStart);
        const colorA = hexToRgb(BG_COLORS[i].color);
        const colorB = hexToRgb(BG_COLORS[i + 1].color);
        activeColor = [
          Math.round(colorA[0] + factor * (colorB[0] - colorA[0])),
          Math.round(colorA[1] + factor * (colorB[1] - colorA[1])),
          Math.round(colorA[2] + factor * (colorB[2] - colorA[2])),
        ] as number[];
      } else {
        activeColor = hexToRgb(BG_COLORS[i + 1].color);
      }
    }
  }

  el.style.backgroundColor = `rgb(${activeColor[0]}, ${activeColor[1]}, ${activeColor[2]})`;
}
