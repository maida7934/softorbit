'use client';

import { useEffect, useRef } from 'react';
import { createScene, handleResize } from '@/lib/moonHero/sceneSetup';
import { loadMoon } from '@/lib/moonHero/moonLoader';
import { MoonController } from '@/lib/moonHero/moonController';
import { OrbitSystem } from '@/lib/moonHero/orbitSystem';
import { ParagraphBlock } from '@/lib/moonHero/paragraphBlock';
import type { ParagraphConfig } from '@/lib/moonHero/paragraphBlock';
import { createScrollDriver } from '@/lib/moonHero/scrollDriver';
import { getMoonScreenState } from '@/lib/moonHero/projectionUtils';
import { computeDestinations } from '@/lib/moonHero/destinationCalc';
import { phaseProgress, easeInOut } from '@/lib/moonHero/math';
import { PHASES } from '@/lib/moonHero/types';
import styles from './MoonHero.module.css';

// ── CONFIG ────────────────────────────────────────────────────
const ALL_ORBIT_WORDS = [
  'We', 'build', 'digital', 'experiences',
  'that', 'illuminate', 'brands', 'and', 'move', 'people',
];

const ALL_PARA_LINES: string[][] = [
  ['We', 'build', 'digital'],
  ['experiences', 'that', 'illuminate'],
  ['brands', 'and', 'move', 'people'],
];

const ALL_PARA_FONT_SIZES = [18, 14, 14];

const PARA_CONFIG: ParagraphConfig = {
  lines: [
    { text: 'We build digital',        fontSize: 18, opacity: 1.0,  weight: 700 },
    { text: 'experiences that',        fontSize: 14, opacity: 0.85, weight: 400 },
    { text: 'illuminate brands',       fontSize: 14, opacity: 0.85, weight: 400 },
    { text: 'and move people.',        fontSize: 14, opacity: 0.70, weight: 400 },
  ],
};

// Mobile: first 6 words → first 2 lines
const MOBILE_ORBIT_WORDS = ALL_ORBIT_WORDS.slice(0, 6);

const MOBILE_PARA_LINES: string[][] = [
  ['We', 'build', 'digital'],
  ['experiences', 'that', 'illuminate'],
];

const MOBILE_PARA_FONT_SIZES = [16, 13];

const MOBILE_PARA_CONFIG: ParagraphConfig = {
  lines: [
    { text: 'We build digital',        fontSize: 16, opacity: 1.0,  weight: 700 },
    { text: 'experiences that illuminate', fontSize: 13, opacity: 0.85, weight: 400 },
  ],
};
// ─────────────────────────────────────────────────────────────

export default function MoonHero() {
  const outerRef  = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const orbitRef  = useRef<HTMLDivElement>(null);
  const paraRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outer     = outerRef.current;
    const sticky    = stickyRef.current;
    const canvas    = canvasRef.current;
    const orbitLayer = orbitRef.current;
    const paraLayer  = paraRef.current;

    if (!outer || !sticky || !canvas || !orbitLayer || !paraLayer) return;

    // ── Responsive config ─────────────────────────────────
    const isMobile       = window.innerWidth < 768;
    const ORBIT_WORDS    = isMobile ? MOBILE_ORBIT_WORDS : ALL_ORBIT_WORDS;
    const PARA_LINES     = isMobile ? MOBILE_PARA_LINES : ALL_PARA_LINES;
    const PARA_FONT_SIZES = isMobile ? MOBILE_PARA_FONT_SIZES : ALL_PARA_FONT_SIZES;
    const paraConfig     = isMobile ? MOBILE_PARA_CONFIG : PARA_CONFIG;

    // ── Scene ──────────────────────────────────────────────
    const sceneRefs = createScene(canvas);
    const { renderer, scene, camera } = sceneRefs;

    // ── State ──────────────────────────────────────────────
    let scrollProgress = 0;
    let rafId: number;
    let lastTime = performance.now();
    let moonController: MoonController | null = null;
    let orbitSystem:    OrbitSystem    | null = null;
    let paraBlock:      ParagraphBlock | null = null;

    // ── Scroll driver ──────────────────────────────────────
    const killScroll = createScrollDriver(outer, (p) => {
      scrollProgress = p;
    });

    // ── Resize ─────────────────────────────────────────────
    const onResize = () => {
      handleResize(sceneRefs);
      if (moonController) {
        moonController.updateBreakpoint();
      }
      // Recompute destinations after resize
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

        // Pass ORBIT_WORDS.length — never hardcoded
        paraBlock = new ParagraphBlock(paraLayer, paraConfig, ORBIT_WORDS.length);

        // Initial destinations (moon at scroll=0 position)
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

          // Orbit words
          if (scrollProgress < PHASES.CROSSFADE_END - 0.08) {
            orbitSystem!.update(scrollProgress, moonState);
          }

          // Crossfade: word spans → paragraph div
          const allLandedAt = PHASES.PEEL_START
            + (ORBIT_WORDS.length - 1) * PHASES.PEEL_SPACING
            + PHASES.PEEL_DURATION;

          if (scrollProgress > allLandedAt) {
            const fadeT = easeInOut(
              phaseProgress(scrollProgress, allLandedAt, PHASES.CROSSFADE_END)
            );
            orbitSystem!.fadeOutAll(1 - fadeT);
            const blockHeight = paraBlock!.el.offsetHeight || 120;
            paraBlock!.update(
              scrollProgress,
              moonState.y - moonState.radius,
              blockHeight
            );
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
      killScroll();
      window.removeEventListener('resize', onResize);
      orbitSystem?.destroy();
      paraBlock?.remove();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={outerRef} className={styles.outer}>
      <div ref={stickyRef} className={styles.sticky}>
        <canvas ref={canvasRef} className={styles.canvas} />
        <div ref={orbitRef}  className={styles.orbitLayer} />
        <div ref={paraRef}   className={styles.paraLayer}  />
      </div>
    </div>
  );
}
