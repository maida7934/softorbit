export interface WordDestination {
  x: number;   // CSS px, centre of word, relative to viewport
  y: number;   // CSS px, baseline-centre of word, relative to viewport
  fontSize: number;
}

/**
 * @param words        Flat array of all orbit words
 * @param lines        How to group words into lines e.g. [['We','build'],['digital']]
 * @param fontSizes    Font size per line (px)
 * @param moonCentreX  Moon centre X in px (from projectionUtils)
 * @param moonTopY     Moon top edge Y in px (moonState.y - moonState.radius)
 */
export function computeDestinations(
  words: string[],
  lines: string[][],
  fontSizes: number[],
  moonCentreX: number,
  moonTopY: number
): WordDestination[] {
  // Increased line height for more spacing between lines
  const LINE_HEIGHT_MULT = 1.6;

  // total headline height
  const totalH = lines.reduce(
    (acc, _line, li) => acc + fontSizes[li] * LINE_HEIGHT_MULT,
    0
  );

  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  // Vertically centered on screen
  const blockTop = (screenH - totalH) / 2;

  // Calculate maximum line width to center the left-aligned block
  // (Left in for reference, but no longer used for centering)
  const lineMetrics = lines.map((line, li) => {
    const fs = fontSizes[li];
    let width = 0;
    line.forEach((word) => {
      // Pinyon and Cormorant are much narrower than Georgia
      width += word.length * fs * 0.45 + fs * 0.25;
    });
    return width;
  });

  // Align to the left under the 'soft orbit' logo. 
  // Navbar uses 48px padding, we'll use 64px for optical alignment.
  const paddingLeft = 64;

  const destinations: WordDestination[] = [];
  let wordIdx = 0;

  lines.forEach((line, li) => {
    const fs = fontSizes[li];
    const lineY = blockTop + li * fs * LINE_HEIGHT_MULT + fs * 0.5;

    let cursor = paddingLeft;

    line.forEach((word) => {
      // Tighter character width tracking for narrower fonts
      const ww = word.length * fs * 0.45 + fs * 0.2;
      destinations.push({
        x: cursor + ww / 2, // center of word
        y: lineY,
        fontSize: fs,
      });
      cursor += ww + fs * 0.2; // tighter spacing between words
      wordIdx++;
    });
  });

  return destinations;
}
