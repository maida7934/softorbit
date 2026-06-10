'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './PostMoon.module.css';

gsap.registerPlugin(ScrollTrigger);

// ── Horizontal Cards Data ─────────────────────────────────────
const H_CARDS = [
  { title: 'Celestial Arc',    desc: 'Where light bends around invisible mass.',          bg: '/note1.jpg' },
  { title: 'Tidal Lock',       desc: 'Two bodies forever facing each other.',              bg: '/note2.jpg' },
  { title: 'Penumbra',         desc: 'The soft edge between shadow and illumination.',      bg: '/note3.jpg' },
  { title: 'Apogee',           desc: 'The farthest point in an elliptical orbit.',          bg: '/note1.jpg' },
  { title: 'Solar Wind',       desc: 'Charged particles streaming across the void.',        bg: '/note2.jpg' },
  { title: 'Event Horizon',    desc: 'The boundary from which nothing returns.',            bg: '/note3.jpg' },
  { title: 'Lagrange Point',   desc: 'Where gravitational forces perfectly balance.',       bg: '/note1.jpg' },
  { title: 'Albedo',           desc: 'The measure of reflected celestial light.',           bg: '/note2.jpg' },
];

export default function PostMoon() {
  const containerRef = useRef<HTMLDivElement>(null);
  const hScrollRef = useRef<HTMLDivElement>(null);
  const hInnerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const hSection = hScrollRef.current;
    const hInner = hInnerRef.current;
    const image = imageRef.current;
    if (!container || !hSection || !hInner || !image) return;

    const triggers: ScrollTrigger[] = [];

    // ── Smooth Parallax for Cover Image ────────────────────
    const imgTrigger = ScrollTrigger.create({
      trigger: container,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1.5,
      onUpdate: (self) => {
        // Subtle vertical shift
        gsap.set(image, {
          y: (self.progress - 0.5) * 60,
        });
      },
    });
    triggers.push(imgTrigger);

    // ── Horizontal scroll pinning ──────────────────────────
    const totalScrollWidth = hInner.scrollWidth - window.innerWidth + 200;

    const hTrigger = ScrollTrigger.create({
      trigger: hSection,
      start: 'center center',
      end: () => `+=${totalScrollWidth}`,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      scrub: 1,
      onUpdate: (self) => {
        gsap.set(hInner, {
          x: -totalScrollWidth * self.progress,
        });
      },
    });
    triggers.push(hTrigger);

    // ── Moon Reveal: Lift the entire PostMoon container ─────
    const revealTrigger = ScrollTrigger.create({
      trigger: container,
      start: 'bottom bottom',
      end: '+=100%',
      scrub: true,
      onUpdate: (self) => {
        const lift = self.progress * 100;
        container.style.transform = `translateY(-${lift}vh)`;
      },
    });
    triggers.push(revealTrigger);

    // ── Cleanup ────────────────────────────────────────────
    return () => {
      triggers.forEach((t) => t.kill());
    };
  }, []);

  return (
    <div ref={containerRef} className={styles.postMoon}>
      {/* ═══ Section A: Cover ═══ */}
      <section className={styles.coverSection}>
        <div className={styles.coverLeft}>
          <h2 className={styles.coverHeading}>
            Beyond<br />the Orbit
          </h2>
          <p className={styles.coverSubtitle}>
            Every celestial body tells a story written in gravity and light. 
            Scroll deeper to discover what lies past the visible horizon.
          </p>
          <button className={styles.coverButton}>
            Explore Further
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
        <div className={styles.coverRight}>
          <div className={styles.coverImageWrapper}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              src="/note2.jpg"
              alt="Celestial landscape"
              className={styles.coverImage}
            />
          </div>
        </div>
      </section>

      {/* ═══ Section B: Horizontal Scrolling Cards ═══ */}
      <div ref={hScrollRef} className={styles.hScrollSection}>
        <div ref={hInnerRef} className={styles.hScrollInner}>
          {H_CARDS.map((card, i) => (
            <div
              key={i}
              className={styles.hCard}
              style={{ backgroundImage: `url(${card.bg})` }}
            >
              <div className={styles.hCardOverlay} />
              <div className={styles.hCardContent}>
                <div className={styles.hCardTitle}>{card.title}</div>
                <div className={styles.hCardDesc}>{card.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ Section C: Center Image ═══ */}
      <section className={styles.centerImageSection}>
        <div className={styles.centerImageWrapper}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/note2.jpg"
            alt="Moon surface detail"
            className={styles.centerImage}
          />
        </div>
      </section>

      {/* ═══ Section D: Feedback ═══ */}
      <section className={styles.feedbackSection}>
        <h2 className={styles.feedbackHeading}>
          Share your feedback
        </h2>
        <form
          className={styles.feedbackForm}
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            type="email"
            placeholder="your@email.com"
            className={styles.feedbackInput}
          />
          <textarea
            placeholder="Tell us what you think..."
            className={styles.feedbackTextarea}
          />
          <button type="submit" className={styles.feedbackSubmit}>
            Send Feedback
          </button>
        </form>
      </section>
    </div>
  );
}
