'use client';

import dynamic from 'next/dynamic';

/**
 * Client-side wrapper that disables SSR for PostMoon.
 * GSAP ScrollTrigger accesses window/document which don't exist during SSR.
 */
const PostMoon = dynamic(
  () => import('@/components/PostMoon'),
  { ssr: false }
);

export default function PostMoonClient() {
  return <PostMoon />;
}
