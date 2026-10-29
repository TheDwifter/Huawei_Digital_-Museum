// Chapter 3 — parametric smartphone stack-up. Units: millimetres (root scaled to 1/100).
import { phoneById } from '../content/phones.js';

/** Map planar UVs to 0..1 across a w×h footprint centred on the origin. */
function planarUV(geometry, w, h) {
  const pos = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getY(i) + h / 2) / h);
  uv.needsUpdate = true;
  return geometry;
}

/** Camera layout → { islands: [{type:'circle'|'rect', ...}], lenses: [{x,y,r}], flash: [{x,y}] } in back-view coordinates. */
function cameraLayout(p) {
  const [w, h] = p.dims;
  const top = h / 2;
  const right = w / 2;
  switch (p.layout) {
    case 'single':
      return p.chin
        ? { islands: [{ type: 'circle', x: right - 13, y: top - 14, r: 6 }], lenses: [{ x: right - 13, y: top - 14, r: 3.6 }], flash: [] }
        : { islands: [{ type: 'circle', x: 0, y: top - 13, r: 5.5 }], lenses: [{ x: 0, y: top - 13, r: 3.8 }], flash: [{ x: 11, y: top - 13 }] };
    case 'p9strip':
      return { islands: [{ type: 'rect', x: 0, y: top - 12, w: w - 6, h: 13, r: 1 }], lenses: [{ x: right - 12, y: top - 12, r: 4 }, { x: right - 25, y: top - 12, r: 4 }], flash: [{ x: right - 36, y: top - 12 }] };
    case 'mate10band':
      return { islands: [{ type: 'rect', x: 0, y: top - 24, w: w - 5, h: 30, r: 1 }], lenses: [{ x: 0, y: top - 16, r: 5 }, { x: 0, y: top - 32, r: 5 }], flash: [{ x: -14, y: top - 24 }] };
    case 'p30stack':
      return {
        islands: [{ type: 'rect', x: right - 13, y: top - 31, w: 16, h: 50, r: 7 }],
        lenses: [{ x: right - 13, y: top - 13, r: 5 }, { x: right - 13, y: top - 26, r: 4.6 }, { x: right - 13, y: top - 39, r: 4.6, square: true }],
        flash: [{ x: right - 27, y: top - 12 }, { x: right - 27, y: top - 20 }],
      };
    case 'ring':
      return {
        islands: [{ type: 'circle', x: 0, y: top - 33, r: 21 }],
        lenses: [{ x: 0, y: top - 23, r: 6.5 }, { x: -8.5, y: top - 39, r: 6 }, { x: 8.5, y: top - 39, r: 6 }],
        flash: [{ x: 0, y: top - 46 }],
      };
    case 'pura70':
      return {
        islands: [{ type: 'rect', x: right - 21, y: top - 27, w: 30, h: 40, r: 11 }],
        lenses: [{ x: right - 21, y: top - 17, r: 8.5 }, { x: right - 28, y: top - 37, r: 4.6 }, { x: right - 14, y: top - 37, r: 4.6 }],
        flash: [],
      };
    case 'centerRect':
      return {
        islands: [{ type: 'rect', x: 0, y: top - 31, w: 46, h: 46, r: 13 }],
        lenses: [{ x: -10, y: top - 21, r: 7.5 }, { x: 10, y: top - 21, r: 6 }, { x: -10, y: top - 41, r: 6 }],
        flash: [{ x: 10, y: top - 41 }],
      };
    case 'pill':
      return {
        islands: [{ type: 'rect', x: right - 15, y: top - 25, w: 19, h: 38, r: 9.4 }],
        lenses: [{ x: right - 15, y: top - 15.5, r: 6.5 }, { x: right - 15, y: top - 33.5, r: 5.5 }],
        flash: [{ x: right - 30, y: top - 12 }],
      };
    case 'square':
    default:
      return {
        islands: [{ type: 'rect', x: right - 21, y: top - 21, w: 33, h: 33, r: 8 }],
        lenses: [{ x: right - 28, y: top - 14, r: 5.6 }, { x: right - 14, y: top - 14, r: 5 }, { x: right - 28, y: top - 28, r: 5 }],
        flash: [{ x: right - 14, y: top - 28 }],
      };
  }
}

