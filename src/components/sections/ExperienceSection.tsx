"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { portfolio } from "@/config/portfolio";
import { useSectionReveal } from "@/components/journey/useSectionReveal";
import type { TimelineEntry } from "@/types";
import { Eyebrow, MaskHeading } from "./shared";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/** Route geometry (viewBox 1000 x 140). Markers sit at these fractions of the path length. */
const PATH = "M0 104 C 130 104, 170 40, 320 52 S 560 118, 690 76 S 880 28, 1000 44";
const STOPS = [0.12, 0.38, 0.64, 0.9];
const ROUTE_ORDER = ["nextgen", "lnt", "justo"]; // chronological, from the dated entries

interface Stage { key: string; label: string; sub: string; entry?: TimelineEntry }

/** Scene 05: the navigation route. The line draws with the scroll; each milestone lights up in turn. */
export function ExperienceSection() {
  const ref = useRef<HTMLElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const shipRef = useRef<HTMLDivElement>(null);
  useSectionReveal(ref);
  const [stage, setStage] = useState(0);
  const [pts, setPts] = useState<{ x: number; y: number }[]>(STOPS.map((f) => ({ x: f * 100, y: 60 })));

  const stages = useMemo<Stage[]>(() => {
    const byId = (id: string) => portfolio.experience.find((e) => e.id === id)!;
    const roles: Stage[] = ROUTE_ORDER.map((id) => { const e = byId(id); return { key: id, label: e.organization!, sub: e.period ?? "", entry: e }; });
    return [...roles, { key: "waypoints", label: "Waypoints", sub: "Education, certifications, milestones" }];
  }, []);

  // measure marker positions along the path once (percent of the viewBox)
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
          const r = STOPS[0] + Math.min(1, self.progress / 0.92) * (STOPS[3] - STOPS[0]);
          path.style.strokeDashoffset = `${len * (1 - r)}`;
          const p = path.getPointAtLength(len * r), q = path.getPointAtLength(Math.min(len, len * r + 2));
          ship.style.left = `${p.x / 10}%`;
          ship.style.top = `${(p.y / 140) * 100}%`;
          ship.style.transform = `translate(-50%, -50%) rotate(${Math.atan2(q.y - p.y, (q.x - p.x) * 1) * (180 / Math.PI)}deg)`;
          const s = STOPS.reduce((acc, f, i) => (r >= f - 0.002 ? i : acc), 0);
          if (s !== last) { last = s; setStage(s); }
        },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  const cur = stages[stage];
  const way = [
    ...portfolio.education.filter((e) => e.id === "btech"),
    ...portfolio.certifications,
    ...portfolio.milestones,
  ];

  return (
    <section id="experience" ref={ref} aria-labelledby="experience-title" className="relative h-[330svh]">
      <div className="sticky top-0 flex h-svh flex-col justify-between px-4 pt-24 pb-5 sm:px-8 sm:pb-8 lg:px-24">
        <div className="max-w-xl">
          <div className="on-art"><Eyebrow num="05">Navigation route</Eyebrow></div>
          <MaskHeading id="experience-title" className="h-section on-art" lines={["The route", "so far."]} />
        </div>

        {/* milestone card */}
        <div className="pointer-events-auto surface mb-3 max-h-[44svh] w-full max-w-[32rem] overflow-y-auto p-5 sm:p-6 slim-scroll" aria-live="polite">
          <div key={cur.key} className="rise">
            {cur.entry ? (
              <>
                <p className="eyebrow">{String(stage + 1).padStart(2, "0")} / 04 · {cur.entry.kind === "internship" ? "Internship" : "Role"}</p>
                <h3 className="display mt-2 text-[clamp(1.4rem,1.1rem+1vw,1.9rem)]">{cur.entry.title}</h3>
                <p className="text-warm-ivory">{cur.entry.organization}</p>
                <p className="meta mt-1">{[cur.entry.period, cur.entry.location].filter(Boolean).join(" · ")}</p>
                {cur.entry.details && (
                  <ul className="copy mt-3 list-disc space-y-1.5 pl-5 text-sm marker:text-sunset-amber/70">{cur.entry.details.map((d) => <li key={d}>{d}</li>)}</ul>
                )}
                {cur.entry.tools && <p className="mt-3 flex flex-wrap gap-1.5">{cur.entry.tools.map((t) => <span key={t} className="chip">{t}</span>)}</p>}
              </>
            ) : (
              <>
                <p className="eyebrow">04 / 04 · Along the route</p>
                <h3 className="display mt-2 text-[clamp(1.4rem,1.1rem+1vw,1.9rem)]">Waypoints</h3>
                <ul className="mt-3 divide-y divide-warm-ivory/10 border-y border-warm-ivory/10">
                  {way.map((w) => (
                    <li key={w.id} className="py-2 text-sm">
                      <p className="text-warm-ivory">{w.title}</p>
                      <p className="text-muted-grey">{[w.organization, w.period, w.details?.[0]].filter(Boolean).join(" · ")}</p>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        {/* the route */}
        <div className="relative h-[9rem] w-full sm:h-44">
          <div className="pointer-events-none absolute -inset-x-4 -top-16 -bottom-8 bg-gradient-to-t from-midnight/92 via-midnight/70 to-transparent sm:-inset-x-8 lg:-inset-x-24" aria-hidden />
          <svg viewBox="0 0 1000 140" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" role="img" aria-label="Route with four milestones">
            <path d={PATH} fill="none" stroke="rgb(242 235 221 / 0.4)" strokeWidth="1.5" strokeDasharray="2 7" vectorEffect="non-scaling-stroke" />
            <path ref={pathRef} d={PATH} fill="none" stroke="var(--color-sunset-amber)" strokeWidth="3" strokeLinecap="round" strokeDashoffset="1000" vectorEffect="non-scaling-stroke" />
          </svg>
          {stages.map((s, i) => {
            const on = i === stage, done = i < stage;
            return (
              <div key={s.key} className="pointer-events-none absolute" style={{ left: `${pts[i].x}%`, top: `${pts[i].y}%` }}>
                <span className={`absolute top-0 left-0 block h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all duration-500 ${on ? "scale-125 border-sunset-amber bg-sunset-amber shadow-[0_0_16px_2px_rgb(224_160_90/0.55)]" : done ? "border-sunset-amber/70 bg-sunset-amber/45" : "border-warm-ivory/40 bg-midnight"}`} />
                <p className={`absolute top-4 left-0 w-28 -translate-x-1/2 text-center sm:w-40 transition-colors duration-500 ${on ? "text-golden-sand" : done ? "text-warm-ivory/80" : "text-warm-ivory/60"} ${on ? "" : "max-sm:hidden"}`}>
                  <span className="block font-mono text-[0.72rem] tracking-[0.14em] uppercase on-art">{s.label}</span>
                  <span className="block font-mono text-[0.64rem] tracking-[0.1em] opacity-90 on-art">{s.sub}</span>
                </p>
              </div>
            );
          })}
          <div ref={shipRef} className="pointer-events-none absolute z-10" style={{ left: `${STOPS[0] * 100}%`, top: "60%" }} aria-hidden>
            <span className="block h-0 w-0 border-y-[6px] border-l-[13px] border-y-transparent border-l-golden-sand drop-shadow-[0_0_8px_rgb(237_201_146/0.7)]" />
          </div>
        </div>
      </div>
    </section>
  );
}
