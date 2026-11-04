"use client";

import type { ReactNode } from "react";
import { iconPaths } from "@/config/icons";

/** Heading whose lines rise out of a mask when its section reveals. */
export function MaskHeading({ lines, id, className = "h-panel", as: Tag = "h2" }: { lines: string[]; id?: string; className?: string; as?: "h1" | "h2" | "h3" }) {
  return (
    <Tag id={id} data-reveal="mask" className={className}>
      {lines.map((l) => <span key={l} className="mask"><span>{l}</span></span>)}
    </Tag>
  );
}

/** A small labelled row: mono label, then its content. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div data-reveal="up" className="mt-5">
      <p className="label label-amber">{label}</p>
      <div className="mt-1.5 text-warm-ivory">{children}</div>
    </div>
  );
}

/** Two-letter monogram: initials of the first two words (or camel-case parts), else the first two characters. */
function monogram(name: string) {
  const clean = name.replace(/^(Amazon|AWS)\s+/i, "");
  const parts = clean.replace(/([a-z])([A-Z])/g, "$1 $2").split(/[\s/]+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : clean.slice(0, 2)).toUpperCase();
}

/** Brand icon (Simple Icons, CC0) when one exists; otherwise a distinct monogram. */
export function SkillIcon({ name }: { name: string }) {
  const path = iconPaths[name];
  if (path) return <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0 fill-warm-ivory/90" aria-hidden><path d={path} /></svg>;
  return <span className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[3px] border border-warm-ivory/40 font-mono text-[0.55rem] leading-none text-warm-ivory/90" aria-hidden>{monogram(name)}</span>;
}

export const Arrow = () => <span className="arrow" aria-hidden>→</span>;
