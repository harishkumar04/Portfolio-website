import { CanvasTexture, RepeatWrapping, SRGBColorSpace, LinearFilter, LinearMipmapLinearFilter } from "three";
import { mulberry32 } from "./rng";

/** All procedural textures are cached here and released together on unmount. */
const cache = new Map<string, CanvasTexture>();

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { c, g: c.getContext("2d")! };
}

function finish(key: string, c: HTMLCanvasElement, opts: { repeat?: boolean; srgb?: boolean; aniso?: number } = {}) {
  const t = new CanvasTexture(c);
  if (opts.srgb !== false) t.colorSpace = SRGBColorSpace;
  if (opts.repeat) t.wrapS = t.wrapT = RepeatWrapping;
  t.anisotropy = opts.aniso ?? 8;
  t.generateMipmaps = true;
  t.minFilter = LinearMipmapLinearFilter;
  t.magFilter = LinearFilter;
  cache.set(key, t);
  return t;
}

function memo(key: string, make: () => CanvasTexture) {
  return cache.get(key) ?? make();
}

export function disposeTextures() {
  cache.forEach((t) => t.dispose());
  cache.clear();
}

/** 1024x1024 atlas, four 1024x256 container side variants (weathered, with lettering). */
export function containerAtlas(size = 1024) {
  return memo(`containers-${size}`, () => {
    const k = size / 1024;
    const { c, g } = canvas(size, size);
    const rnd = mulberry32(77);
    const rows = 4;
    const rh = size / rows;
    g.fillStyle = "#e9e6e1";
    g.fillRect(0, 0, size, size);
    for (let r = 0; r < rows; r++) {
      const y0 = r * rh;
      // base grime gradient (dark bottom, light top)
      const grad = g.createLinearGradient(0, y0, 0, y0 + rh);
      grad.addColorStop(0, "rgba(255,255,255,0.12)");
      grad.addColorStop(0.7, "rgba(0,0,0,0.04)");
      grad.addColorStop(1, "rgba(30,20,10,0.38)");
      g.fillStyle = grad;
      g.fillRect(0, y0, size, rh);
      // rain streaks
      for (let i = 0; i < 90; i++) {
        const x = rnd() * size, len = rh * (0.2 + rnd() * 0.7);
        g.strokeStyle = `rgba(40,28,18,${0.03 + rnd() * 0.08})`;
        g.lineWidth = (1 + rnd() * 2.5) * k;
        g.beginPath(); g.moveTo(x, y0 + rnd() * rh * 0.2); g.lineTo(x + (rnd() - 0.5) * 6, y0 + len); g.stroke();
      }
      // rust blooms along bottom + corners
      for (let i = 0; i < 26; i++) {
        const x = rnd() * size, y = y0 + rh * (0.75 + rnd() * 0.25);
        const rad = (6 + rnd() * 26) * k;
        const rg = g.createRadialGradient(x, y, 0, x, y, rad);
        rg.addColorStop(0, `rgba(120,55,22,${0.18 + rnd() * 0.22})`);
        rg.addColorStop(1, "rgba(120,55,22,0)");
        g.fillStyle = rg; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
      }
      // dents / scuffs
      for (let i = 0; i < 40; i++) {
        const x = rnd() * size, y = y0 + rnd() * rh;
        g.fillStyle = `rgba(0,0,0,${0.03 + rnd() * 0.05})`;
        g.fillRect(x, y, (10 + rnd() * 50) * k, (1 + rnd() * 3) * k);
      }
      // stencilled markings
      const code = `${["HRBR", "MSCU", "TEMU", "CMAU"][r]} ${Math.floor(100000 + rnd() * 899999)} ${Math.floor(rnd() * 9)}`;
      g.fillStyle = "rgba(20,20,22,0.82)";
      g.font = `bold ${Math.round(30 * k)}px monospace`;
      g.fillText(code, size * 0.04, y0 + rh * 0.2);
      g.font = `${Math.round(22 * k)}px monospace`;
      g.fillText("22G1   MAX GROSS 30480 KG", size * 0.04, y0 + rh * 0.2 + 28 * k);
      g.font = `bold ${Math.round(72 * k)}px sans-serif`;
      g.fillStyle = `rgba(255,255,255,${0.55 + rnd() * 0.3})`;
      g.fillText(["HORIZON", "MERIDIAN", "ATLAS", "NORTHSTAR"][r], size * (0.18 + rnd() * 0.25), y0 + rh * 0.66);
      // fine noise
      for (let i = 0; i < 1400; i++) {
        g.fillStyle = `rgba(0,0,0,${rnd() * 0.07})`;
        g.fillRect(rnd() * size, y0 + rnd() * rh, 2 * k, 2 * k);
      }
    }
    return finish(`containers-${size}`, c);
  });
}

