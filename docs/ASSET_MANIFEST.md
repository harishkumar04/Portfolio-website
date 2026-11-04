# Beyond the Horizon — 3D Asset Manifest

Status: **proposal, awaiting manual download.**
The development sandbox cannot reach Sketchfab, Poly Haven, Poly Pizza, Hugging Face,
Kenney, Quaternius or jsDelivr, so none of the candidate pages below could be opened
from here. Candidates were found by web search only.

> **Verification rule.** Every "License" value below comes from search-result text, not from
> the model page itself. Before downloading, open the page and confirm (1) the licence line,
> (2) that the *Download* button is offered, and (3) the attribution text Sketchfab's download
> dialog gives you. Fill in the "Confirmed" column of the checklist at the bottom.
> Nothing here is claimed as downloadable until you confirm it.

Preview images are shown on each model page; they could not be fetched, so none are embedded here.

---

## 1. Minimum asset set (what actually moves the visual quality)

| # | Slot (`config/assets.ts` id) | File to place under `public/models/` | Why it matters | Priority |
|---|---|---|---|---|
| 1 | `cargoShipHero` | `ships/cargo-ship-hero.glb` | Focal point of the whole composition | **Required** |
| 2 | `gantryCrane` | `cranes/sts-crane.glb` | Second hero object; drives the loading animation | **Required** |
| 3 | `container40` | `containers/container-40ft.glb` | Repeated ~2,500× (instanced) — biggest share of the frame | **Required** |
| 4 | `terminalTruck` | `vehicles/terminal-truck.glb` | Foreground of the home shot; carries the crane's container | Recommended |
| 5 | `forklift` | `vehicles/forklift.glb` | Apron detail (foreground / middle ground) | Recommended |
| 6 | `cargoShipDistant` | `ships/cargo-ship-distant.glb` | Ships on the horizon; can be a decimated copy of #1 | Optional (auto-derived from #1 if absent) |
| 7 | `envHdri` | already available — see §3 | Image-based lighting / reflections | Done |
| 8 | `backplate` | `environment/backplate-horizon.jpg` | Distant horizon artwork (your harbor reference images) | Recommended |

With **#1, #2 and #3** in place the hero shot changes from procedural to asset-based.
Everything else keeps working procedurally until its file appears (see `AssetSlot`).

---

## 2. Candidate sources

### 2.1 Container cargo ship (slot 1 / 6)

| Asset | Download page | Format (expected) | License (per search, **unverified**) | Attribution | Downloadable | Animation suitability |
|---|---|---|---|---|---|---|
| "cargo ship" (Sketchfab) | https://sketchfab.com/3d-models/cargo-ship-d115cec9378d495ca72005e4e3aae8d5 | Sketchfab offers glTF/GLB for downloadable models | CC Attribution (CC BY 4.0) | Required: author name + link + licence | Unverified | Static hull is fine — the ship only rocks and the scene adds containers, lights and the loading well procedurally. Check that container stacks are a separate mesh or absent. |
| SEA-AI "seashapes" dataset (Hugging Face) | https://huggingface.co/datasets/SEA-AI/seashapes | Dataset of vessel meshes with real dimensions | Licence field in dataset metadata — **not confirmed** | Dataset asks for credit + link | Unverified | Realistic proportions; likely lower visual detail — good candidate for the **distant** ships. |
| Paid fallback: CGTrader / TurboSquid container ships | e.g. https://cgtrader.com/3d-model/container-ship-12e2b88e-d266-475e-98ce-01b19b46f996 | Varies (check for GLB/FBX) | Royalty-free commercial licence (paid) | Per marketplace terms | Paid | Usually the highest detail; pick one that ships hull, superstructure and containers as **separate objects**. |

### 2.2 Ship-to-shore gantry crane (slot 2)

No free, CC-licensed STS crane was confirmed by search. Options:

