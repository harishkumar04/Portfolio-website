import type { Destination, DestinationId } from "@/types";

/**
 * Destinations in the tower-scene painting. Camera framings are offsets from the painting's home
 * camera (metres, degrees, zoom) and are clamped at runtime so the view never leaves the painting.
 * Menu order follows the brief: About, Skills, Projects, Experience, Contact.
 */
export const destinations: Destination[] = [
  { id: "home", label: "The Harbor", title: "Home", key: "0", hint: "Back to the harbor", panelSide: "right",
    camera: { offset: [0, 0, 0], yaw: 0, pitch: 0, zoom: 1 } },
  { id: "about", label: "Control Tower", title: "About", key: "1", hint: "Who I am", panelSide: "right",
    camera: { offset: [-0.6, 0.3, -1], yaw: 14, pitch: 8, zoom: 1.6 } },
  { id: "skills", label: "Cargo Manifest", title: "Skills", key: "2", hint: "What I work with", panelSide: "right",
    camera: { offset: [-0.4, -0.3, -1], yaw: 14, pitch: -9, zoom: 1.55 } },
  { id: "projects", label: "The Fleet", title: "Projects", key: "3", hint: "What I have built", panelSide: "left",
    camera: { offset: [0.4, 0, -1.2], yaw: -2, pitch: -3, zoom: 1.4 } },
  { id: "experience", label: "Navigation Log", title: "Experience", key: "4", hint: "Where I have been", panelSide: "right",
    camera: { offset: [-0.5, -0.4, -0.8], yaw: 13, pitch: -2, zoom: 1.25 } },
  { id: "contact", label: "Beyond the Horizon", title: "Contact", key: "5", hint: "Get in touch", panelSide: "left",
    camera: { offset: [0.6, 0, -1.2], yaw: -16, pitch: -1, zoom: 1.5 } },
];

export const sections = destinations.filter((d) => d.id !== "home");

export const destinationById = (id: DestinationId): Destination =>
  destinations.find((d) => d.id === id) ?? destinations[0];
