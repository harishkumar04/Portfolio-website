#!/usr/bin/env python3
"""
Cuts a harbor painting into 2.5D layers for the runtime scene.

    python3 scripts/art/build_layers.py art/<scene>/layers.json

Reads the painting and a layer definition (polygons in source-image pixels), then writes to
public/art/<scene>/:
  clean.webp           the plate with every moving element (trolley, spreader+container,
                       cables, distant ships) removed by inpainting
  <layer>.webp         RGBA cut-outs of static layers (feathered alpha), cropped to their bounds
  <sprite>.webp        RGBA cut-outs of moving elements, taken from the original painting
  *.half.webp          half-resolution variants for mobile / low quality
  scene.json           everything the runtime needs (rects, depths, animation anchors)
Requires: numpy, pillow, opencv-python-headless.
"""
import json, os, sys
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFilter

def poly_mask(size, polys, feather=0.0, dilate=0):
    m = Image.new("L", size, 0)
    d = ImageDraw.Draw(m)
    for p in polys:
        d.polygon([tuple(map(float, pt)) for pt in p], fill=255)
    if dilate:
        m = m.filter(ImageFilter.MaxFilter(dilate * 2 + 1))
    if feather > 0:
        m = m.filter(ImageFilter.GaussianBlur(feather))
    return m

def line_mask(size, lines, width):
    m = Image.new("L", size, 0)
    d = ImageDraw.Draw(m)
    for a, b in lines:
        d.line([tuple(a), tuple(b)], fill=255, width=width)
    return m

def polys_of(entry):
    p = entry["polygon"]
    return p if p and isinstance(p[0][0], (list, tuple)) else [p]

def bbox(mask, pad=4):
    a = np.array(mask)
    ys, xs = np.nonzero(a > 2)
    if not len(xs):
        return (0, 0, mask.size[0], mask.size[1])
    W, H = mask.size
    return (max(0, xs.min() - pad), max(0, ys.min() - pad), min(W, xs.max() + 1 + pad), min(H, ys.max() + 1 + pad))

