import type { Destination, DestinationId } from "@/types";

/**
 * The six places of the journey, in scroll order. `camera` is the framing the harbor camera settles
 * on while that section is in view, expressed relative to the painting's home camera. Yaw and
 * pitch are clamped at runtime so the view can never leave the painting.
 */
export const destinations: Destination[] = [
  { id: "home", num: "01", label: "Arrival", title: "Arrival", key: "0", hint: "Back to the harbor",
    camera: { offset: [0, 0, 0], yaw: 0, pitch: 0, zoom: 1, span: 0.5, ease: "power2.inOut", parallax: 1, focus: [836, 470] } },
  { id: "about", num: "02", label: "Control Tower", title: "About", key: "1", hint: "Who I am",
    camera: { offset: [-0.6, 0.3, -1], yaw: 14, pitch: 8, zoom: 1.6, span: 0.55, ease: "power3.inOut", parallax: 0.7, focus: [236, 250] } },
  { id: "skills", num: "03", label: "Container Terminal", title: "Skills", key: "2", hint: "What I work with",
    camera: { offset: [-0.4, -0.3, -1], yaw: 14, pitch: -9, zoom: 1.55, span: 0.55, ease: "power3.inOut", parallax: 0.8, focus: [180, 660] } },
  { id: "projects", num: "04", label: "The Cargo Ship", title: "Projects", key: "3", hint: "What I have built",
    camera: { offset: [0.4, 0, -1.2], yaw: -2, pitch: -3, zoom: 1.4, span: 0.6, ease: "power3.inOut", parallax: 0.8, focus: [960, 520] } },
  { id: "experience", num: "05", label: "Navigation Route", title: "Experience", key: "4", hint: "Where I have been",
    camera: { offset: [0, 0.2, -0.4], yaw: 7, pitch: 1, zoom: 1.12, span: 0.55, ease: "power2.inOut", parallax: 0.6, focus: [560, 420] } },
  { id: "contact", num: "06", label: "Beyond the Horizon", title: "Contact", key: "5", hint: "Get in touch",
    camera: { offset: [0.6, 0, -1.2], yaw: -16, pitch: -1, zoom: 1.5, span: 0.65, ease: "power3.inOut", parallax: 0.5, focus: [1400, 560] } },
];

export const sections = destinations.filter((d) => d.id !== "home");
export const sectionIds = destinations.map((d) => d.id);

export const destinationById = (id: DestinationId): Destination =>
  destinations.find((d) => d.id === id) ?? destinations[0];

/** URL hash for a section ("" for the arrival view). */
export const hashFor = (id: DestinationId) => (id === "home" ? "" : `#${id}`);
