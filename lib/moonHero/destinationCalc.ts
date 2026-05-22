import type { WordDestination } from './types';

/**
 * Measures text widths and computes the landing position for each word
 * so they form a centred paragraph above the moon.
 *
 * This is the SINGLE source of truth — OrbitSystem imports it from here.
 */
export function computeDestinations(
  words:        string[],
  lines:        string[][],       // e.g. [['We','build'],['digital','experiences']]
  fontSizes:    number[],         // per line, matches lines array
  moonScreenX:  number,
  moonTopY:     number
): WordDestination[] {
  const LINE_HEIGHT = 30;
  const WORD_GAP    = 12;
  const BLOCK_BOTTOM = moonTopY - 28;

  // Create a hidden measurer
  const measurer = document.createElement('span');
  measurer.style.cssText =
    'position:absolute;visibility:hidden;font-family:Georgia,serif;font-weight:700;white-space:nowrap;';
  document.body.appendChild(measurer);

  const results: WordDestination[] = [];
  let wordIndex = 0;

  lines.forEach((line, lineIdx) => {
    const fontSize = fontSizes[lineIdx];
    measurer.style.fontSize = `${fontSize}px`;

    // Measure total line width
    const lineWidth = line.reduce((acc, word) => {
      measurer.textContent = word;
      return acc + measurer.offsetWidth + WORD_GAP;
    }, 0) - WORD_GAP;

    let xCursor = moonScreenX - lineWidth / 2;
    const y = BLOCK_BOTTOM - (lines.length - 1 - lineIdx) * LINE_HEIGHT;

    line.forEach((word) => {
      measurer.textContent = word;
      const ww = measurer.offsetWidth;

      results[wordIndex] = {
        x:        xCursor + ww / 2,
        y,
        fontSize,
      };
      xCursor += ww + WORD_GAP;
      wordIndex++;
    });
  });

  document.body.removeChild(measurer);
  return results;
}
