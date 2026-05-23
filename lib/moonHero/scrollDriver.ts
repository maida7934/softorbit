/**
 * Attaches a scroll listener to `outer` and drives progress 0→1
 * based on how far the user has scrolled through the sticky section.
 *
 * Returns a cleanup function — call it on unmount.
 */
export function createScrollDriver(
  outer: HTMLElement,
  onProgress: (p: number) => void
): () => void {
  function handleScroll() {
    const scrollTop = window.scrollY;
    const outerTop = outer.getBoundingClientRect().top + window.scrollY;
    // scrollable distance = outer height - viewport height
    const scrollable = outer.offsetHeight - window.innerHeight;
    if (scrollable <= 0) { onProgress(0); return; }
    const raw = (scrollTop - outerTop) / scrollable;
    onProgress(Math.max(0, Math.min(1, raw)));
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // initialise

  return () => window.removeEventListener('scroll', handleScroll);
}