/** Painted + weathered steel plate for ship hulls (multiplied by vertex colours). */
export function hullTexture() {
  return memo("hull", () => {
    const { c, g } = canvas(512, 512);
    const rnd = mulberry32(5);
    g.fillStyle = "#cfcfcf"; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 70; i++) {
      const x = rnd() * 512, len = 80 + rnd() * 380;
      const gr = g.createLinearGradient(0, 0, 0, len);
      gr.addColorStop(0, `rgba(70,40,25,${0.12 + rnd() * 0.18})`);
      gr.addColorStop(1, "rgba(70,40,25,0)");
      g.fillStyle = gr; g.fillRect(x, rnd() * 160, 2 + rnd() * 7, len);
    }
    g.strokeStyle = "rgba(0,0,0,0.5)"; g.lineWidth = 3;
    for (let y = 0; y <= 512; y += 128) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
    g.strokeStyle = "rgba(0,0,0,0.32)";
    for (let x = 0; x <= 512; x += 256) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); }
    for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.08})`; g.fillRect(rnd() * 512, rnd() * 512, 2, 2); }
    return finish("hull", c, { repeat: true });
  });
}

/** Window facade tile (4 m x 3.2 m). Returns both the colour map and a matching emissive map. */
export function facadeTextures() {
  const mk = (lit: boolean) => {
    const key = lit ? "facade-lit" : "facade";
    return memo(key, () => {
      const { c, g } = canvas(256, 256);
      const rnd = mulberry32(31);
      if (!lit) { g.fillStyle = "#dcd6cd"; g.fillRect(0, 0, 256, 256); }
      else { g.fillStyle = "#000"; g.fillRect(0, 0, 256, 256); }
      for (let i = 0; i < 2; i++) {
        const x = 18 + i * 124, y = 82, w = 100, h = 92;
        if (!lit) {
          const gr = g.createLinearGradient(0, y, 0, y + h);
          gr.addColorStop(0, "#3a3550"); gr.addColorStop(0.45, "#141a2e"); gr.addColorStop(1, "#0b1020");
          g.fillStyle = gr; g.fillRect(x, y, w, h);
          g.strokeStyle = "#8c867e"; g.lineWidth = 5; g.strokeRect(x, y, w, h);
        } else if (rnd() > 0.55) {
          const gr = g.createLinearGradient(0, y, 0, y + h);
          gr.addColorStop(0, "#ffd89a"); gr.addColorStop(1, "#ff9d4a");
          g.fillStyle = gr; g.fillRect(x + 3, y + 3, w - 6, h - 6);
        }
      }
      return finish(key, c, { repeat: true });
    });
  };
  return { map: mk(false), emissive: mk(true) };
}

/** Weathered concrete / asphalt apron. */
export function groundTexture() {
  return memo("ground", () => {
    const { c, g } = canvas(512, 512);
    const rnd = mulberry32(12);
    g.fillStyle = "#6a6764"; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 9000; i++) {
      const v = 70 + rnd() * 70;
      g.fillStyle = `rgba(${v},${v - 3},${v - 7},${0.1 + rnd() * 0.25})`;
      g.fillRect(rnd() * 512, rnd() * 512, 1 + rnd() * 3, 1 + rnd() * 3);
    }
    for (let i = 0; i < 14; i++) {
      g.strokeStyle = `rgba(20,18,16,${0.15 + rnd() * 0.2})`; g.lineWidth = 1 + rnd() * 2;
      g.beginPath(); let x = rnd() * 512, y = rnd() * 512; g.moveTo(x, y);
      for (let s = 0; s < 6; s++) { x += (rnd() - 0.5) * 90; y += (rnd() - 0.5) * 90; g.lineTo(x, y); }
      g.stroke();
    }
    for (let i = 0; i < 8; i++) {
      const x = rnd() * 512, y = rnd() * 512, r = 30 + rnd() * 60;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, "rgba(20,20,26,0.22)"); gr.addColorStop(1, "rgba(20,20,26,0)");
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    return finish("ground", c, { repeat: true });
  });
}

/** Soft additive glow used for lamps and navigation lights. */
export function glowTexture() {
  return memo("glow", () => {
    const { c, g } = canvas(128, 128);
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.18, "rgba(255,255,255,0.55)");
    gr.addColorStop(0.5, "rgba(255,255,255,0.12)"); gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    return finish("glow", c, { aniso: 1 });
  });
}

/** Transparent lettering for ship names. */
export function nameTexture(text: string) {
  return memo(`name-${text}`, () => {
    const { c, g } = canvas(1024, 160);
    g.font = "bold 120px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillStyle = "rgba(240,232,215,0.92)";
    g.fillText(text, 512, 84);
    return finish(`name-${text}`, c);
  });
}

/** Blue-grey painted steel with rust streaks, scuffs and weld seams (tile = 8 m, mapped in world space). */
export function steelTexture() {
  return memo("steel", () => {
    const { c, g } = canvas(512, 512);
    const rnd = mulberry32(91);
    g.fillStyle = "#7384a2"; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 5000; i++) { const v = 100 + rnd() * 50; g.fillStyle = `rgba(${v},${v + 8},${v + 28},0.12)`; g.fillRect(rnd() * 512, rnd() * 512, 2 + rnd() * 4, 2 + rnd() * 4); }
    for (let i = 0; i < 60; i++) {
      const x = rnd() * 512, len = 60 + rnd() * 380;
      const gr = g.createLinearGradient(0, 0, 0, len);
      gr.addColorStop(0, `rgba(96,52,28,${0.22 + rnd() * 0.3})`); gr.addColorStop(1, "rgba(96,52,28,0)");
      g.fillStyle = gr; g.fillRect(x, rnd() * 220, 2 + rnd() * 9, len);
    }
    for (let i = 0; i < 26; i++) {
      const x = rnd() * 512, y = rnd() * 512, r = 14 + rnd() * 50;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(120,64,30,${0.25 + rnd() * 0.3})`); gr.addColorStop(1, "rgba(120,64,30,0)");
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    g.strokeStyle = "rgba(20,24,34,0.5)"; g.lineWidth = 3;
    for (let y = 0; y <= 512; y += 256) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
    g.beginPath(); g.moveTo(256, 0); g.lineTo(256, 512); g.stroke();
    g.fillStyle = "rgba(30,34,44,0.55)";
    for (let x = 24; x < 512; x += 48) for (const y of [14, 242, 270, 498]) { g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); }
    return finish("steel", c, { repeat: true });
  });
}

