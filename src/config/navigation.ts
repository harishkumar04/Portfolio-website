import type { Destination, DestinationId } from "@/types";

/**
 * Predefined camera poses. Refined against the real scene layout in Phase 2.
 * Scene units are metres; the sun sits far along -Z.
 */
export const destinations: Destination[] = [
  // Framings are offsets from the painting's home camera; refined when navigation is built.
  { id: "home", label: "Harbor", title: "Beyond the Horizon", key: "0", camera: { offset: [0, 0, 0], yaw: 0, pitch: 0, zoom: 1 } },
  { id: "about", label: "The Harbor", title: "About", key: "1", camera: { offset: [-1.5, 0.4, -4], yaw: 6, pitch: 1, zoom: 1.25 } },
  { id: "skills", label: "Cargo Manifest", title: "Skills", key: "2", camera: { offset: [-1, -0.6, -3], yaw: 9, pitch: -3, zoom: 1.35 } },
  { id: "projects", label: "The Fleet", title: "Projects", key: "3", camera: { offset: [1.2, 0, -5], yaw: -5, pitch: 0, zoom: 1.4 } },
  { id: "experience", label: "Navigation Log", title: "Experience", key: "4", camera: { offset: [0, 0.8, -3], yaw: 3, pitch: 4, zoom: 1.3 } },
  { id: "contact", label: "The Destination", title: "Contact", key: "5", camera: { offset: [2, -0.3, -6], yaw: -12, pitch: 0.5, zoom: 1.5 } },
];

export const destinationById = (id: DestinationId): Destination =>
  destinations.find((d) => d.id === id) ?? destinations[0];
