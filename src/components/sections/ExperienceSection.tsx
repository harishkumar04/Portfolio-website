"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { portfolio } from "@/config/portfolio";
import { useSectionReveal } from "@/components/journey/useSectionReveal";
import { MaskHeading } from "./shared";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/** Route geometry (viewBox 1000 x 140). Milestones sit at these fractions of the path length. */
const PATH = "M0 104 C 130 104, 170 40, 320 52 S 560 118, 690 76 S 880 28, 1000 44";
const STOPS = [0.2, 0.54, 0.86];
const ROUTE_ORDER = ["nextgen", "lnt", "justo"]; // chronological

/** Experience: a route that draws with the scroll; each milestone shows organization, role, duration. */
export function ExperienceSection() {
  const ref = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const shipRef = useRef<HTMLDivElement>(null);
  useSectionReveal(ref);
  const [stage, setStage] = useState(0);
  const [pts, setPts] = useState<{ x: number; y: number }[]>(STOPS.map((f) => ({ x: f * 100, y: 60 })));
  const stages = useMemo(() => ROUTE_ORDER.map((id) => portfolio.experience.find((e) => e.id === id)!), []);

  // marker positions along the path (percent of the viewBox)
  useLayoutEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const len = path.getTotalLength();
    setPts(STOPS.map((f) => { const p = path.getPointAtLength(len * f); return { x: p.x / 10, y: (p.y / 140) * 100 }; }));
  }, []);

  // scroll → route progress (direct DOM updates; React state changes only when the stage changes)
  useLayoutEffect(() => {
    const root = ref.current, path = pathRef.current, ship = shipRef.current;
    if (!root || !path || !ship) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len}`;
    let last = -1;
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: root, start: "top top", end: "bottom bottom", scrub: 0.5,
        onUpdate: (self) => {
          const r = STOPS[0] + Math.min(1, self.progress / 0.9) * (STOPS[2] - STOPS[0]);
          path.style.strokeDashoffset = `${len * (1 - r)}`;
          const p = path.getPointAtLength(len * r), q = path.getPointAtLength(Math.min(len, len * r + 2));
          ship.style.left = `${p.x / 10}%`;
          ship.style.top = `${(p.y / 140) * 100}%`;
          ship.style.transform = `translate(-50%, -50%) rotate(${Math.atan2(q.y - p.y, q.x - p.x) * (180 / Math.PI)}deg)`;
          const s = STOPS.reduce((acc, f, i) => (r >= f - 0.002 ? i : acc), 0);
          if (s !== last) { last = s; setStage(s); }
        },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const cur = stages[stage];

  return (
    <section id="experience" ref={ref} aria-labelledby="experience-title" className="relative h-[270svh]">
      <div className="sticky top-0 flex h-svh flex-col justify-between pt-24 pb-4 sm:pb-8">
        <div className="px-4 sm:px-8 lg:px-24">
          <MaskHeading id="experience-title" className="h-panel on-art text-warm-ivory" lines={["Experience"]} />
        </div>

        <div className="px-0 sm:px-8 lg:px-24">
          <div className="panel pointer-events-auto" aria-live="polite">
            <article key={cur.id} className="rise">
              <h3 className="h-panel">{cur.organization}</h3>
              <p className="mt-1 text-warm-ivory">{cur.title}</p>
              <p className="label mt-0.5">{cur.period}</p>
              {cur.details && (
                <ul className="mt-3 space-y-1.5 border-t border-warm-ivory/12 pt-3 text-[0.95rem] text-muted-grey">
                  {cur.details.slice(0, 2).map((d) => <li key={d} className="flex gap-2.5"><span className="mt-[0.6em] h-1 w-1 shrink-0 rounded-full bg-sunset-amber" aria-hidden />{d}</li>)}
                </ul>
              )}
            </article>
          </div>
        </div>

        {/* the route */}
        <div className="relative mx-4 mt-6 h-28 sm:mx-8 sm:h-36 lg:mx-24">
          <div className="pointer-events-none absolute -inset-x-4 -top-10 -bottom-6 bg-gradient-to-t from-midnight/85 via-midnight/50 to-transparent sm:-inset-x-8 lg:-inset-x-24" aria-hidden />
          <svg viewBox="0 0 1000 140" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" role="img" aria-label="Route with three milestones">
            <path d={PATH} fill="none" stroke="rgb(242 235 221 / 0.4)" strokeWidth="1.5" strokeDasharray="2 7" vectorEffect="non-scaling-stroke" />
            <path ref={pathRef} d={PATH} fill="none" stroke="var(--color-sunset-amber)" strokeWidth="3" strokeLinecap="round" strokeDashoffset="1000" vectorEffect="non-scaling-stroke" />
          </svg>
          {stages.map((s, i) => {
            const on = i === stage, done = i < stage;
            return (
              <div key={s.id} className="pointer-events-none absolute" style={{ left: `${pts[i].x}%`, top: `${pts[i].y}%` }}>
                <span className={`absolute top-0 left-0 block h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all duration-500 ${on ? "scale-125 border-sunset-amber bg-sunset-amber" : done ? "border-sunset-amber/80 bg-sunset-amber/50" : "border-warm-ivory/50 bg-midnight"}`} />
                <p className={`on-art absolute top-4 left-0 w-28 -translate-x-1/2 text-center text-[0.9rem] leading-tight font-medium transition-colors duration-500 sm:w-44 ${on ? "text-golden-sand" : "text-warm-ivory"}`}>{s.organization}</p>
              </div>
            );
          })}
          <div ref={shipRef} className="pointer-events-none absolute z-10" style={{ left: `${STOPS[0] * 100}%`, top: "60%" }} aria-hidden>
            <span className="block h-0 w-0 border-y-[6px] border-l-[13px] border-y-transparent border-l-golden-sand" />
          </div>
        </div>
      </div>
    </section>
  );
}