| Asset | Download page | Format | License (per search, **unverified**) | Attribution | Downloadable | Animation suitability |
|---|---|---|---|---|---|---|
| "Red Ship-To-Shore Gantry Crane" (Blender/Superhive Market) | https://blendermarket.com/products/red-ship-to-shore-gantry-crane | .blend (export to GLB) | Listing says "Creative Commons" — variant not stated | Depends on variant | Paid listing — unverified | Good if the trolley and spreader are separate objects (re-export them as named nodes, §4). |
| "Port Gantry Container Cranes Pack" (RenderHub) | https://www.renderhub.com/aurascape-3d/port-gantry-container-cranes-pack | Check listing | Paid, RenderHub licence | Per marketplace terms | Paid | Pack — check whether trolley/spreader are split. |
| "Gantry Shore Crane – Harbor crane" (CGTrader) | https://www.cgtrader.com/3d-models/industrial/industrial-machine/gantry-shore-crane-harbor-crane | Check listing | Royalty-free (paid) | Per marketplace terms | Paid | As above. |
| "crane machine" (Sketchfab) | https://sketchfab.com/3d-models/crane-machine-ea2f7f1ed1f8470cbe01699e6714a55e | glTF/GLB if downloadable | CC Attribution | Required | Unverified — **type of crane unknown** (filed under vehicles; may not be an STS crane) | Check visually first. |

**Recommendation:** if a suitable free crane is not found, keep the current procedural crane structure
(it already has the right proportions and animation rig) and supply only a **crane detail kit**:
CC0 PBR materials for weathered painted steel and a GLB spreader — or buy one paid STS crane.

### 2.3 Shipping containers (slot 3)

| Asset | Download page | Format | License (per search, **unverified**) | Attribution | Downloadable | Animation suitability |
|---|---|---|---|---|---|---|
| "shipping container" (Sketchfab, Blender + Substance Painter) | https://sketchfab.com/3d-models/shipping-container-7bf5a49425134544b9b6708c4e45ce11 | glTF/GLB | CC Attribution | Required | Unverified | Static; ideal for instancing if it is **one mesh + one material** (or few). |
| "ship container" (Sketchfab) | https://sketchfab.com/3d-models/ship-container-4f163301a8ad4a5b9cec021e2450ec47 | glTF/GLB | CC Attribution (per search) | Required | Unverified | As above. |
| "20ft container" (Sketchfab) | https://sketchfab.com/3d-models/20ft-container-b4099d4ab2ed4c6fa84dfcbdddf6d8b9 | glTF/GLB | Not shown in search | — | Unverified | For the 20 ft variant. |
| "argo container" (Sketchfab) | https://sketchfab.com/3d-models/argo-container-6d7ab1cbe7094ffd8ca58278112533ef | glTF/GLB | CC Attribution | Required | Unverified | Alternative. |

Colour variety: the loader tints instances per container, so a neutral/white or single-colour model works best.

### 2.4 Terminal trucks and forklifts (slots 4–5)

| Asset | Download page | Format | License (per search, **unverified**) | Attribution | Downloadable | Animation suitability |
|---|---|---|---|---|---|---|
| "forklift" (Sketchfab) | https://sketchfab.com/3d-models/forklift-d40cae50e04145dd997cdca415cd72ad | glTF/GLB | Not shown in search | — | Unverified | Static prop. |
| "forklift" (Sketchfab, photogrammetry scan) | https://sketchfab.com/3d-models/forklift-e79f0768aec6431d8e6f3874e5acc5f2 | glTF/GLB | Licence cut off in search | — | Unverified | Scan = static, possibly heavy; decimate. |
| "Yard Truck T2 4X2" (Blender/Superhive Market) | https://blendermarket.com/products/yard-truck-t2-4x2 | .blend | Not shown in search | — | Paid listing | Truck moves as a whole; wheels optional. |
| "Industrial Terminal Tractor Yard Truck PBR" (RenderHub) | https://www.renderhub.com/q-lee/industrial-terminal-tractor-yard-truck-pbr | Check listing | Extended Use Licence (IP restricted), paid | Per marketplace terms | Paid | As above. |
| "truck" (Sketchfab, generic) | https://sketchfab.com/3d-models/truck-eda924f23ba04cd5b1e5160abf2320fa | glTF/GLB | CC Attribution | Required | Unverified | Generic truck, not a terminal tractor. |

