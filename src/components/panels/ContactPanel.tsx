"use client";

import { useState } from "react";
import { portfolio } from "@/config/portfolio";
import { ExternalLink, Panel, SectionLabel } from "./Panel";

export function ContactPanel() {
  const [copied, setCopied] = useState(false);
  const email = portfolio.contact.email;
  const copy = async () => {
    try { await navigator.clipboard.writeText(email); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* clipboard unavailable */ }
  };
  return (
    <Panel id="contact">
      <p className="text-xl leading-snug font-light text-cream">{portfolio.closingLine}</p>
      <SectionLabel>Email</SectionLabel>
      <div className="flex flex-wrap items-center gap-2">
        <a href={`mailto:${email}`} className="rounded-full bg-amber-400/90 px-4 py-2 text-sm font-medium text-navy-950 transition hover:bg-amber-300">{email}</a>
        <button type="button" onClick={copy} className="rounded-full border border-cream/15 px-3.5 py-2 text-xs text-cream/75 transition hover:text-amber-200" aria-live="polite">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <SectionLabel>Elsewhere</SectionLabel>
      <div className="flex flex-wrap gap-2">
        <ExternalLink href={portfolio.links.github.href}>{portfolio.links.github.label}</ExternalLink>
        <ExternalLink href={portfolio.links.linkedin.href}>{portfolio.links.linkedin.label}</ExternalLink>
      </div>
      <SectionLabel>Location</SectionLabel>
      <p className="text-cream/80">{portfolio.contact.location}</p>
    </Panel>
  );
}
