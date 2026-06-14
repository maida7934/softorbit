'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './Section5MoonReveal.module.css';

gsap.registerPlugin(ScrollTrigger);

export default function Section5MoonReveal() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const moonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const pinContainer = pinRef.current;
    const image = imageRef.current;
    const moon = moonRef.current;
    if (!wrapper || !pinContainer || !image || !moon) return;

    // ── Phase 1: Pull-up reveal (no pin, just natural scroll layering) ──
    // The section has z-index: 20 and sits below Section 4 visually.
    // As user scrolls, it naturally slides up over Section 4 — no GSAP needed
    // for the pull-up itself, that's pure CSS stacking + scroll.

    // ── Phase 2: Pin while moon is centre-stage ──
    const holdTrigger = ScrollTrigger.create({
      trigger: pinContainer,
      start: 'top top',
      end: '+=150%',        // hold for 1.5x viewport of scroll
      pin: true,
      pinSpacing: true,
      scrub: 1.2,
      onUpdate: (self) => {
        const p = self.progress;

        // Image parallax: moves up slightly as user scrolls
        gsap.set(image, { y: `${p * -60}px` });

        // Moon fade in over first 20% of hold
        const fadeIn = Math.min(1, p / 0.20);
        moon.style.opacity = String(fadeIn);

        // Continuous rotation — always spinning
        const rotation = p * 540;  // 1.5 full rotations during hold
        moon.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
      }
    });

    // ── Phase 3: After pin releases, moon is position:fixed in centre ──
    // Footer's ScrollTrigger takes over from here via #section5-moon.
    // We just need to make sure the moon is in the right state when
    // the pin releases: visible, centred, rotation continuing.

    // Keep moon rotating after pin releases via a lightweight rAF
    // so it doesn't freeze while footer animates it
    let rafId: number;
    let angle = 0;
    let lastTime = performance.now();
    let footerTookOver = false;

    const rotateMoon = (now: number) => {
      if (footerTookOver) return;
      rafId = requestAnimationFrame(rotateMoon);
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      angle += dt * 30;  // 30 deg/sec
      // Only update rotation, not position/scale (footer owns those)
      // Check if footer ScrollTrigger has started
      const footerTrigger = ScrollTrigger.getAll().find(
        t => t.vars?.id === 'footer-moon'
      );
      if (footerTrigger && footerTrigger.progress > 0) {
        footerTookOver = true;
        return;
      }
      if (moon.style.position !== 'fixed') {
        moon.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
      }
    };

    // Start rAF after pin releases
    ScrollTrigger.create({
      trigger: pinContainer,
      start: 'bottom top',   // pin has fully released
      once: true,
      onEnter: () => {
        // Ensure moon is visible and centred for footer handoff
        gsap.set(moon, {
          position: 'fixed',
          top: '50%',
          left: '50%',
          x: 0,
          y: 0,
          scale: 1,
          opacity: 1,
        });
        lastTime = performance.now();
        rafId = requestAnimationFrame(rotateMoon);
      }
    });

    return () => {
      holdTrigger.kill();
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <div ref={pinRef} className={styles.pinContainer}>

        <div className={styles.imageLayer}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src="/back.jpeg"
            alt=""
            className={styles.parallaxImage}
          />
          <div className={styles.imageOverlay} />
        </div>

        {/* This is the moon the footer animates */}
        <div ref={moonRef} id="section5-moon" className={styles.moon}>
          <div className={styles.moonInner} />
        </div>

      </div>
    </div>
  );
}