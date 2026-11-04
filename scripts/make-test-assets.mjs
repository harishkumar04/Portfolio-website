// Generates tiny placeholder GLBs (named nodes, multi-part meshes) under public/models/__test__
// so the asset pipeline can be exercised with `?testAssets` in development. Not shipped.
import { mkdirSync, writeFileSync } from "node:fs";

function box(w, h, d, [cx, cy, cz]) {
  const x = w / 2, y = h / 2, z = d / 2;
  const faces = [
    [[1, 0, 0], [[x, -y, -z], [x, y, -z], [x, y, z], [x, -y, z]]],
    [[-1, 0, 0], [[-x, -y, z], [-x, y, z], [-x, y, -z], [-x, -y, -z]]],
    [[0, 1, 0], [[-x, y, -z], [-x, y, z], [x, y, z], [x, y, -z]]],
    [[0, -1, 0], [[-x, -y, z], [-x, -y, -z], [x, -y, -z], [x, -y, z]]],
    [[0, 0, 1], [[x, -y, z], [x, y, z], [-x, y, z], [-x, -y, z]]],
    [[0, 0, -1], [[-x, -y, -z], [-x, y, -z], [x, y, -z], [x, -y, -z]]],
  ];
  const pos = [], nor = [], idx = [];
  faces.forEach(([n, vs], f) => {
    vs.forEach((v) => { pos.push(v[0] + cx, v[1] + cy, v[2] + cz); nor.push(...n); });
    const o = f * 4; idx.push(o, o + 1, o + 2, o, o + 2, o + 3);
  });
  return { pos, nor, idx };
}
function merge(boxes) {
  const pos = [], nor = [], idx = [];
  for (const b of boxes) { const o = pos.length / 3; pos.push(...b.pos); nor.push(...b.nor); idx.push(...b.idx.map((i) => i + o)); }
  return { pos, nor, idx };
}

function writeGLB(file, meshes, materials, nodes) {
  const bin = [], bufferViews = [], accessors = [], gltfMeshes = [];
  let offset = 0;
  const push = (arr, type, target) => {
    const buf = type === "u32" ? Buffer.from(new Uint32Array(arr).buffer) : Buffer.from(new Float32Array(arr).buffer);
    bin.push(buf); const pad = (4 - (buf.length % 4)) % 4; if (pad) bin.push(Buffer.alloc(pad));
    bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: buf.length, target });
    offset += buf.length + pad;
    return bufferViews.length - 1;
  };
  meshes.forEach((m) => {
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < m.geo.pos.length; i += 3) for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], m.geo.pos[i + k]); max[k] = Math.max(max[k], m.geo.pos[i + k]); }
    const pv = push(m.geo.pos, "f32", 34962), nv = push(m.geo.nor, "f32", 34962), iv = push(m.geo.idx, "u32", 34963);
    accessors.push({ bufferView: pv, componentType: 5126, count: m.geo.pos.length / 3, type: "VEC3", min, max });
    accessors.push({ bufferView: nv, componentType: 5126, count: m.geo.nor.length / 3, type: "VEC3" });
    accessors.push({ bufferView: iv, componentType: 5125, count: m.geo.idx.length, type: "SCALAR" });
    const a = accessors.length - 3;
    gltfMeshes.push({ name: m.name, primitives: [{ attributes: { POSITION: a, NORMAL: a + 1 }, indices: a + 2, material: m.material }] });
  });
  const json = {
    asset: { version: "2.0", generator: "beyond-the-horizon test assets" },
    scene: 0, scenes: [{ nodes: nodes.map((_, i) => i) }],
    nodes: nodes.map((n) => ({ name: n.name, mesh: n.mesh, translation: n.t ?? [0, 0, 0] })),
    meshes: gltfMeshes,
    materials: materials.map(([name, c, metal, rough]) => ({ name, pbrMetallicRoughness: { baseColorFactor: [...c, 1], metallicFactor: metal, roughnessFactor: rough } })),
    buffers: [{ byteLength: offset }], bufferViews, accessors,
  };
  let js = Buffer.from(JSON.stringify(json)); const jp = (4 - (js.length % 4)) % 4; js = Buffer.concat([js, Buffer.alloc(jp, 0x20)]);
  const body = Buffer.concat(bin);
  const header = Buffer.alloc(12); header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(12 + 8 + js.length + 8 + body.length, 8);
  const jh = Buffer.alloc(8); jh.writeUInt32LE(js.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
  const bh = Buffer.alloc(8); bh.writeUInt32LE(body.length, 0); bh.writeUInt32LE(0x004e4942, 4);
  writeFileSync(file, Buffer.concat([header, jh, js, bh, body]));
}