export default {
  id: 'phone',
  accent: '#d0202a',
  exposure: 1.05,
  view: { azimuth: 2.45, polar: 1.25, distance: 1.05, maxPolar: Math.PI * 0.75 },
  build(kit, options = {}) {
    const { THREE, mat, geo, mesh, group } = kit;
    const p = phoneById(options.phone);
    const [w, h, d] = p.dims;
    const r = p.radius;
    const parts = [];
    const add = (object, component, stage, o = {}) => { parts.push({ object, component, stage, ...o }); return object; };
    const root = new THREE.Group();
    const phone = new THREE.Group();
    phone.scale.setScalar(0.01);
    root.add(phone);

    const zFront = d / 2;
    const zBack = -d / 2;
    const frameDepth = d - 1.4;
    const frameZ = (zFront - 0.9 + zBack + 0.5) / 2;

    // ---- stage 0: mid-frame ----
    const frameMat = mat.metal(p.frame, 0.28);
    const layers = p.layers || 1;
    if (layers > 1) {
      // folded foldables: one frame section per panel, separated by a hinge gap
      const layer = (frameDepth - 0.4 * (layers - 1)) / layers;
      for (let i = 0; i < layers; i++) {
        const ring = mesh(geo.ring(w, h, r, 1.3, layer), frameMat, [0, 0, frameZ - frameDepth / 2 + layer / 2 + i * (layer + 0.4)]);
        phone.add(add(ring, 'frame', 0, { from: [0, 0, -30 - i * 8], delay: i * 0.18, dur: 1.0 }));
      }
    } else {
      const ring = mesh(geo.ring(w, h, r, 1.3, frameDepth), frameMat, [0, 0, frameZ]);
      phone.add(add(ring, 'frame', 0, { from: [0, 0, -30], rot: [0, -0.5, 0], dur: 1.2 }));
    }
    const btnMat = mat.metal(p.frame, 0.3);
    const buttons = group(
      mesh(geo.rbox(1.2, 18, Math.min(3, d * 0.4), 0.5), btnMat, [w / 2 + 0.45, h * 0.2, frameZ]),
      mesh(geo.rbox(1.2, 9, Math.min(3, d * 0.4), 0.5), btnMat, [w / 2 + 0.45, h * 0.06, frameZ]),
    );
    phone.add(add(buttons, 'frame', 0, { from: [10, 0, 0], delay: 0.7, dur: 0.7 }));

    // ---- stage 1: mainboard + SoC ----
    const boardH = h * 0.36;
    const boardY = h / 2 - 3 - boardH / 2;
    const boardZ = zBack + 2.1;
    const board = mesh(geo.box(w - 6, boardH, 0.8), mat.textured(kit.tex.pcb('#0d2a22', 31), { roughness: 0.5 }), [0, boardY, boardZ]);
    phone.add(add(board, 'board', 1, { from: [0, 0, -34], explode: [0, 0, -16], dur: 1.0 }));
    const shieldMat = mat.metal('#c4c9cf', 0.25);
    const soc = group(
      mesh(geo.rbox(13, 13, 0.7, 0.3), mat.plastic('#121418', 0.35), [-w * 0.12, boardY + 2, boardZ - 0.75]),
      mesh(geo.box(9, 9, 0.1), mat.metal('#6d7379', 0.3), [-w * 0.12, boardY + 2, boardZ - 1.15]),
      mesh(geo.rbox(w * 0.32, boardH * 0.32, 0.7, 0.25), shieldMat, [w * 0.18, boardY - boardH * 0.22, boardZ - 0.75]),
      mesh(geo.rbox(w * 0.22, boardH * 0.24, 0.7, 0.25), shieldMat, [-w * 0.2, boardY - boardH * 0.3, boardZ - 0.75]),
    );
    phone.add(add(soc, 'soc', 1, { from: [0, 0, -26], explode: [0, 0, -26], delay: 0.7, dur: 0.9 }));

    // ---- stage 2: cameras (+ island deco) ----
    const L = cameraLayout(p);
    const bump = { ring: 2.2, square: 2.2, centerRect: 2.4, pura70: 2.0, pill: 1.4, p30stack: 1.4 }[p.layout] ?? 0.8;
    const lensBody = mat.plastic('#0b0c0e', 0.4);
    const lensRing = mat.metal('#9ea4ab', 0.25);
    const lensGlass = mat.glass('#0c1426');
    const zIslandOuter = zBack - bump;
    const islands = [];
    L.islands.forEach((isl) => {
      const g = isl.type === 'circle'
        ? geo.slab(isl.r * 2, isl.r * 2, isl.r, bump, {})
        : geo.slab(isl.w, isl.h, isl.r, bump, {});
      const metalIsland = ['ring', 'square', 'centerRect', 'pura70'].includes(p.layout);
      const m = mesh(g, metalIsland ? mat.metal(p.frame, 0.3) : mat.glass('#090a0c'), [isl.x, isl.y, zBack - bump / 2]);
      islands.push(m);
    });
    const camGroup = group(islands);
    L.lenses.forEach((ln) => {
      const len = boardZ - 0.4 - zIslandOuter + 0.2;
      const barrel = ln.square
        ? mesh(geo.box(ln.r * 1.7, ln.r * 1.7, len), lensBody, [ln.x, ln.y, zIslandOuter + len / 2 - 0.2])
        : mesh(geo.cyl(ln.r, ln.r, len, 32).rotateX(Math.PI / 2), lensBody, [ln.x, ln.y, zIslandOuter + len / 2 - 0.2]);
      const ring = ln.square
        ? mesh(geo.box(ln.r * 1.8, ln.r * 1.8, 0.4), lensRing, [ln.x, ln.y, zIslandOuter - 0.15])
        : mesh(new THREE.TorusGeometry(ln.r * 0.95, 0.35, 10, 40), lensRing, [ln.x, ln.y, zIslandOuter - 0.15]);
      const glass = ln.square
        ? mesh(geo.box(ln.r * 1.4, ln.r * 1.4, 0.2), lensGlass, [ln.x, ln.y, zIslandOuter - 0.1])
        : mesh(geo.cyl(ln.r * 0.8, ln.r * 0.8, 0.2, 32).rotateX(Math.PI / 2), lensGlass, [ln.x, ln.y, zIslandOuter - 0.1]);
      camGroup.add(barrel, ring, glass);
    });
    L.flash.forEach((f) => camGroup.add(mesh(geo.cyl(1.6, 1.6, 0.3, 20).rotateX(Math.PI / 2), mat.glow('#fff4d6', 0.25), [f.x, f.y, zIslandOuter - 0.1])));
    phone.add(add(camGroup, 'cameras', 2, { from: [0, 0, -38], explode: [0, 0, -32], dur: 1.1 }));

    // ---- stage 3: battery + internals ----
    const battH = h * 0.42;
    const battY = boardY - boardH / 2 - 3 - battH / 2;
    const battD = Math.max(2.2, d * 0.46);
    const battZ = zBack + 1.0 + battD / 2;
    const battery = group(
      mesh(geo.rbox(w - 11, battH, battD, 1.2), mat.paint('#2a2c30', 0.6)),
      mesh(geo.box(w - 18, battH * 0.5, 0.05), mat.textured(kit.tex.label('Li-ion · ILLUSTRATIVE', { bg: '#34373c', fg: '#aeb4bb', w: 512, h: 96, font: '600 34px Inter, sans-serif' })), [0, 0, -battD / 2 - 0.03]),
    );
    battery.position.set(0, battY, battZ);
    phone.add(add(battery, 'battery', 3, { from: [0, 0, -32], explode: [0, 0, -12], dur: 1.1 }));
    const internals = group(
      mesh(geo.rbox(w * 0.3, 6, Math.min(3, d * 0.45), 0.8), mat.plastic('#17181b'), [w * 0.22, -h / 2 + 7, zBack + 2.3]),
      mesh(geo.cyl(3.2, 3.2, Math.min(2.8, d * 0.4), 20).rotateX(Math.PI / 2), mat.metal('#8b9097'), [-w * 0.26, -h / 2 + 7, zBack + 2.2]),
      mesh(geo.box(4, h * 0.5, 0.25), mat.paint('#c08a3a', 0.4), [-w / 2 + 4.5, -h * 0.08, zBack + 1.0]),
    );
    phone.add(add(internals, 'internals', 3, { from: [0, 0, -26], explode: [0, 0, -20], delay: 0.6, dur: 0.9 }));

    // ---- stage 4: rear cover + display ----
    const holes = L.islands.map((isl) => (isl.type === 'circle' ? { x: isl.x, y: isl.y, r: isl.r + 0.05 } : { x: isl.x, y: isl.y, w: isl.w + 0.1, h: isl.h + 0.1, r: isl.r }));
    const backGeo = planarUV(geo.slab(w - 0.1, h - 0.1, r - 0.05, 0.6, { holes }), w, h);
    const backMat = p.gradient
      ? new THREE.MeshPhysicalMaterial({ map: kit.tex.gradient(p.gradient, p.id), roughness: 0.12, metalness: 0.2, clearcoat: 1 })
      : new THREE.MeshPhysicalMaterial({ color: p.body, roughness: p.layout === 'p9strip' ? 0.45 : 0.22, metalness: p.layout === 'p9strip' ? 0.7 : 0.15, clearcoat: p.layout === 'p9strip' ? 0 : 0.8 });
    const back = mesh(backGeo, backMat, [0, 0, zBack + 0.3]);
    phone.add(add(back, 'back', 4, { from: [0, 0, -45], explode: [0, 0, -42], dur: 1.1 }));

    const display = group();
    const glassGeo = geo.slab(w - 0.15, h - 0.15, r - 0.05, 0.9, { bevel: 0.25 });
    display.add(mesh(glassGeo, mat.glass('#050608')));
    const bezel = p.chin ? 4 : 1.6;
    const scrW = w - bezel * 2;
    const scrH = p.chin ? h * 0.62 : h - bezel * 2;
    const scrY = p.chin ? h * 0.08 : 0;
    const scrGeo = planarUV(new THREE.ShapeGeometry(geo.roundedRect(scrW, scrH, p.chin ? 0.5 : Math.max(r - bezel, 1)), 12), scrW, scrH);
    const screenMat = new THREE.MeshBasicMaterial({ map: kit.tex.screen(p.screenHue), toneMapped: false });
    display.add(mesh(scrGeo, screenMat, [0, scrY, 0.46]));
    display.add(mesh(geo.cyl(1.4, 1.4, 0.1, 20).rotateX(Math.PI / 2), mat.glass('#000'), [0, h / 2 - (p.chin ? 9 : 5), 0.47]));
    if (p.chin) {
      display.add(mesh(geo.rbox(w * 0.7, 9, 0.4, 2), mat.metal(p.frame, 0.3), [0, -h / 2 + 13, 0.5]));
      display.add(mesh(geo.cyl(3.4, 3.4, 0.6, 20).rotateX(Math.PI / 2), mat.plastic('#0d0d0f', 0.3), [0, -h / 2 + 13, 0.7]));
    }
    display.position.set(0, 0, zFront - 0.45);
    phone.add(add(display, 'display', 4, { from: [0, 0, 45], explode: [0, 0, 34], delay: 0.6, dur: 1.2 }));

    // scale explode/from vectors from mm into scene units handled by parent scale: offsets are in local (mm) space
    return {
      root,
      parts,
      timing: { dur: 1.0 },
      update(s) {
        // gentle screen brightness ramp once the display is installed
        const k = s.installed('display') ? 1 : 0.15;
        screenMat.color.setScalar(0.15 + 0.85 * k);
        return false;
      },
    };
  },
};
