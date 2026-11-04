export type DestinationId = "home" | "about" | "skills" | "projects" | "experience" | "contact";

export interface Destination {
  id: DestinationId;
  label: string;
  /** Nautical-style section name shown in the UI */
  title: string;
  key: string;
  /** Camera framing relative to the painting's home view (metres / degrees / zoom factor) */
  camera: { offset: [number, number, number]; yaw: number; pitch: number; zoom: number };
}

export interface SocialLink {
  label: string;
  href: string;
}

export interface Portfolio {
  name: string;
  firstName: string;
  tagline: string;
  intro: string[];
  interests: string[];
  summary: string;
  closingLine: string;
  contact: { email: string; location: string };
  links: { github: SocialLink; linkedin: SocialLink };
  education: TimelineEntry[];
  experience: TimelineEntry[];
  certifications: TimelineEntry[];
  milestones: TimelineEntry[];
}

export interface TimelineEntry {
  id: string;
  kind: "education" | "internship" | "experience" | "certification" | "milestone";
  title: string;
  organization?: string;
  period?: string;
  location?: string;
  details?: string[];
}

export interface SkillItem {
  name: string;
  description: string;
}

export interface SkillCategory {
  id: string;
  label: string;
  blurb: string;
  /** Container colour in the 3D scene */
  color: string;
  items: SkillItem[];
  relatedProjects: string[];
}

export interface Project {
  id: string;
  title: string;
  category: string;
  overview: string;
  problem: string;
  architecture: string;
  stack: string[];
  decisions: string[];
  repo: string;
}
