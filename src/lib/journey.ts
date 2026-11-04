import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { destinationById, destinations, hashFor, sectionIds } from "@/config/navigation";
import { hotspotByKey } from "@/config/hotspots";
import { projects } from "@/config/projects";
import { useNavigationStore } from "@/store/navigationStore";
import type { DestinationId } from "@/types";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

/**
 * THE JOURNEY: one source of truth for everything the scroll position drives.
 *
 * Scroll is native. A single ScrollTrigger feeds `journey` (plain mutable object, never React
 * state), and every consumer (camera, fallback, section reveals) reads from it.
 *
 * Camera ownership, composed in this order every frame (see CameraController):
 *   1. scroll   - base pose, interpolated between section framings, then damped (`poseSmooth`)
 *   2. focus    - additive layer tweened by GSAP while a project / container is selected
 *   3. intro    - zoom-out that eases to nothing after the loading screen
 *   4. pointer  - small parallax and idle drift (off for touch and reduced motion)
 * Layers add; none overwrites another, so nothing can fight for the camera.
 */
export interface Pose { x: number; y: number; z: number; yaw: number; pitch: number; zoom: number; parallax: number }

const zeroPose = (): Pose => ({ x: 0, y: 0, z: 0, yaw: 0, pitch: 0, zoom: 1, parallax: 1 });

