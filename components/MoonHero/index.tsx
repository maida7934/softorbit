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

// Mobile: first 7 words → first 2 lines
const MOBILE_ORBIT_WORDS = ALL_ORBIT_WORDS.slice(0, 7);

const MOBILE_PARA_LINES: string[][] = [
  ['Built', 'around', 'motion,'],
  ['where', 'everything', 'stays', 'in'],
];

const MOBILE_PARA_FONT_SIZES = [50, 40];

const PARA_CONFIG = {
  lines: ALL_PARA_LINES,
  fontSizes: ALL_PARA_FONT_SIZES,
};

const MOBILE_PARA_CONFIG = {
  lines: MOBILE_PARA_LINES,
  fontSizes: MOBILE_PARA_FONT_SIZES,
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

    // ── Fluid trail (separate 2D canvas) ───────────────
    const fluidTrail = new FluidTrail(sticky);

    // ── Scroll driver ──────────────────────────────────────
    const trigger = ScrollTrigger.create({
      trigger: outer,
      start: 'top top',
      end: '+=800%', // Increased from 400% to give much more scroll distance at the end
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
        // ParagraphBlock is removed because OrbitSystem words now stay as the final text.

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
          
          // Debug log to confirm moonState values are sane
          if (Math.random() < 0.05) { // log roughly 3 times a second instead of 60
             console.log('[Tick Debug] moonState:', Math.round(moonState.x), Math.round(moonState.y), Math.round(moonState.radius));
          }

          // Orbit words now just animate to their destinations and stay there forever
          orbitSystem!.update(scrollProgress, moonState);

          // Fluid trail — feed it the moon zone and tick
          fluidTrail.setMoonZone({ x: moonState.x, y: moonState.y, radius: moonState.radius });
          fluidTrail.update(dt);

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
      </div>
    </div>
  );
}
