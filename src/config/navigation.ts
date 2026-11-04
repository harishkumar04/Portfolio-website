import type { Destination, DestinationId } from "@/types";

/**
 * Predefined camera poses. Refined against the real scene layout in Phase 2.
 * Scene units are metres; the sun sits far along -Z.
 */
export const destinations: Destination[] = [
  // Framings of the tower-scene painting, as offsets from its home camera (metres, degrees, zoom).
  // Yaw/pitch are clamped at runtime so the view never leaves the painting.
  { id: "home", label: "Harbor", title: "Beyond the Horizon", key: "0", camera: { offset: [0, 0, 0], yaw: 0, pitch: 0, zoom: 1 } },
  // control tower watch room
  { id: "about", label: "The Harbor", title: "About", key: "1", camera: { offset: [-0.6, 0.3, -1], yaw: 14, pitch: 8, zoom: 1.6 } },
  // foreground container stacks
  { id: "skills", label: "Cargo Manifest", title: "Skills", key: "2", camera: { offset: [-0.4, -0.3, -1], yaw: 14, pitch: -9, zoom: 1.55 } },
  // the main cargo ship
  { id: "projects", label: "The Fleet", title: "Projects", key: "3", camera: { offset: [0.4, 0, -1.2], yaw: -5, pitch: -4, zoom: 1.45 } },
  // control tower, lower and wider than About
  { id: "experience", label: "Navigation Log", title: "Experience", key: "4", camera: { offset: [-0.5, -0.2, -0.8], yaw: 12, pitch: 2, zoom: 1.35 } },
  // open ocean and the sun
  { id: "contact", label: "The Destination", title: "Contact", key: "5", camera: { offset: [0.6, 0, -1.2], yaw: -16, pitch: -1, zoom: 1.6 } },
];

export const destinationById = (id: DestinationId): Destination =>
  destinations.find((d) => d.id === id) ?? destinations[0];