const out = "public/models/__test__";
mkdirSync(out, { recursive: true });
const M = { steel: ["steel", [0.35, 0.42, 0.55], 0.6, 0.5], yellow: ["yellow", [0.85, 0.6, 0.1], 0.3, 0.5], white: ["paint", [0.9, 0.9, 0.9], 0.2, 0.6], dark: ["dark", [0.05, 0.05, 0.06], 0.6, 0.5], red: ["red", [0.5, 0.06, 0.05], 0.3, 0.6], hull: ["hull", [0.04, 0.06, 0.14], 0.3, 0.5] };

// Crane: structure + separately named Trolley and Spreader (crane conventions: boom towards -Z)
const legs = [-8, 8].flatMap((x) => [2.5, 28.5].map((z) => box(2.4, 42, 2.4, [x, 21, z])));
const boom = [-2.6, 2.6].map((x) => box(0.9, 3, 90, [x, 44, -1]));
writeGLB(`${out}/gantryCrane.glb`,
  [{ name: "Structure", geo: merge([...legs, ...boom, box(2.4, 26, 2.4, [0, 58, 6]), box(1, 1, 1, [0, 70.5, 6])]), material: 0 },
   { name: "TrolleyMesh", geo: box(5.4, 1.6, 5.6, [0, 0, 0]), material: 1 },
   { name: "SpreaderMesh", geo: merge([box(12.1, 0.45, 2.4, [0, 0.22, 0]), box(3.2, 0.9, 2.2, [0, 1.2, 0])]), material: 1 }],
  [M.steel, M.yellow], [{ name: "Structure", mesh: 0 }, { name: "Trolley", mesh: 1, t: [0, 44.3, 10] }, { name: "Spreader", mesh: 2, t: [0, 30, 10] }]);

const ship = (n) => writeGLB(`${out}/${n}.glb`,
  [{ name: "Hull", geo: merge([box(200, 21, 30, [0, 10.5, 0]), box(14, 4, 12, [88, 16, 0])]), material: 0 },
   { name: "Bridge", geo: merge([box(18, 18, 26, [-60, 30, 0]), box(9, 4, 31, [-57, 41, 0])]), material: 1 },
   { name: "Boot", geo: box(200.2, 8.8, 30.2, [0, 4.3, 0]), material: 2 }],
  [M.hull, M.white, M.red], [{ name: "Hull", mesh: 0 }, { name: "Bridge", mesh: 1 }, { name: "Boot", mesh: 2 }]);
ship("cargoShipHero"); ship("cargoShipDistant");

// Container: two parts (painted body + dark corner frame) to exercise multi-part instancing
const L = 12.192, H = 2.591, W = 2.438;
const frame = [-1, 1].flatMap((sx) => [-1, 1].map((sz) => box(0.16, H, 0.16, [sx * (L / 2 - 0.08), H / 2, sz * (W / 2 - 0.08)])));
writeGLB(`${out}/container40.glb`,
  [{ name: "Body", geo: box(L - 0.1, H - 0.1, W - 0.1, [0, H / 2, 0]), material: 0 }, { name: "Frame", geo: merge(frame), material: 1 }],
  [M.white, M.dark], [{ name: "Body", mesh: 0 }, { name: "Frame", mesh: 1 }]);

writeGLB(`${out}/terminalTruck.glb`, [{ name: "Truck", geo: merge([box(13, 1.2, 2.5, [0, 1.2, 0]), box(3, 3, 2.4, [-8, 2, 0])]), material: 0 }], [M.yellow], [{ name: "Truck", mesh: 0 }]);
writeGLB(`${out}/forklift.glb`, [{ name: "Forklift", geo: merge([box(3, 1.6, 1.5, [0, 1, 0]), box(0.2, 3.4, 1.2, [1.6, 1.9, 0])]), material: 0 }], [M.yellow], [{ name: "Forklift", mesh: 0 }]);
console.log("test assets written to", out);
