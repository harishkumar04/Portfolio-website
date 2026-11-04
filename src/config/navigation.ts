import type { Destination, DestinationId } from "@/types";

/**
 * Predefined camera poses. Refined against the real scene layout in Phase 2.
 * Scene units are metres; the sun sits far along -Z.
 */
export const destinations: Destination[] = [
  { id: "home", label: "Harbor", title: "Beyond the Horizon", key: "0", camera: { position: [30, 9.5, 17], target: [-115, 20, -19] } },
  { id: "about", label: "The Harbor", title: "About", key: "1", camera: { position: [-135, 24, 112], target: [-190, 22, 46] } },
  { id: "skills", label: "Cargo Manifest", title: "Skills", key: "2", camera: { position: [-2, 7.5, 5], target: [-2, 6, 27] } },
  { id: "projects", label: "The Fleet", title: "Projects", key: "3", camera: { position: [-70, 22, -88], target: [-135, 20, -10] } },
  { id: "experience", label: "Navigation Log", title: "Experience", key: "4", camera: { position: [-188, 21, -2], target: [-212, 33, 46] } },
  { id: "contact", label: "The Destination", title: "Contact", key: "5", camera: { position: [-5, 10, -60], target: [-320, 14, -306] } },
];

export const destinationById = (id: DestinationId): Destination =>
  destinations.find((d) => d.id === id) ?? destinations[0];
