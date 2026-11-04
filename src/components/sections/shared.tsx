"use client";

import type { ReactNode } from "react";

/** Heading whose lines rise out of a mask when its section reveals. */
export function MaskHeading({ lines, id, className = "h-section", as: Tag = "h2" }: { lines: string[]; id?: string; className?: string; as?: "h1" | "h2" | "h3" }) {
  return (
    <Tag id={id} data-reveal="mask" className={className}>
      {lines.map((l) => <span key={l} className="mask"><span>{l}</span></span>)}
    </Tag>
  );
}

export function Eyebrow({ num, children }: { num: string; children: ReactNode }) {
  return <p data-reveal="up" className="eyebrow">{num} — {children}</p>;
}

export function Meta({ children }: { children: ReactNode }) {
  return <p className="meta">{children}</p>;
}

/** A labelled block inside a panel: mono label over a drawn rule, then content. */
export function Block({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div data-reveal="up" className={`mt-6 ${className}`}>
      <p className="meta">{label}</p>
      <div className="rule mt-2 mb-3" />
      {children}
    </div>
  );
}

export const Arrow = () => <span className="arrow" aria-hidden>→</span>;
