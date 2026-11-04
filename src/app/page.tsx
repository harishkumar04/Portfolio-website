import { HarborExperience } from "@/components/experience/HarborExperience";
import { NavigationMenu } from "@/components/navigation/NavigationMenu";
import { LocationIndicator } from "@/components/navigation/LocationIndicator";
import { HoverLabel } from "@/components/ui/HoverLabel";
import { HomeHero } from "@/components/ui/HomeHero";
import { PanelHost } from "@/components/panels/PanelHost";
import { portfolio } from "@/config/portfolio";
import { projects } from "@/config/projects";

export default function Home() {
  return (
    <main className="relative h-dvh w-screen overflow-hidden">
      <HarborExperience />
      <NavigationMenu />
      <HomeHero />
      <LocationIndicator />
      <HoverLabel />
      <PanelHost />
      {/* Crawlable, screen-reader and no-JS content mirroring the interactive scene */}
      <noscript>
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-navy-950 p-8 text-cream">
          <h1 className="text-3xl">{portfolio.name}: {portfolio.tagline}</h1>
          <p className="mt-3">{portfolio.summary}</p>
          <p className="mt-3"><a href={portfolio.links.github.href}>GitHub</a> · <a href={portfolio.links.linkedin.href}>LinkedIn</a> · <a href={`mailto:${portfolio.contact.email}`}>{portfolio.contact.email}</a></p>
          <ul className="mt-5 list-disc pl-5">{projects.map((p) => <li key={p.id}><a href={p.repo}>{p.title}</a>: {p.overview}</li>)}</ul>
        </div>
      </noscript>
    </main>
  );
}
