// Shared building blocks for procedural exhibits: materials, primitives and canvas textures.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function createKit() {
  const texCache = new Map();

  // ---------- materials ----------
  const std = (o) => new THREE.MeshStandardMaterial(o);
  const mat = {
    metal: (color = '#b9bec6', roughness = 0.32) => std({ color, metalness: 0.92, roughness }),
    brushed: (color = '#a9afb8') => std({ color, metalness: 0.85, roughness: 0.42 }),
    paint: (color = '#2a2d33', roughness = 0.55) => std({ color, metalness: 0.15, roughness }),
    plastic: (color = '#1a1b1e', roughness = 0.62) => std({ color, metalness: 0.02, roughness }),
    rubber: (color = '#121214') => std({ color, metalness: 0, roughness: 0.9 }),
    copper: () => std({ color: '#c47a45', metalness: 1, roughness: 0.3 }),
    gold: () => std({ color: '#d4a64a', metalness: 1, roughness: 0.28 }),
    glass: (color = '#0a0c10', opacity = 1) => new THREE.MeshPhysicalMaterial({
      color, metalness: 0.1, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.04, transparent: opacity < 1, opacity,
    }),
    led: (color = '#38e07b') => {
      const m = std({ color: '#1a1a1a', emissive: new THREE.Color(color), emissiveIntensity: 0, roughness: 0.4 });
      m.userData.led = true;
      return m;
    },
    glow: (color, intensity = 1.5) => std({ color: '#000', emissive: new THREE.Color(color), emissiveIntensity: intensity }),
    textured: (map, o = {}) => std({ map, roughness: 0.55, metalness: 0.1, ...o }),
  };

  // ---------- geometry ----------
  const place = (mesh, pos, rot) => {
    if (pos) mesh.position.set(pos[0], pos[1], pos[2]);
    if (rot) mesh.rotation.set(rot[0], rot[1], rot[2]);
    return mesh;
  };
  const geo = {
    box: (w, h, d) => new THREE.BoxGeometry(w, h, d),
    rbox: (w, h, d, r, seg = 3) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2, h / 2, d / 2) * 0.999),
    cyl: (rt, rb, h, seg = 24) => new THREE.CylinderGeometry(rt, rb, h, seg),
    roundedRect(w, h, r) {
      const s = new THREE.Shape();
      const x = -w / 2, y = -h / 2;
      r = Math.min(r, w / 2, h / 2);
      s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
      s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
      s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
      return s;
    },
    /** Extruded rounded slab centred on z, optional holes [{x,y,r}] or rect holes [{x,y,w,h,r}]. */
    slab(w, h, r, depth, { holes = [], bevel = 0, curveSegments = 10 } = {}) {
      const shape = geo.roundedRect(w, h, r);
      for (const hl of holes) {
        const p = new THREE.Path();
        if (hl.w) {
          const hs = geo.roundedRect(hl.w, hl.h, hl.r ?? 0);
          hs.getPoints(8).forEach((pt, i) => (i ? p.lineTo(pt.x + hl.x, pt.y + hl.y) : p.moveTo(pt.x + hl.x, pt.y + hl.y)));
        } else {
          p.absarc(hl.x, hl.y, hl.r, 0, Math.PI * 2, true);
        }
        shape.holes.push(p);
      }
      const g = new THREE.ExtrudeGeometry(shape, {
        depth: Math.max(depth - bevel * 2, 0.0001), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.9,
        bevelSegments: 3, curveSegments,
      });
      g.translate(0, 0, -depth / 2 + bevel);
      return g;
    },
    /** Rounded-rect ring (frame) of outer size w×h, wall thickness t. */
    ring(w, h, r, t, depth) {
      const shape = geo.roundedRect(w, h, r);
      const inner = geo.roundedRect(w - t * 2, h - t * 2, Math.max(r - t, 0.5 * t));
      const p = new THREE.Path(inner.getPoints(12).reverse());
      shape.holes.push(p);
      const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 12 });
      g.translate(0, 0, -depth / 2);
      return g;
    },
    merge: (list) => mergeGeometries(list, false),
    translated: (g, x, y, z) => { g.translate(x, y, z); return g; },
  };

  const mesh = (geometry, material, pos, rot) => {
    const m = place(new THREE.Mesh(geometry, material), pos, rot);
    return m;
  };
  const group = (...children) => { const g = new THREE.Group(); children.flat().forEach((c) => c && g.add(c)); return g; };
  const at = (obj, x, y, z) => { obj.position.set(x, y, z); return obj; };

  // ---------- canvas textures ----------
  function canvasTex(key, w, h, draw, { repeat, srgb = true } = {}) {
    if (key && texCache.has(key)) return texCache.get(key);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const tex = new THREE.CanvasTexture(c);
    if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    if (repeat) { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(repeat[0], repeat[1]); }
    if (key) texCache.set(key, tex);
    return tex;
  }

  // deterministic pseudo-random so textures are stable between rebuilds
  const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  const tex = {
    pcb(color = '#0f2a24', seed = 7) {
      return canvasTex(`pcb-${color}-${seed}`, 512, 512, (g, w, h) => {
        const r = rng(seed);
        g.fillStyle = color; g.fillRect(0, 0, w, h);
        g.strokeStyle = 'rgba(214,170,80,.55)'; g.lineCap = 'round';
        for (let i = 0; i < 90; i++) {
          g.lineWidth = r() < 0.2 ? 3 : 1.4;
          let x = r() * w, y = r() * h;
          g.beginPath(); g.moveTo(x, y);
          for (let k = 0; k < 3; k++) {
            if (r() < 0.5) x += (r() - 0.5) * 160; else y += (r() - 0.5) * 160;
            g.lineTo(x, y);
          }
          g.stroke();
          g.fillStyle = 'rgba(226,186,96,.8)';
          g.beginPath(); g.arc(x, y, 2.6, 0, Math.PI * 2); g.fill();
        }
        g.fillStyle = 'rgba(255,255,255,.08)';
        for (let i = 0; i < 40; i++) g.fillRect(r() * w, r() * h, 10 + r() * 30, 4);
      });
    },
    vents(bg = '#2b2f36', hole = '#0b0c0e', key = 'vents') {
      return canvasTex(`${key}-${bg}`, 256, 256, (g, w, h) => {
        g.fillStyle = bg; g.fillRect(0, 0, w, h);
        g.fillStyle = hole;
        for (let y = 8; y < h; y += 16) for (let x = (y / 16) % 2 ? 16 : 8; x < w; x += 16) { g.beginPath(); g.arc(x, y, 4.2, 0, Math.PI * 2); g.fill(); }
      }, { repeat: [1, 1] });
    },
    solarCell() {
      return canvasTex('solar', 512, 512, (g, w, h) => {
        const grad = g.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, '#13213f'); grad.addColorStop(1, '#0a1328');
        g.fillStyle = grad; g.fillRect(0, 0, w, h);
        const cols = 6, rows = 10, cw = w / cols, ch = h / rows;
        for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
          g.fillStyle = (i + j) % 2 ? '#152a52' : '#122549';
          g.fillRect(i * cw + 3, j * ch + 3, cw - 6, ch - 6);
          g.strokeStyle = 'rgba(190,205,230,.35)'; g.lineWidth = 1;
          for (let b = 1; b < 4; b++) { g.beginPath(); g.moveTo(i * cw + (cw * b) / 4, j * ch + 3); g.lineTo(i * cw + (cw * b) / 4, (j + 1) * ch - 3); g.stroke(); }
        }
      });
    },
    screen(hue = 210, { clock = true, seams = 0 } = {}) {
      return canvasTex(`screen-${hue}-${clock}-${seams}`, 512, 1024, (g, w, h) => {
        const grad = g.createLinearGradient(0, 0, w * 0.4, h);
        grad.addColorStop(0, `hsl(${hue}, 70%, 52%)`);
        grad.addColorStop(0.55, `hsl(${(hue + 40) % 360}, 65%, 30%)`);
        grad.addColorStop(1, `hsl(${(hue + 70) % 360}, 60%, 12%)`);
        g.fillStyle = grad; g.fillRect(0, 0, w, h);
        const glow = g.createRadialGradient(w * 0.7, h * 0.3, 10, w * 0.7, h * 0.3, w * 0.9);
        glow.addColorStop(0, 'rgba(255,255,255,.35)'); glow.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = glow; g.fillRect(0, 0, w, h);
        if (clock) {
          g.fillStyle = 'rgba(255,255,255,.92)';
          g.font = '600 120px Inter, Arial, sans-serif'; g.textAlign = 'center';
          g.fillText('10:08', w / 2, h * 0.24);
          g.font = '500 30px Inter, Arial, sans-serif'; g.fillStyle = 'rgba(255,255,255,.7)';
          g.fillText('1987 — 2037', w / 2, h * 0.29);
          g.fillStyle = 'rgba(255,255,255,.18)';
          for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
            g.beginPath(); g.roundRect?.(w * 0.12 + i * w * 0.2, h * 0.74 + j * 110, 74, 74, 18); g.fill();
          }
        }
        if (seams) {
          g.fillStyle = 'rgba(0,0,0,.25)';
          for (let s = 1; s <= seams; s++) g.fillRect((w * s) / (seams + 1) - 1, 0, 2, h);
        }
      });
    },
    gradient(colors, key) {
      return canvasTex(`grad-${key}`, 256, 512, (g, w, h) => {
        const grad = g.createLinearGradient(0, 0, w, h);
        colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
        g.fillStyle = grad; g.fillRect(0, 0, w, h);
      });
    },
    driveBays(color = '#262a30', cols = 6, rows = 2) {
      return canvasTex(`drives-${color}-${cols}-${rows}`, 512, 128, (g, w, h) => {
        g.fillStyle = color; g.fillRect(0, 0, w, h);
        const cw = w / cols, ch = h / rows;
        for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
          g.fillStyle = '#16181c'; g.fillRect(i * cw + 4, j * ch + 4, cw - 8, ch - 8);
          g.fillStyle = '#3a3f47'; g.fillRect(i * cw + 8, j * ch + ch / 2 - 2, cw - 30, 4);
          g.fillStyle = '#5ad18a'; g.fillRect(i * cw + cw - 18, j * ch + 10, 5, 5);
        }
      });
    },
    serverFront(color = '#d9dde3') {
      return canvasTex(`srvfront-${color}`, 512, 64, (g, w, h) => {
        g.fillStyle = color; g.fillRect(0, 0, w, h);
        g.fillStyle = 'rgba(0,0,0,.55)';
        for (let x = 140; x < w - 20; x += 9) for (let y = 8; y < h - 6; y += 9) { g.beginPath(); g.arc(x, y, 2.6, 0, 7); g.fill(); }
        for (let i = 0; i < 4; i++) { g.fillStyle = '#1b1d21'; g.fillRect(12 + i * 30, 10, 24, h - 20); }
      });
    },
    label(text, { bg = '#1a1c20', fg = '#c9ced6', w = 256, h = 64, font = '500 26px "JetBrains Mono", monospace' } = {}) {
      return canvasTex(`label-${text}-${bg}`, w, h, (g) => {
        g.fillStyle = bg; g.fillRect(0, 0, w, h);
        g.fillStyle = fg; g.font = font; g.textBaseline = 'middle'; g.fillText(text, 14, h / 2);
      });
    },
    radial(inner = 'rgba(0,0,0,.45)', key = 'shadow') {
      return canvasTex(`radial-${key}`, 256, 256, (g, w, h) => {
        const grad = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        grad.addColorStop(0, inner); grad.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = grad; g.fillRect(0, 0, w, h);
      });
    },
  };

  return { THREE, mat, geo, mesh, group, at, tex, place, rng };
}
