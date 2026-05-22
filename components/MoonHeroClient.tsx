'use client';

import dynamic from 'next/dynamic';

/**
 * Client-side wrapper that disables SSR for MoonHero.
 * ssr: false MUST live inside a 'use client' component per Next.js 16 docs.
 * Three.js accesses window/document which don't exist during SSR.
 */
const MoonHero = dynamic(
  () => import('@/components/MoonHero'),
  { ssr: false }
);

export default function MoonHeroClient() {
  return <MoonHero />;
}
