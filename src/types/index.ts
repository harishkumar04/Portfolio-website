export type DestinationId = "home" | "about" | "skills" | "projects" | "experience" | "contact";

export interface CameraTarget {
  /** Offset from the painting's home camera (metres) */
  offset: [number, number, number];
  yaw: number;
  pitch: number;
  /** Zoom factor (>= 1: never shows beyond the painting) */
  zoom: number;
  /** Scroll distance (in viewport heights) over which the camera travels INTO this target */
  span: number;
  /** GSAP ease name shaping that travel */
  ease: string;
  /** Pointer-parallax strength, 0 to 1 */
  parallax: number;
  /** Fallback (no WebGL) focus point in painting pixels */
  focus: [number, number];
}

export interface Destination {
  id: DestinationId;
  /** Section number shown in the UI, "01" to "06" */
  num: string;
  /** Harbor-themed name of the place (e.g. "Control Tower") */
  label: string;
  /** Short name for menus and the progress rail */
  title: string;
  /** Keyboard shortcut */
  key: string;
  /** Short line for hover labels */
  hint: string;
  camera: CameraTarget;
}

export interface SocialLink {
  label: string;
  href: string;
}

export interface Portfolio {
  /** Public path of the downloadable resume */
  resume: { href: string; filename: string };
  name: string;
  firstName: string;
  tagline: string;
  disciplines: string[];
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
  /** Tools named for this entry in the resume */
  tools?: string[];
}

export interface SkillItem {
  name: string;
  description: string;
}

export interface SkillCategory {
  id: string;
  /** Manifest identifier, e.g. "CNT-01" */
  code: string;
  label: string;
  blurb: string;
  items: SkillItem[];
  relatedProjects: string[];
}

export interface ArchitectureLayer {
  label: string;
  items: string[];
}

/** One project = one "cargo shipment". Everything except id/title/category/summary is optional. */
export interface Project {
  /** URL-safe id used in deep links (#projects/<id>) */
  id: string;
  /** Manifest identifier shown in the UI, e.g. "PRJ-01" */
  code: string;
  title: string;
  category: string;
  /** One or two sentences */
  summary: string;
  problem?: string;
  solution?: string;
  architecture?: string;
  /** Components grouped by role, rendered as an architecture diagram */
  layers?: ArchitectureLayer[];
  stack: string[];
  contribution?: string;
  decisions?: string[];
  repo?: string;
  demo?: string;
  /** Public path to a screenshot or architecture image, if one exists */
  image?: string;
}
