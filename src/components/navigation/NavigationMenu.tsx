"use client";

import { useEffect, useState } from "react";
import { destinationById, destinations, sections } from "@/config/navigation";
import { portfolio } from "@/config/portfolio";
import { useNavigationStore } from "@/store/navigationStore";

/** Persistent top navigation (drawer on small screens) and keyboard shortcuts. */
export function NavigationMenu() {
  const current = useNavigationStore((s) => s.current);
  const entered = useNavigationStore((s) => s.entered);
  const go = useNavigationStore((s) => s.go);
  const home = useNavigationStore((s) => s.home);
  const [open, setOpen] = useState(false);

  // keyboard: 0-5 jump, Esc returns to the harbor, arrows step through sections
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const s = useNavigationStore.getState();
      if (!s.entered) return;
      if (e.key === "Escape") { setOpen(false); s.home(); return; }
      const d = destinations.find((x) => x.key === e.key);
      if (d) { s.go(d.id); return; }
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const i = sections.findIndex((x) => x.id === s.current);
        const n = sections.length;
        const next = i < 0 ? (e.key === "ArrowRight" ? 0 : n - 1) : (i + (e.key === "ArrowRight" ? 1 : -1) + n) % n;
        s.go(sections[next].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!entered) return null;
  const pick = (id: Parameters<typeof go>[0]) => { setOpen(false); go(id); };

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
      <nav aria-label="Primary" className="pointer-events-auto mx-3 mt-3 flex items-center justify-between rounded-2xl border border-cream/10 bg-navy-900/55 px-4 py-2.5 backdrop-blur-md sm:mx-5 sm:mt-4 sm:px-5">
        <button type="button" onClick={() => { setOpen(false); home(); }} className="group flex items-baseline gap-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400" aria-label="Back to the harbor">
          <span className="font-mono text-[11px] tracking-[0.35em] text-amber-300">BEYOND THE HORIZON</span>
          <span className="hidden text-xs text-cream/60 md:inline">{portfolio.name}</span>
        </button>
        <ul className="hidden items-center gap-1 lg:flex">
          {sections.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => pick(d.id)}
                aria-current={current === d.id ? "page" : undefined}
                className={`rounded-full px-3.5 py-1.5 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 ${current === d.id ? "bg-amber-400/15 text-amber-200" : "text-cream/80 hover:bg-cream/8 hover:text-cream"}`}
              >
                <span className="mr-1.5 font-mono text-[10px] text-amber-400/70">{d.key}</span>{d.title}
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="rounded-full border border-cream/15 px-3 py-1.5 font-mono text-[11px] tracking-widest text-cream/85 lg:hidden" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((v) => !v)}>
          {open ? "CLOSE" : "MENU"}
        </button>
      </nav>
      {open && (
        <div id="mobile-menu" className="pointer-events-auto mx-3 mt-2 rounded-2xl border border-cream/10 bg-navy-900/85 p-2 backdrop-blur-md sm:mx-5 lg:hidden">
          <ul>
            {destinations.map((d) => (
              <li key={d.id}>
                <button type="button" onClick={() => pick(d.id)} className={`flex w-full items-baseline justify-between rounded-xl px-4 py-3 text-left ${current === d.id ? "bg-amber-400/12 text-amber-200" : "text-cream/85"}`}>
                  <span>{d.title}<span className="ml-2 text-xs text-cream/50">{destinationById(d.id).label}</span></span>
                  <span className="font-mono text-[10px] text-amber-400/70">{d.key}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
