"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { chooseProject, focusOnHotspot, initJourney, journey, parseHash, scrollToSection, update } from "@/lib/journey";
import { useNavigationStore } from "@/store/navigationStore";

/**
 * Central orchestrator (renders nothing). Owns: the scroll → journey link, pointer input,
 * the intro hand-over, deep links, and scroll-lock while the loading screen is up.
 */
export function JourneyController() {
  const entered = useNavigationStore((s) => s.entered);

  useEffect(() => {
    const cleanup = initJourney();
    // pointer parallax only with a fine pointer; touch gets none
    const fine = window.matchMedia("(pointer: fine)");
    journey.parallaxOn = fine.matches;
    const onFine = (e: MediaQueryListEvent) => { journey.parallaxOn = e.matches; };
    fine.addEventListener("change", onFine);
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      journey.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      journey.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    // text metrics change once fonts load: re-measure sections
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => {
      cleanup();
      fine.removeEventListener("change", onFine);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  useEffect(() => {
    if (!entered) return;
    document.documentElement.classList.remove("is-loading");
    // keyboard scrolling targets the focused element's scroller: focus the document so PageDown /
    // Space / arrows scroll the page before the first click (overlay containers can otherwise capture it)
    const root = document.documentElement;
    root.tabIndex = -1;
    root.focus({ preventScroll: true });
    ScrollTrigger.refresh();
    // deep link: land on the requested section / project without a long scroll
    const { id, project } = parseHash();
    if (id !== "home") {
      scrollToSection(id, { push: false, instant: true });
      if (project) { chooseProject(project, { push: false }); focusOnHotspot(`project:${project}`, 0.5, 1.14); }
    }
    update();
    // intro: the camera eases in from slightly further out
    const reduced = useNavigationStore.getState().reducedMotion;
    if (reduced) { journey.introK = 0; return; }
    const tw = gsap.to(journey, { introK: 0, duration: 6.5, ease: "power2.inOut", delay: 0.2, overwrite: "auto" });
    return () => { tw.kill(); };
  }, [entered]);

  return null;
}
