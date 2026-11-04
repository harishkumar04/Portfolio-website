import type { Destination, DestinationId } from "@/types";

/**
 * Predefined camera poses. Refined against the real scene layout in Phase 2.
 * Scene units are metres; the sun sits far along -Z.
 */
export const destinations: Destination[] = [
  { id: "home", label: "Harbor", title: "Beyond the Horizon", key: "0", camera: { position: [26, 11, 38], target: [0, 5, -6] } },
  { id: "about", label: "The Harbor", title: "About", key: "1", camera: { position: [-6, 14, 12], target: [-16, 12, -4] } },
  { id: "skills", label: "Cargo Manifest", title: "Skills", key: "2", camera: { position: [-2, 7, 20], target: [-6, 3, 6] } },
  { id: "projects", label: "The Fleet", title: "Projects", key: "3", camera: { position: [30, 8, 14], target: [14, 5, -4] } },
  { id: "experience", label: "Navigation Log", title: "Experience", key: "4", camera: { position: [-26, 17, 20], target: [-18, 14, -2] } },
  { id: "contact", label: "The Destination", title: "Contact", key: "5", camera: { position: [20, 5, -20], target: [0, 4, -120] } },
];

export const destinationById = (id: DestinationId): Destination =>
  destinations.find((d) => d.id === id) ?? destinations[0];
