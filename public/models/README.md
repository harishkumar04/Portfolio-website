# public/models — drop-in GLB/GLTF assets

See `docs/ASSET_MANIFEST.md` for the candidate models, licences and the download checklist.

1. Put the file in the matching folder:

   | Slot | Path |
   |---|---|
   | cargoShipHero | `ships/cargo-ship-hero.glb` |
   | cargoShipDistant | `ships/cargo-ship-distant.glb` (optional) |
   | gantryCrane | `cranes/sts-crane.glb` |
   | container40 | `containers/container-40ft.glb` |
   | terminalTruck | `vehicles/terminal-truck.glb` |
   | forklift | `vehicles/forklift.glb` |
   | backplate | `environment/backplate-horizon.jpg` (optional) |

2. Compress it: `npm run models:optimize -- public/models/ships/cargo-ship-hero.glb`
   This writes `cargo-ship-hero.opt.glb`, using Meshopt geometry and WebP textures.
3. In `src/config/assets.ts`, set `url` to the `.opt.glb` path and fill in `source`
   (title, page, author, licence, attribution). Adjust `rotation`, `fit`, `draft` and `deckHeight` if needed.
4. Crane only: name the moving objects `Trolley` and `Spreader` (and optionally `HoistOrigin`).
   Then the loading cycle drives them directly. Without them, the procedural trolley and spreader
   are attached to your crane.

Nothing else in the scene needs to change. A model that is missing or fails to load falls back to
the procedural model, and a warning is logged to the console.

Development: `npm run models:test` generates placeholder GLBs in `__test__/` (gitignored).
Open the site with `?testAssets` to load them instead of the configured files.
