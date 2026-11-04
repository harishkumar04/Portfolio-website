"use client";

import { useLayoutEffect, type RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useNavigationStore } from "@/store/navigationStore";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

/**
 * Builds ONE paused timeline for a section from its `data-reveal` elements, in DOM order, and
 * plays it once when the section nears the reading line.
 *   data-reveal="mask"  heading lines (.mask > span) rise out of a mask
 *   data-reveal="up"    fade + small rise
 *   data-reveal="fade"  fade
 *   data-reveal="line"  rule draws from the left
 *   data-reveal="group" children with `data-item` stagger in
 * `start` defaults to when the section top reaches 65% of the viewport. For the hero pass `manual`
 * and call the returned timeline from the intro sequence.
 */
export function buildReveals(root: HTMLElement, reduced: boolean) {
  const tl = gsap.timeline({ paused: true });
  const els = gsap.utils.toArray<HTMLElement>("[data-reveal]", root);
  let cursor = 0;
  els.forEach((el) => {
    const type = el.dataset.reveal;
    const at = Math.max(0, cursor);
    if (reduced) { tl.to(el, { opacity: 1, duration: 0.25 }, at); cursor = at + 0.04; return; }
    if (type === "mask") {
      const inner = el.querySelectorAll(".mask > span");
      gsap.set(el, { opacity: 1 });
      tl.fromTo(inner, { yPercent: 112 }, { yPercent: 0, duration: 1.05, ease: "power4.out", stagger: 0.09 }, at);
      cursor = at + 0.22;
    } else if (type === "group") {
      gsap.set(el, { opacity: 1 });
      tl.fromTo(el.querySelectorAll("[data-item]"), { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.075 }, at);
      cursor = at + 0.2;
    } else if (type === "line") {
      tl.fromTo(el, { scaleX: 0, opacity: 1, transformOrigin: "0 50%" }, { scaleX: 1, duration: 1.1, ease: "power3.inOut" }, at);
      cursor = at + 0.1;
    } else if (type === "fade") {
      tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 1, ease: "power2.out" }, at);
      cursor = at + 0.1;
    } else {
      tl.fromTo(el, { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" }, at);
      cursor = at + 0.12;
    }
  });
  return tl;
}

export function useSectionReveal(ref: RefObject<HTMLElement | null>, opts: { manual?: boolean; start?: string } = {}) {
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const reduced = useNavigationStore.getState().reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      const tl = buildReveals(root, reduced);
      if (opts.manual) { (root as HTMLElement & { __reveal?: gsap.core.Timeline }).__reveal = tl; return; }
      const play = () => { if (tl.progress() === 0) tl.play(); };
      ScrollTrigger.create({ trigger: root, start: opts.start ?? "top 65%", end: "bottom top", onEnter: play, onEnterBack: play, onToggle: (s) => { if (s.isActive) play(); } });
      // already past it (deep link / reload mid-page)
      if (root.getBoundingClientRect().top < window.innerHeight * 0.65) play();
      // fail-safe: content must never stay hidden. If the section is on screen and nothing has
      // played shortly after, finish the timeline instantly.
      const guard = window.setInterval(() => {
        const r = root.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.8 && r.bottom > 0 && tl.progress() === 0 && !tl.isActive()) { tl.progress(1); }
        if (tl.progress() > 0) window.clearInterval(guard);
      }, 1500);
      return () => window.clearInterval(guard);
    }, root);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
