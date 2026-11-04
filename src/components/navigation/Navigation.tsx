"use client";

import { useEffect, useRef, useState } from "react";
import { destinationById, destinations, sections } from "@/config/navigation";
import { portfolio } from "@/config/portfolio";
import { scrollToSection } from "@/lib/journey";
import { useNavigationStore } from "@/store/navigationStore";
import type { DestinationId } from "@/types";

/** Fixed top bar, vertical progress rail and mobile drawer. All driven by the scroll-derived `active`. */
export function Navigation() {
  const active = useNavigationStore((s) => s.active);
  const entered = useNavigationStore((s) => s.entered);
  const [open, setOpen] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLDivElement>(null);

  const go = (id: DestinationId) => { setOpen(false); scrollToSection(id); };

  // drawer: Escape closes, focus moves in and returns to the button
  useEffect(() => {
    if (!open) return;
    const first = drawer.current?.querySelector<HTMLElement>("button");
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); menuBtn.current?.focus(); }
      if (e.key === "Tab" && drawer.current) {
        const f = Array.from(drawer.current.querySelectorAll<HTMLElement>("button, a")).concat(menuBtn.current!);
        const i = f.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const current = destinationById(active);

  return (
    <>
      <a href="#about" onClick={(e) => { e.preventDefault(); go("about"); }} className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[90] focus:rounded focus:bg-sunset-amber focus:px-3 focus:py-2 focus:text-deep-navy">Skip to content</a>
      <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-700 ${entered ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"}`} data-nav>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-midnight/85 via-midnight/45 to-transparent" aria-hidden />
        <nav aria-label="Primary" className="relative flex items-center justify-between px-4 py-3 sm:px-8 sm:py-5">
          <button type="button" onClick={() => go("home")} className="group flex flex-col text-left" aria-label="Back to the beginning">
            <span className="font-mono text-[0.66rem] tracking-[0.28em] text-warm-ivory on-art transition-colors group-hover:text-golden-sand sm:text-[0.7rem] sm:tracking-[0.32em]">BEYOND<span className="max-sm:hidden"> THE</span> HORIZON</span>
            <span className="meta mt-0.5 hidden sm:block on-art">{portfolio.name}</span>
          </button>

          <ul className="hidden items-center gap-1 lg:flex">
            {sections.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => go(d.id)}
                  aria-current={active === d.id ? "true" : undefined}
                  className={`group relative px-3.5 py-2 font-mono text-[0.7rem] tracking-[0.2em] uppercase on-art transition-colors ${active === d.id ? "text-golden-sand" : "text-warm-ivory/80 hover:text-warm-ivory"}`}
                >
                  {d.title}
                  <span className={`absolute inset-x-3.5 -bottom-0.5 h-px origin-left bg-sunset-amber transition-transform duration-500 ease-out ${active === d.id ? "scale-x-100" : "scale-x-0 group-hover:scale-x-50"}`} />
                </button>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-3 lg:hidden">
            <span className="meta on-art whitespace-nowrap" aria-hidden>{current.num} / {current.title}</span>
            <button ref={menuBtn} type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="drawer" className="btn btn-secondary !min-h-11 !px-4">
              {open ? "Close" : "Menu"}
            </button>
          </div>
        </nav>
      </header>

      {/* progress rail */}
      <nav aria-label="Journey progress" className={`fixed top-1/2 right-5 z-40 hidden -translate-y-1/2 transition-opacity duration-700 xl:block ${entered ? "opacity-100" : "opacity-0"}`}>
        <ol className="relative flex flex-col items-end gap-4">
          <span className="absolute top-2 right-[3px] bottom-2 w-px bg-warm-ivory/15" aria-hidden />
          {destinations.map((d) => {
            const on = active === d.id;
            return (
              <li key={d.id} className="relative">
                <button type="button" onClick={() => go(d.id)} aria-label={`${d.num} ${d.label}`} aria-current={on ? "true" : undefined} className="group flex items-center gap-3">
                  <span className={`font-mono text-[0.66rem] tracking-[0.2em] uppercase on-art transition-all duration-300 ${on ? "text-golden-sand opacity-100" : "translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:text-warm-ivory/90 group-hover:opacity-100 group-focus-visible:opacity-100"}`}>
                    {d.num}<span className={`${on ? "hidden" : ""} group-hover:inline`}> — {d.label}</span>
                  </span>
                  <span className={`relative block h-[7px] w-[7px] rounded-full transition-all duration-300 ${on ? "scale-125 bg-sunset-amber" : "bg-warm-ivory/35 group-hover:bg-warm-ivory/70"}`} />
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* mobile drawer */}
      <div
        id="drawer"
        ref={drawer}
        className={`fixed inset-0 z-[45] bg-midnight px-6 pt-24 pb-8 transition-opacity duration-300 lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        aria-hidden={!open}
        inert={!open}
      >
        <ul className="flex h-full flex-col justify-center gap-1">
          {destinations.map((d) => (
            <li key={d.id}>
              <button type="button" onClick={() => go(d.id)} aria-current={active === d.id ? "true" : undefined} className="flex w-full min-h-14 items-baseline gap-4 border-b border-warm-ivory/10 py-3 text-left">
                <span className="meta w-8 text-sunset-amber">{d.num}</span>
                <span className={`display text-3xl ${active === d.id ? "text-golden-sand" : "text-warm-ivory"}`}>{d.id === "home" ? "Arrival" : d.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
