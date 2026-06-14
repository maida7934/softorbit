'use client';

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./Section4Deck.module.css";

gsap.registerPlugin(ScrollTrigger);

const N = 4;

const TITLES = [
  "Data Strategy",
  "System Architecture",
  "Performance Tuning",
  "Global Deployment",
];

const CARD_DESCS_LEFT = [
  "We begin by modeling the data landscape. By extracting key insights from chaotic inputs, we construct a resilient foundation for long-term growth.",
  "Structuring complexity into elegant workflows. Our architectural patterns are designed to scale, accommodating high throughput with minimal friction.",
  "Every millisecond matters. We ruthlessly optimize execution paths, leveraging advanced caching and concurrent processing for flawless interactions.",
  "Taking it to the world. Our global deployment pipelines ensure zero-downtime rollouts, load balancing across edge nodes for universal reliability.",
];

const CARD_DESCS_RIGHT = [
  "01 — Extraction & Modeling",
  "02 — Structural Blueprinting",
  "03 — Throughput Optimization",
  "04 — Edge Distribution",
];

/* ── Helpers ─────────────────────────────────────────────────── */
function eio(t: number) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)); }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function norm(v: number, a: number, b: number) { return clamp((v - a) / (b - a), 0, 1); }

function deckRestY(i: number) { return -i * 13; }
function deckRestScale(i: number) { return 1 - i * 0.042; }

