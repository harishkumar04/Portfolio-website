import { HarborExperience } from "@/components/experience/HarborExperience";
import { JourneyController } from "@/components/journey/JourneyController";
import { Navigation } from "@/components/navigation/Navigation";
import { HoverLabel } from "@/components/ui/HoverLabel";
import { HeroSection } from "@/components/sections/HeroSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { SkillsSection } from "@/components/sections/SkillsSection";
import { ProjectsSection } from "@/components/sections/ProjectsSection";
import { ExperienceSection } from "@/components/sections/ExperienceSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { portfolio } from "@/config/portfolio";
import { projects } from "@/config/projects";

export default function Home() {
  return (
    <>
      {/* The harbor: fixed behind everything; the page scroll drives its camera. */}
      <HarborExperience />
      <JourneyController />
      <Navigation />
      <HoverLabel />
      {/* Sections scroll over the harbor. They ignore the pointer; only their panels and buttons take it. */}
      <main id="main" className="pointer-events-none relative z-10">
        <HeroSection />
        <AboutSection />
        <SkillsSection />
        <ProjectsSection />
        <ExperienceSection />
        <ContactSection />
      </main>
      <LoadingScreen />
      <noscript>
        <div className="fixed inset-0 z-[90] overflow-y-auto bg-midnight p-8 text-warm-ivory">
          <h1 className="text-3xl">{portfolio.name}: Cloud &amp; DevOps</h1>
          <p className="mt-3">{portfolio.summary}</p>
          <p className="mt-3"><a href={portfolio.links.github.href}>GitHub</a> · <a href={portfolio.links.linkedin.href}>LinkedIn</a> · <a href={`mailto:${portfolio.contact.email}`}>{portfolio.contact.email}</a> · <a href={portfolio.resume.href}>Resume</a></p>
          <ul className="mt-5 list-disc pl-5">{projects.map((p) => <li key={p.id}>{p.title}: {p.summary}{p.repo && <> <a href={p.repo}>Repository</a></>}</li>)}</ul>
        </div>
      </noscript>
    </>
  );
}