def save_rgba(img, mask, rect, path, quality):
    rgba = img.convert("RGBA")
    rgba.putalpha(mask)
    crop = rgba.crop(rect)
    crop.save(path, "WEBP", quality=quality, method=6)
    half = crop.resize((max(1, crop.width // 2), max(1, crop.height // 2)), Image.LANCZOS)
    half.save(path.replace(".webp", ".half.webp"), "WEBP", quality=quality, method=6)

def inpaint_rows(bgr, hole, strip=3):
    """Fills each horizontal run of the hole by blending the clean pixels on both sides.
    Continues horizontal structure (girders, horizon bands, sky gradients) without smearing."""
    img = bgr.astype(np.float32)
    out = img.copy()
    H, W = hole.shape
    for y in range(H):
        row = hole[y] > 0
        if not row.any():
            continue
        x = 0
        while x < W:
            if not row[x]:
                x += 1
                continue
            a = x
            while x < W and row[x]:
                x += 1
            b = x  # run is [a, b)
            left = img[y, max(0, a - strip):a].mean(axis=0) if a > 0 else None
            right = img[y, b:min(W, b + strip)].mean(axis=0) if b < W else None
            if left is None: left = right
            if right is None: right = left
            t = (np.arange(a, b) - a + 0.5) / max(1, b - a)
            out[y, a:b] = left[None, :] * (1 - t[:, None]) + right[None, :] * t[:, None]
    # soften vertical banding inside the filled area only
    blur = cv2.GaussianBlur(out, (0, 0), 1.6)
    m = (hole > 0)[..., None]
    out = np.where(m, blur, out)
    return np.clip(out, 0, 255).astype(np.uint8)

def inpaint(bgr, hole, cfg):
    """Inpaints moving elements out of the plate. Default: scanline ('rows'); also 'fsr', 'telea'."""
    method = cfg.get("inpaintMethod", "rows")
    if method == "rows":
        return inpaint_rows(bgr, hole)
    if method == "fsr" and hasattr(cv2, "xphoto"):
        out = bgr.copy()
        n, labels, stats, _ = cv2.connectedComponentsWithStats(hole)
        for i in range(1, n):
            x, y, w, h, _a = stats[i]
            pad = max(w, h) + 24
            x0, y0 = max(0, x - pad), max(0, y - pad)
            x1, y1 = min(bgr.shape[1], x + w + pad), min(bgr.shape[0], y + h + pad)
            sub = out[y0:y1, x0:x1].copy()
            valid = np.where(labels[y0:y1, x0:x1] == i, 0, 255).astype(np.uint8)  # 255 = known pixel
            res = np.zeros_like(sub)
            cv2.xphoto.inpaint(sub, valid, res, cv2.xphoto.INPAINT_FSR_FAST)
            m = labels[y0:y1, x0:x1] == i
            sub[m] = res[m]
            out[y0:y1, x0:x1] = sub
        return out
    return cv2.inpaint(bgr, hole, cfg.get("inpaintRadius", 9), cv2.INPAINT_TELEA)

def main(cfg_path):
    cfg = json.load(open(cfg_path))
    base = os.path.dirname(cfg_path)
    out = cfg.get("out") or os.path.join("public", "art", cfg["name"])
    os.makedirs(out, exist_ok=True)
    src = Image.open(os.path.join(base, cfg["source"])).convert("RGB")
    W, H = src.size
    q = cfg.get("quality", 88)

    # 1. clean plate: inpaint every moving element (+ cables) out of the painting
    hole = Image.new("L", (W, H), 0)
    for s in cfg.get("sprites", []):
        hole = Image.fromarray(np.maximum(np.array(hole), np.array(poly_mask((W, H), polys_of(s), dilate=s.get("inpaintPad", 4)))))
    if cfg.get("cables"):
        cm = line_mask((W, H), [(c["from"], c["to"]) for c in cfg["cables"]], cfg.get("cableWidth", 5))
        hole = Image.fromarray(np.maximum(np.array(hole), np.array(cm)))
    for p in cfg.get("extraInpaint", []):
        hole = Image.fromarray(np.maximum(np.array(hole), np.array(poly_mask((W, H), [p], dilate=2))))
    bgr = cv2.cvtColor(np.array(src), cv2.COLOR_RGB2BGR)
    hole_u8 = (np.array(hole) > 0).astype(np.uint8) * 255
    clean = inpaint(bgr, hole_u8, cfg)
    clean_img = Image.fromarray(cv2.cvtColor(clean, cv2.COLOR_BGR2RGB))
    clean_img.save(os.path.join(out, "clean.webp"), "WEBP", quality=q, method=6)
    src.save(os.path.join(out, "plate.webp"), "WEBP", quality=q, method=6)  # static fallback / loading image
    clean_img.resize((W // 2, H // 2), Image.LANCZOS).save(os.path.join(out, "clean.half.webp"), "WEBP", quality=q, method=6)
    Image.fromarray(np.array(hole)).save(os.path.join(base, "_inpaint_mask.png"))

    scene = {k: cfg[k] for k in ("name", "camera", "crane", "glows", "sun", "focus", "cables") if k in cfg}
    scene["image"] = {"width": W, "height": H, "clean": "clean.webp", "plate": "plate.webp"}
    scene["layers"], scene["sprites"] = [], []

    # 2. static layers from the clean plate
    for L in cfg["layers"]:
        entry = {k: v for k, v in L.items() if k != "polygon"}
        if L.get("polygon") == "full" or "polygon" not in L:
            entry.update(file="clean.webp", rect=[0, 0, W, H])
        else:
            m = poly_mask((W, H), polys_of(L), feather=L.get("feather", 1.2))
            rect = bbox(m)
            fname = f'{L["id"]}.webp'
            save_rgba(clean_img, m, rect, os.path.join(out, fname), q)
            entry.update(file=fname, rect=list(map(int, rect)))
        scene["layers"].append(entry)

    # 3. moving sprites from the original painting
    for S in cfg.get("sprites", []):
        m = poly_mask((W, H), polys_of(S), feather=S.get("feather", 0.8))
        rect = bbox(m, pad=2)
        fname = f'{S["id"]}.webp'
        save_rgba(src, m, rect, os.path.join(out, fname), q)
        entry = {k: v for k, v in S.items() if k != "polygon"}
        entry.update(file=fname, rect=list(map(int, rect)))
        scene["sprites"].append(entry)

    json.dump(scene, open(os.path.join(out, "scene.json"), "w"), indent=1)
    print(f"wrote {out}: {len(scene['layers'])} layers, {len(scene['sprites'])} sprites ({W}x{H})")

if __name__ == "__main__":
    main(sys.argv[1])