export default function Section4Deck() {
  const pinContainerRef = useRef<HTMLDivElement>(null);
  const dCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const descTextsLeftRef = useRef<(HTMLSpanElement | null)[]>([]);
  const descTextsRightRef = useRef<(HTMLSpanElement | null)[]>([]);
  const counterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const pinContainer = pinContainerRef.current;
    if (!pinContainer) return;

    const dCards = dCardRefs.current.filter(Boolean) as HTMLDivElement[];
    const descTextsLeft = descTextsLeftRef.current.filter(Boolean) as HTMLSpanElement[];
    const descTextsRight = descTextsRightRef.current.filter(Boolean) as HTMLSpanElement[];

    let prevCardIdx = -1;

    const st = ScrollTrigger.create({
      trigger: pinContainer,
      start: "top top",
      end: "+=300%",
      pin: true,
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;

        const LEAD = 0.025;
        const adj = Math.max(0, (p - LEAD) / (1 - LEAD)) * N;
        const cur = Math.floor(clamp(adj, 0, N - 0.0001));
        const frac = adj - cur;

        if (counterRef.current) {
          counterRef.current.textContent = `${cur + 1}/${N}`;
        }

        // Description crossfade
        if (cur !== prevCardIdx) {
          descTextsLeft.forEach((span, i) => {
            if (i === cur) {
              gsap.to(span, { opacity: 1, y: 0, duration: 0.4, delay: 0.2, ease: "power2.out" });
            } else {
              gsap.to(span, { opacity: 0, y: i < cur ? -14 : 14, duration: 0.2, ease: "power2.in" });
            }
          });
          descTextsRight.forEach((span, i) => {
            if (i === cur) {
              gsap.to(span, { opacity: 0.5, y: 0, duration: 0.4, delay: 0.2, ease: "power2.out" });
            } else {
              gsap.to(span, { opacity: 0, y: i < cur ? -14 : 14, duration: 0.2, ease: "power2.in" });
            }
          });
          prevCardIdx = cur;
        }

        dCards.forEach((card, i) => {
          const divEl = card.querySelector(`.${styles.cardDivider}`) as HTMLElement | null;

          let ty: number, sc: number, op: number, zi: number;

          if (i < cur) {
            // Already exited off the top of the screen
            ty = -window.innerHeight * 1.5;
            sc = 0.7;
            op = 0;
            zi = 1;
            if (divEl) divEl.style.opacity = "0";

          } else if (i === cur) {
            // Active Card
            const isLast = i === N - 1;
            const baseY = deckRestY(0);
            const LIFT = 80;

            const entryT = eio(norm(frac, 0.00, 0.42));
            const riseT = eio(norm(frac, 0.58, 1.00)); 

            const liftedY = baseY - LIFT;
            const exitY = -window.innerHeight * 1.2;

            if (!isLast && riseT > 0) {
              ty = lerp(liftedY, exitY, riseT);
              sc = lerp(1.04, 0.7, riseT);
              op = 1 - eio(norm(riseT, 0.75, 1.00));
              zi = 30;
              if (divEl) divEl.style.opacity = String(1 - riseT);
            } else {
              ty = lerp(baseY, liftedY, entryT);
              sc = lerp(deckRestScale(0), 1.04, entryT);
              op = 1;
              zi = 30;
              if (divEl) divEl.style.opacity = String(entryT * 0.9);
            }

          } else {
            // Waiting in stack
            const stackPos = i - cur;
            const compT = eio(norm(frac, 0.52, 1.00));
            ty = lerp(deckRestY(stackPos), deckRestY(Math.max(0, stackPos - 1)), compT);
            sc = lerp(deckRestScale(stackPos), deckRestScale(Math.max(0, stackPos - 1)), compT);
            op = 1;
            zi = 15 - stackPos;
            if (divEl) divEl.style.opacity = "0";
          }

          card.style.transform = `translateY(${ty}px) scale(${sc})`;
          card.style.opacity = String(op);
          card.style.zIndex = String(zi);
        });
      }
    });

    return () => {
      st.kill();
    };
  }, []);

  const renderCardContent = (i: number) => {
    switch (i) {
      case 0:
        return (
          <div className={styles.uiMockup}>
            <div className={styles.chartBar} style={{ height: '40%' }} />
            <div className={styles.chartBar} style={{ height: '70%' }} />
            <div className={styles.chartBar} style={{ height: '50%' }} />
            <div className={styles.chartBar} style={{ height: '90%' }} />
            <div className={styles.chartBar} style={{ height: '30%' }} />
          </div>
        );
      case 1:
        return (
          <div className={styles.uiMockupGrid}>
            <div className={styles.gridItem} />
            <div className={styles.gridItem} style={{ gridColumn: 'span 2' }} />
            <div className={styles.gridItem} style={{ gridRow: 'span 2' }} />
            <div className={styles.gridItem} />
            <div className={styles.gridItem} />
          </div>
        );
      case 2:
        return (
          <div className={styles.uiMockupFlow}>
            <div className={styles.flowNode} />
            <div className={styles.flowLine} />
            <div className={styles.flowNode} />
            <div className={styles.flowLine} />
            <div className={styles.flowNode} />
          </div>
        );
      case 3:
        return (
          <div className={styles.uiMockupCircle}>
            <div className={styles.circleInner}>99%</div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section className={styles.wrapper}>
      <div ref={pinContainerRef} className={styles.pinContainer}>
        <div className={styles.cardsStage}>
          
          {/* Left Text */}
          <div className={styles.sideLeft}>
            <p className={styles.cardDesc}>
              {CARD_DESCS_LEFT.map((desc, i) => (
                <span
                  key={i}
                  ref={(el) => { descTextsLeftRef.current[i] = el; }}
                  className={styles.descText}
                  style={{
                    opacity: i === 0 ? 1 : 0,
                    transform: i === 0 ? "translateY(0)" : "translateY(14px)",
                  }}
                >
                  {desc}
                </span>
              ))}
            </p>
          </div>

          {/* Cards Stack */}
          <div className={styles.stackWrap}>
            {[...TITLES].reverse().map((title, renderIdx) => {
              const di = N - 1 - renderIdx;
              return (
                <div
                  key={title}
                  ref={(el) => { dCardRefs.current[di] = el; }}
                  className={styles.card}
                  data-index={di}
                  style={{
                    transform: `translateY(${deckRestY(di)}px) scale(${deckRestScale(di)})`,
                    zIndex: N - di,
                  }}
                >
                  <div className={styles.cardInner}>
                    {renderCardContent(di)}
                  </div>
                  <div className={styles.cardDivider}>
                    <div className={styles.dividerLine} />
                    <span className={styles.dividerLabel}>{TITLES[di]}</span>
                    <div className={styles.dividerLine} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Text */}
          <div className={styles.sideRight}>
            <div className={styles.rightTexts}>
              {CARD_DESCS_RIGHT.map((desc, i) => (
                <span
                  key={i}
                  ref={(el) => { descTextsRightRef.current[i] = el; }}
                  className={styles.rightText}
                  style={{
                    opacity: i === 0 ? 0.5 : 0,
                    transform: i === 0 ? "translateY(0)" : "translateY(14px)",
                  }}
                >
                  {desc}
                </span>
              ))}
            </div>
            <span ref={counterRef} className={styles.counter}>1/{N}</span>
          </div>

        </div>
      </div>
    </section>
  );
}