/** Black / yellow diagonal hazard stripes for crane bumpers and kerbs. */
export function hazardTexture() {
  return memo("hazard", () => {
    const { c, g } = canvas(128, 128);
    g.fillStyle = "#e3b21d"; g.fillRect(0, 0, 128, 128);
    g.fillStyle = "#17171a";
    for (let i = -4; i < 8; i++) { g.beginPath(); g.moveTo(i * 32, 128); g.lineTo(i * 32 + 16, 128); g.lineTo(i * 32 + 16 + 128, 0); g.lineTo(i * 32 + 128, 0); g.closePath(); g.fill(); }
    const rnd = mulberry32(3);
    for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.12})`; g.fillRect(rnd() * 128, rnd() * 128, 2, 2); }
    return finish("hazard", c, { repeat: true });
  });
}

/** Wet-concrete roughness: mostly satin with glossy puddles (dark = glossy). */
export function wetRoughness() {
  return memo("wet", () => {
    const { c, g } = canvas(512, 512);
    const rnd = mulberry32(55);
    g.fillStyle = "#9a9a9a"; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 40; i++) {
      const x = rnd() * 512, y = rnd() * 512, rx = 20 + rnd() * 90, ry = 10 + rnd() * 40;
      const gr = g.createRadialGradient(x, y, 0, x, y, rx);
      gr.addColorStop(0, "rgba(18,18,18,0.95)"); gr.addColorStop(0.6, "rgba(40,40,40,0.6)"); gr.addColorStop(1, "rgba(40,40,40,0)");
      g.save(); g.translate(x, y); g.scale(1, ry / rx); g.translate(-x, -y); g.fillStyle = gr; g.fillRect(x - rx, y - rx, rx * 2, rx * 2); g.restore();
    }
    for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.18})`; g.fillRect(rnd() * 512, rnd() * 512, 2, 2); }
    return finish("wet", c, { repeat: true, srgb: false });
  });
}
