import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function createScrollDriver(
  triggerEl:  HTMLElement,
  onProgress: (p: number) => void
): () => void {
  gsap.registerPlugin(ScrollTrigger);

  const st = ScrollTrigger.create({
    trigger:  triggerEl,
    start:    'top top',
    end:      'bottom bottom',
    scrub:    1.2,
    onUpdate: (self) => onProgress(self.progress),
  });

  return () => st.kill();
}
