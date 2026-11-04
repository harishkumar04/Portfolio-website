"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { destinationById, sections } from "@/config/navigation";
import { useNavigationStore } from "@/store/navigationStore";
import type { DestinationId } from "@/types";

/** Shared panel shell: side panel on desktop (side chosen per destination), bottom sheet on mobile. */
export function Panel({ id, children }: { id: DestinationId; children: ReactNode }) {
  const d = destinationById(id);
  const go = useNavigationStore((s) => s.go);
  const home = useNavigationStore((s) => s.home);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [id]);

  const i = sections.findIndex((s) => s.id === id);
  const prev = sections[(i - 1 + sections.length) % sections.length];
  const next = sections[(i + 1) % sections.length];
  const side = d.panelSide === "left" ? "md:left-5" : "md:right-5";

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby={`panel-${id}`}
      className={`panel pointer-events-auto fixed inset-x-0 bottom-0 z-40 flex max-h-[64vh] flex-col rounded-t-3xl border border-cream/10 bg-navy-950/80 shadow-2xl backdrop-blur-xl md:inset-x-auto md:top-24 md:bottom-6 md:max-h-none md:w-[min(460px,40vw)] md:rounded-3xl ${side}`}
    >
      <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-cream/20 md:hidden" aria-hidden />
      <header className="flex items-start justify-between gap-4 px-6 pt-4 md:px-7 md:pt-6">
        <div>
          <p className="font-mono text-[10px] tracking-[0.35em] text-amber-300 uppercase">
            {String(i + 1).padStart(2, "0")} · {d.label}
          </p>
          <h2 id={`panel-${id}`} ref={heading} tabIndex={-1} className="mt-1.5 text-2xl font-light text-cream outline-none md:text-3xl">{d.title}</h2>
        </div>
        <button type="button" onClick={home} className="mt-1 rounded-full border border-cream/15 px-3 py-1.5 font-mono text-[10px] tracking-widest text-cream/75 transition hover:border-amber-300/50 hover:text-amber-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400" aria-label="Close and return to the harbor">
          ESC
        </button>
      </header>
      <div className="panel-scroll mt-4 flex-1 overflow-y-auto px-6 pb-6 md:px-7">{children}</div>
      <footer className="flex items-center justify-between border-t border-cream/10 px-6 py-3 md:px-7">
        <button type="button" onClick={() => go(prev.id)} className="text-xs text-cream/70 transition hover:text-amber-200">← {prev.title}</button>
        <button type="button" onClick={() => go(next.id)} className="text-xs text-cream/70 transition hover:text-amber-200">{next.title} →</button>
      </footer>
    </aside>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <h3 className="mt-7 mb-3 font-mono text-[10px] tracking-[0.3em] text-amber-300/90 uppercase first:mt-0">{children}</h3>;
}

export function Chip({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-cream/12 bg-cream/5 px-2.5 py-1 text-xs text-cream/85">
      {color && <span className="h-2 w-2 rounded-sm" style={{ background: color }} aria-hidden />}
      {children}
    </span>
  );
}

export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/35 px-3.5 py-1.5 text-sm text-amber-200 transition hover:bg-amber-400/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400">
      {children} <span aria-hidden>↗</span>
    </a>
  );
}
