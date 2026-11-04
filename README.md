# Beyond the Horizon: R Harish Kumar's portfolio

An interactive harbor portfolio. A painted sunset container terminal is rebuilt as a layered 2.5D
scene in React Three Fiber: the crane loads a ship continuously, the sea ripples, clouds drift,
and the camera moves between five destinations.

| Place in the harbor | Section |
|---|---|
| Control tower (top) | About |
| Foreground containers | Skills |
| Cargo ship | Projects |
| Control tower (shaft) | Experience |
| Open sea and sun | Contact |

Navigate with the scene (hover/click/tap), the top menu, or the keyboard: `1`–`5`, `0`, `←`/`→`, `Esc`.

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
| `src/config/navigation.ts` | Destination names, shortcuts, camera framings |
| `src/config/hotspots.ts` | Clickable regions and beacon positions (painting pixels) |

## The artwork

`art/harbor/plate.png` is cut into depth layers by `scripts/art/build_layers.py`, driven by
`art/harbor/layers.json` (polygons in painting pixels):

```bash
pip install numpy pillow opencv-python-headless
npm run art:build -- art/harbor/layers.json     # writes public/art/harbor/
```

Replace the plate and adjust the polygons to use new artwork. See `ATTRIBUTIONS.md`.

## Accessibility and fallbacks

- `prefers-reduced-motion`: parallax, drift and the intro zoom are removed; the world slows to a near standstill.
- No WebGL: the painting is shown with the same beacons and panels.
- All content is real HTML (keyboard-focusable, labelled), plus a `<noscript>` summary.