### 2.5 Harbor equipment (bollards, barriers, fences, lamps)

No suitable CC0 realistic set was confirmed. These stay **procedural** (already modelled, cheap,
instanced). Poly Haven is CC0 site-wide and is the first place to look for props and
PBR materials when its domain is reachable: https://polyhaven.com/models and https://polyhaven.com/textures.

---

## 3. Already integrated (verified)

| Asset | Source | License | Notes |
|---|---|---|---|
| Sunset HDRI `venice_sunset_1k.hdr` (Poly Haven, via the pmndrs drei-assets mirror) | https://raw.githubusercontent.com/pmndrs/drei-assets/master/hdri/venice_sunset_1k.hdr | CC0 (Poly Haven) | Reachable from the sandbox (HTTP 200, 1.4 MB). Available for IBL. |
| Procedural textures (container atlas, steel, hazard stripes, wet concrete) | Generated in `src/lib/textures.ts` | Original work | No attribution needed. |

---

## 4. File specifications for manual downloads

Export everything as **binary glTF (`.glb`)**. Then run `npm run models:optimize -- <file>`,
which applies Meshopt geometry compression and WebP textures with gltf-transform.

| Rule | Value |
|---|---|
| Units | metres (the loader rescales to the target size anyway) |
| Up axis | +Y (Blender's glTF exporter does this by default) |
| Forward | ships: bow towards **+X**; trucks: cab towards **−X**; cranes: boom reaching towards **−Z** (sea side). If yours differ, set `rotation` in `config/assets.ts`. |
| Textures | ≤ 2048 px for hero assets, ≤ 1024 px for containers and vehicles |
| Triangle budget | hero ship ≤ 300 k, crane ≤ 150 k, container ≤ 3 k (instanced), vehicles ≤ 40 k |

**Named nodes for animation** (only for the crane; rename the objects in Blender before export):

| Node name | What it is | Driven by |
|---|---|---|
| `Trolley` | Carriage that runs along the boom | Moves along local Z |
| `Spreader` | Headblock + spreader frame | Moves along local Y and Z (follows the trolley) |
| `HoistOrigin` (optional) | Empty at the sheave under the trolley | Origin of the animated hoist ropes |

If a crane GLB has no separate `Trolley`/`Spreader`, the loader keeps the GLB as the static
structure and attaches the existing procedural trolley, ropes and spreader to it. The animation
still works.

---

## 5. Where to put the files

```
public/models/
├── ships/cargo-ship-hero.glb
├── ships/cargo-ship-distant.glb        (optional)
├── cranes/sts-crane.glb
├── containers/container-40ft.glb
├── vehicles/terminal-truck.glb
├── vehicles/forklift.glb
└── environment/backplate-horizon.jpg   (optional, your harbor artwork, ≥ 4096 px wide)
```

Then set the matching URL in `src/config/assets.ts`, with its licence and attribution.
The credits panel and `ATTRIBUTIONS.md` read from that file.

---

## 6. Download checklist (fill in as you go)

| Slot | Chosen asset + URL | Licence confirmed on page | Download offered | Attribution string | File placed |
|---|---|---|---|---|---|
| cargoShipHero | | ☐ | ☐ | | ☐ |
| gantryCrane | | ☐ | ☐ | | ☐ |
| container40 | | ☐ | ☐ | | ☐ |
| terminalTruck | | ☐ | ☐ | | ☐ |
| forklift | | ☐ | ☐ | | ☐ |
| cargoShipDistant | | ☐ | ☐ | | ☐ |
| backplate | your own artwork | n/a | n/a | n/a | ☐ |

### Optional: let the sandbox fetch assets itself

Allow these domains in the cloud environment's **Network access** settings.
For Sketchfab you would also need to add a Sketchfab API token as an environment secret,
because Sketchfab downloads require a signed-in account.

- `sketchfab.com`, `api.sketchfab.com`, `media.sketchfab.com`
- `polyhaven.com`, `api.polyhaven.com`, `dl.polyhaven.org`
- `huggingface.co`
