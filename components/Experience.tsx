'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import MoonHero from '@/components/MoonHero';
import Section4Deck from '@/components/Section4Deck';
import Section5MoonReveal from '@/components/Section5MoonReveal';
import Footer from '@/components/Footer';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export default function Experience() {
  useEffect(() => {
    // Initialize Lenis
    const lenis = new Lenis();

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    const timer = setTimeout(() => {
      ScrollTrigger.refresh(true);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      lenis.destroy();
      gsap.ticker.remove(lenis.raf);
    };
  }, []);

  return (
    <>
      <MoonHero />
      <Section4Deck />
      <Section5MoonReveal />
      <Footer />
    </>
  );
}