export const journey = {
  /** Reading line in document pixels (scroll + half a viewport) */
  readY: 0,
  scrollY: 0,
  vh: 1,
  /** Document tops of the six sections */
  tops: [] as number[],
  heights: [] as number[],
  maxScroll: 1,
  /** Fractional section index for the progress rail (0..5) */
  u: 0,
  /** Target pose from scroll, and its damped version actually used by the camera */
  pose: zeroPose(),
  poseSmooth: zeroPose(),
  /** Additive layer for selections (offsets) with zoom as a multiplier */
  focus: { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, zoom: 1 },
  /** 1 → 0 after entering: extra zoom-out that eases away */
  introK: 1,
  /** 0..1 through the contact section: slow pull-back */
  pull: 0,
  pointer: { x: 0, y: 0 },
  parallaxOn: true,
  /** True while a programmatic scroll (menu / CTA / hash) is travelling */
  navigating: false,
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function targetPose(id: DestinationId): Pose {
  const c = destinationById(id).camera;
  return { x: c.offset[0], y: c.offset[1], z: c.offset[2], yaw: c.yaw, pitch: c.pitch, zoom: c.zoom, parallax: c.parallax };
}

/** Pixel angles of the painting at the home camera (fov 50, 1672x941), for aiming at image points. */
const TAN_HOME = Math.tan((50 * Math.PI) / 360);
const aX = (x: number) => (Math.atan(((x - 836) / 836) * TAN_HOME * (1672 / 941)) * 180) / Math.PI;
const aY = (y: number) => (Math.atan(((y - 470.5) / 470.5) * TAN_HOME) * 180) / Math.PI;

export function measure() {
  journey.vh = window.innerHeight;
  journey.scrollY = window.scrollY;
  journey.tops = sectionIds.map((id) => { const el = document.getElementById(id); return el ? el.getBoundingClientRect().top + window.scrollY : 0; });
  journey.heights = sectionIds.map((id) => document.getElementById(id)?.offsetHeight ?? journey.vh);
  journey.maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
}

export function update() {
  const { vh, tops } = journey;
  if (!tops.length) return;
  journey.scrollY = window.scrollY;
  const y = (journey.readY = journey.scrollY + vh * 0.5);

  // active section (reading line inside it)
  let idx = 0;
  for (let i = 0; i < tops.length; i++) if (y >= tops[i]) idx = i;
  const frac = clamp01((y - tops[idx]) / Math.max(1, journey.heights[idx]));
  journey.u = idx + frac;
  const id = sectionIds[idx];
  const store = useNavigationStore.getState();
  if (store.active !== id) {
    store.setActive(id);
    if (!journey.navigating && store.entered) syncHash(id);
  }

  // camera: travel INTO section n over `span` viewport heights, centred on its top
  let n = 0;
  for (let i = 1; i < tops.length; i++) {
    const half = (destinationById(sectionIds[i]).camera.span * vh) / 2;
    if (y >= tops[i] - half) n = i;
  }
  if (n === 0) Object.assign(journey.pose, targetPose("home"));
  else {
    const c = destinationById(sectionIds[n]).camera;
    const span = c.span * vh;
    const t = gsap.parseEase(c.ease)(clamp01((y - (tops[n] - span / 2)) / span));
    const a = targetPose(sectionIds[n - 1]), b = targetPose(sectionIds[n]);
    const p = journey.pose;
    p.x = lerp(a.x, b.x, t); p.y = lerp(a.y, b.y, t); p.z = lerp(a.z, b.z, t);
    p.yaw = lerp(a.yaw, b.yaw, t); p.pitch = lerp(a.pitch, b.pitch, t);
    p.zoom = lerp(a.zoom, b.zoom, t); p.parallax = lerp(a.parallax, b.parallax, t);
  }

  // contact: the camera slowly pulls back as the closing message settles
  const contactTop = tops[tops.length - 1] - vh * 0.2;
  journey.pull = clamp01((journey.scrollY - contactTop) / Math.max(1, journey.maxScroll - contactTop));
}

/** Frame-rate independent damping of the scroll pose: wheel steps never jerk the camera. */
export function smoothPose(dt: number, snap = false) {
  const k = snap ? 1 : 1 - Math.exp(-Math.min(dt, 0.1) * 5.5);
  const s = journey.poseSmooth, t = journey.pose;
  s.x += (t.x - s.x) * k; s.y += (t.y - s.y) * k; s.z += (t.z - s.z) * k;
  s.yaw += (t.yaw - s.yaw) * k; s.pitch += (t.pitch - s.pitch) * k;
  s.zoom += (t.zoom - s.zoom) * k; s.parallax += (t.parallax - s.parallax) * k;
}

/* ------------------------------------------------------------------ navigation */

export function parseHash(hash = typeof location !== "undefined" ? location.hash : ""): { id: DestinationId; project: string | null } {
  const [sec, proj] = hash.replace(/^#/, "").split("/");
  const id = (sectionIds as string[]).includes(sec) ? (sec as DestinationId) : "home";
  const project = id === "projects" && proj && projects.some((p) => p.id === proj) ? proj : null;
  return { id, project };
}

function syncHash(id: DestinationId, replace = true) {
  const sel = useNavigationStore.getState().selectedProject;
  const h = id === "projects" && sel ? `#projects/${sel}` : hashFor(id);
  const url = `${location.pathname}${location.search}${h}`;
  if (location.hash === h || (!h && !location.hash)) return;
  if (replace) history.replaceState(null, "", url); else history.pushState(null, "", url);
}

export function scrollToSection(id: DestinationId, opts: { push?: boolean; instant?: boolean } = {}) {
  const { push = true, instant = false } = opts;
  const el = document.getElementById(id);
  if (!el) return;
  const reduced = useNavigationStore.getState().reducedMotion;
  const top = id === "home" ? 0 : Math.round(el.getBoundingClientRect().top + window.scrollY);
  const dist = Math.abs(top - window.scrollY);
  if (push) syncHash(id, false);
  if (instant || reduced || dist < 4) {
    window.scrollTo(0, top);
    update();
    return;
  }
  journey.navigating = true;
  gsap.to(window, {
    scrollTo: { y: top, autoKill: true },
    duration: Math.min(2.4, 0.8 + (dist / journey.vh) * 0.26),
    ease: "power3.inOut",
    overwrite: true,
    onComplete: () => { journey.navigating = false; },
    onInterrupt: () => { journey.navigating = false; },
  });
}

/* --------------------------------------------------------------------- focus layer */

const FOCUS_ZERO = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, zoom: 1 };

export function focusCamera(to: Partial<typeof FOCUS_ZERO> | null, duration = 1.1) {
  const reduced = useNavigationStore.getState().reducedMotion;
  gsap.to(journey.focus, { ...FOCUS_ZERO, ...(to ?? {}), duration: reduced ? 0 : duration, ease: "power3.inOut", overwrite: true });
}

/** Nudge the camera towards a hotspot's marker, relative to the section's own framing. */
export function focusOnHotspot(key: string, strength = 0.45, zoom = 1.12) {
  const h = hotspotByKey(key);
  if (!h) return focusCamera(null);
  const f = destinationById(useNavigationStore.getState().active).camera.focus;
  focusCamera({ yaw: (aX(f[0]) - aX(h.marker[0])) * strength, pitch: (aY(f[1]) - aY(h.marker[1])) * strength, zoom });
}

/* ------------------------------------------------------------ project + skill selection */

export function chooseProject(id: string | null) {
  const s = useNavigationStore.getState();
  if (s.selectedProject === id) return;
  s.selectProject(id);
  s.setHovered(null);
  if (id) focusOnHotspot(`project:${id}`, 0.5, 1.14); else focusCamera(null);
  if (id && s.active === "projects") history.replaceState(null, "", `${location.pathname}${location.search}#projects/${id}`);
}

export function stepProject(dir: 1 | -1) {
  const s = useNavigationStore.getState();
  const i = projects.findIndex((p) => p.id === s.selectedProject);
  if (i < 0) return;
  chooseProject(projects[(i + dir + projects.length) % projects.length].id);
  history.replaceState(null, "", `${location.pathname}${location.search}#projects/${useNavigationStore.getState().selectedProject}`);
}

export function chooseSkill(id: string) {
  useNavigationStore.getState().selectSkill(id);
  useNavigationStore.getState().setHovered(null);
  focusOnHotspot(`skill:${id}`, 0.4, 1.1);
}

/**
 * Props for DOM controls that sit inside the canvas's parent (scene tags). R3F listens for pointer
 * events on that parent and raycasts them onto the painted regions, so a click on a tag would also
 * trigger whatever region lies behind it. Stopping propagation at the control keeps it to one action.
 */
export const stopSceneEvents = {
  onPointerDown: (e: { stopPropagation: () => void }) => e.stopPropagation(),
  onPointerUp: (e: { stopPropagation: () => void }) => e.stopPropagation(),
  onPointerMove: (e: { stopPropagation: () => void }) => e.stopPropagation(),
  onClick: (e: { stopPropagation: () => void }) => e.stopPropagation(),
};

/* --------------------------------------------------------------------------- setup */

/** Wires scroll, resize, history and keyboard to the journey. Returns a cleanup function. */
export function initJourney(): () => void {
  measure();
  const st = ScrollTrigger.create({ start: 0, end: "max", onUpdate: update, onRefresh: () => { measure(); update(); } });
  update();

  const onResize = () => { measure(); update(); };
  window.addEventListener("resize", onResize);

  const onPop = () => {
    const { id, project } = parseHash();
    useNavigationStore.getState().selectProject(project);
    if (project) focusOnHotspot(`project:${project}`, 0.5, 1.14); else focusCamera(null);
    scrollToSection(id, { push: false });
  };
  window.addEventListener("popstate", onPop);

  const onKey = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const s = useNavigationStore.getState();
    if (s.active === "projects" && s.selectedProject && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      e.preventDefault();
      stepProject(e.key === "ArrowRight" ? 1 : -1);
    }
  };
  window.addEventListener("keydown", onKey);

  // leaving Projects clears the project focus so the camera settles on the section framing
  const unsub = useNavigationStore.subscribe((s, prev) => {
    // Projects always shows exactly one project: the first, until the visitor picks another
    if (s.active === "projects" && prev.active !== "projects" && !s.selectedProject) {
      s.selectProject(projects[0].id);
      focusOnHotspot(`project:${projects[0].id}`, 0.5, 1.14);
      if (!journey.navigating) history.replaceState(null, "", `${location.pathname}${location.search}#projects/${projects[0].id}`);
    }
    if (s.active !== prev.active && prev.active === "projects" && s.selectedProject) {
      focusCamera(null);
    }
    if (s.active !== prev.active && s.active === "projects" && s.selectedProject) focusOnHotspot(`project:${s.selectedProject}`, 0.5, 1.14);
  });

  return () => {
    st.kill();
    window.removeEventListener("resize", onResize);
    window.removeEventListener("popstate", onPop);
    window.removeEventListener("keydown", onKey);
    unsub();
    gsap.killTweensOf(journey.focus);
    gsap.killTweensOf(window);
  };
}

export { destinations };
