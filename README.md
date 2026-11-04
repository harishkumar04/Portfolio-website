# Beyond the Horizon: R Harish Kumar's portfolio

An interactive harbor portfolio. A painted sunset container terminal is rebuilt as a layered 2.5D
scene in React Three Fiber: the crane loads a ship continuously, the sea ripples, clouds drift,
and the camera moves between five destinations.

The page scrolls natively. One ScrollTrigger feeds a single journey state (`src/lib/journey.ts`), and the
harbor camera, nav, progress rail and reveals all read from it.

| Section | Where in the harbor | What happens |
|---|---|---|
| 01 Arrival | Whole harbor | Title sequence over the working crane |
| 02 About | Control tower | Camera approaches the tower |
| 03 Skills | Foreground containers | Six containers, each opens a manifest of tools |
| 04 Projects | Cargo ship | Six container columns on the ship = six projects, plus the crane's load |
| 05 Experience | Wider quay view | Route line draws with the scroll, one milestone at a time |
| 06 Contact | Open sea and sun | Slow pull-back, contact links, resume download |

Links: `#about`, `#skills`, `#projects`, `#projects/<project-id>`, `#experience`, `#contact`.
Keyboard: `Tab`/`Enter`, `Esc` closes a project, `←`/`→` step through projects, arrows move between skill containers.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

Deploys as-is to Vercel (or any Node host); there are no environment variables.

## Edit the content

| File | What it controls |
|---|---|
| `src/config/portfolio.ts` | Name, intro, summary, contact, links, education, experience, certifications, milestones |
| `src/config/projects.ts` | Projects and their GitHub links |
| `src/config/skills.ts` | Skill containers and items |
| `src/config/navigation.ts` | Section names and the camera framing + scroll span of each section |
| `src/config/hotspots.ts` | Clickable regions and tag positions (painting pixels) |
| `public/resume/` | The downloadable resume (`portfolio.resume` points at it) |
| `src/app/globals.css` | Design tokens (colours, fonts) and shared UI classes |

## The artwork

`art/harbor/plate.png` is cut into depth layers by `scripts/art/build_layers.py`, driven by
`art/harbor/layers.json` (polygons in painting pixels):

```bash
pip install numpy pillow opencv-python-headless
npm run art:build -- art/harbor/layers.json     # writes public/art/harbor/
```

Replace the plate and adjust the polygons to use new artwork. See `ATTRIBUTIONS.md`.

Projects accept optional `demo` and `image` fields (`src/config/projects.ts`); they appear when set.

## Accessibility and fallbacks

- `prefers-reduced-motion`: parallax, drift and the intro zoom are removed; the world slows to a near standstill.
- No WebGL: the painting is shown with the same beacons and panels.
- All content is real HTML (keyboard-focusable, labelled), plus a `<noscript>` summary.
