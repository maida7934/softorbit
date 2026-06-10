'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import MoonHero from '@/components/MoonHero';
import PostMoon from '@/components/PostMoon';
import Footer from '@/components/Footer';

gsap.registerPlugin(ScrollTrigger);

export default function Experience() {
  useEffect(() => {
    // Force GSAP to recalculate all ScrollTrigger positions after both components are mounted
    // and CSS has fully applied. This fixes the issue where PostMoon calculates its pin
    // position before MoonHero's 4000vh height is applied.
    const timer = setTimeout(() => {
      ScrollTrigger.refresh(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <MoonHero />
      <PostMoon />
      <Footer />
    </>
  );
}
