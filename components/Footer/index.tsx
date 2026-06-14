'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './Footer.module.css';

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const dotTargetRef = useRef<HTMLDivElement>(null);
  const gridTextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const moonWrapper = document.getElementById('section5-moon');
    const sticky = document.querySelector('[class*="sticky"]') as HTMLElement; // Get the MoonHero sticky container
    const footer = footerRef.current;
    const dotTarget = dotTargetRef.current;
    const gridText = gridTextRef.current;

    if (!moonWrapper || !footer || !dotTarget || !gridText) return;

    // 1. Text slide up animation from the line
    gsap.fromTo(gridText,
      { y: '100%' },
      {
        y: '0%',
        ease: 'power3.out',
        scrollTrigger: {
          trigger: footer,
          start: 'top 70%', // start when footer is 30% into view
          end: 'center 50%', // finish early
          scrub: 1
        }
      }
    );

    // 2. Moon shrink and background color change
    const trigger = ScrollTrigger.create({
      id: 'footer-moon',
      trigger: footer,
      start: 'top bottom',
      end: 'bottom bottom',
      scrub: true,
      onEnter: () => {
        gsap.set(moonWrapper, { position: 'fixed', top: '50%', left: '50%' });
      },
      onLeaveBack: () => {
        gsap.set(moonWrapper, { position: 'absolute', top: '50%', left: '50%', x: 0, y: 0, scale: 1 });
      },
      onUpdate: (self) => {
        const p = self.progress;

        // Target dot position dynamically 
        const targetRect = dotTarget.getBoundingClientRect();
        const targetX = targetRect.left + targetRect.width / 2;
        const targetY = targetRect.top + targetRect.height / 2;

        const startX = window.innerWidth / 2;
        const startY = window.innerHeight / 2;

        const currentX = startX + (targetX - startX) * p;
        const currentY = startY + (targetY - startY) * p;

        // Larger final scale for the moon dot
        const finalScale = 0.08;
        const scale = 1 - (1 - finalScale) * p;

        gsap.set(moonWrapper, {
          position: 'fixed',
          top: '50%',
          left: '50%',
          x: currentX - startX,
          y: currentY - startY,
          scale: scale
        });

        // Interpolate the background color of the hero from grey to deep black
        if (sticky) {
          const color = gsap.utils.interpolate('#45464c', '#0f0f13', p);
          gsap.set(sticky, { backgroundColor: color });
        }
      }
    });

    return () => {
      trigger.kill();
    };
  }, []);

  return (
    <footer ref={footerRef} className={styles.footer}>

      {/* Bottom half: Masked sliding text and absolute links */}
      <div className={styles.bottomSection}>
        <div className={styles.topRight}>
          <div className={styles.linkColumn}>
            <h4>Explore</h4>
            <a href="#">Our Story</a>
            <a href="#">Gallery</a>
            <a href="#">Blog</a>
            <a href="#">Events</a>
          </div>
          <div className={styles.linkColumn}>
            <h4>Support</h4>
            <a href="#">Contact</a>
            <a href="#">FAQs</a>
            <a href="#">Shipping</a>
            <a href="#">Refund</a>
          </div>
          <div className={styles.linkColumn}>
            <h4>Quick Links</h4>
            <a href="#">Instagram</a>
            <a href="#">Facebook</a>
            <a href="#">Medium</a>
            <a href="#">Pinterest</a>
          </div>
        </div>

        <div className={styles.textMask}>
          <div ref={gridTextRef} className={styles.gridText}>
            <div className={styles.col1}>S</div>
            <div className={styles.col2}>OFT</div>
            <div className={styles.col1}></div>
            <div className={styles.col2}>
              ORB<span className={styles.dotlessI}>
                ı
                <div ref={dotTargetRef} className={styles.dotTarget} />
              </span>T
            </div>
          </div>
        </div>
        <div className={styles.bottomLine} />
        <div className={styles.copyright}>
          DESIGN BY MAIDA COPYRIGHT © 2026. ALL RIGHTS RESERVED.
        </div>
      </div>
    </footer>
  );
}
