// Usage: npm run models:optimize -- public/models/ships/cargo-ship-hero.glb [--max 2048]
// Writes <name>.opt.glb next to the input: deduplicated, welded, Meshopt-compressed geometry and
// WebP textures resized to --max px. Point config/assets.ts at the .opt.glb file.
import { execFileSync } from "node:child_process";
const [input, ...rest] = process.argv.slice(2);
if (!input) { console.error("usage: npm run models:optimize -- <file.glb> [--max 2048]"); process.exit(1); }
const mi = rest.indexOf("--max");
const max = mi >= 0 ? rest[mi + 1] : "2048";
const output = input.replace(/\.glb$/i, ".opt.glb");
execFileSync("npx", ["-y", "@gltf-transform/cli@4", "optimize", input, output, "--compress", "meshopt", "--texture-compress", "webp", "--texture-size", max], { stdio: "inherit" });
console.log(`optimized → ${output}`);
