// Assembly timeline: schedules parts into stages and poses them for any time t and explode amount.
import * as THREE from 'three';

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const EASES = {
  out: (t) => 1 - Math.pow(1 - t, 3),
  inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  // decelerating "slide on rails" with a soft settle
  settle: (t) => 1 - Math.pow(1 - t, 4),
};

/**
 * part = {
 *   object, component, stage,
 *   from: [x,y,z]   start offset (local units) the part travels from
 *   rot:  [x,y,z]   start rotation offset (radians), eased to zero
 *   path: 'line' | 'lift'  ('lift' rises first, then descends into place)
 *   explode: [x,y,z] offset applied in exploded view
 *   dur, delay (seconds within stage; default auto-stagger), ease
 * }
 */
export class Assembly {
  constructor(parts, { stageCount, stagger = 0.14, dur = 1.1, gap = 0.45, stageMin = [] } = {}) {
    this.parts = parts.map((p, i) => ({
      ...p,
      i,
      from: new THREE.Vector3(...(p.from || [0, 0, 0])),
      explode: new THREE.Vector3(...(p.explode || [0, 0, 0])),
      rotQ: p.rot ? new THREE.Quaternion().setFromEuler(new THREE.Euler(...p.rot)) : null,
      basePos: p.object.position.clone(),
      baseQuat: p.object.quaternion.clone(),
      ease: EASES[p.ease || 'settle'],
      fade: p.fade !== false,
      mats: [],
      alpha: 1,
    }));
    this.stageCount = stageCount ?? Math.max(...this.parts.map((p) => p.stage)) + 1;

    // schedule
    this.stages = [];
    let cursor = 0;
    for (let s = 0; s < this.stageCount; s++) {
      const list = this.parts.filter((p) => p.stage === s);
      let end = cursor;
      list.forEach((p, k) => {
        p.start = cursor + (p.delay ?? k * stagger);
        p.end = p.start + (p.dur ?? dur);
        end = Math.max(end, p.end);
      });
      end = Math.max(end, cursor + (stageMin[s] || 0));
      this.stages.push({ start: cursor, end });
      cursor = end + gap;
    }
    this.duration = this.stages[this.stages.length - 1].end;

    // per-part material clones so fading/highlighting never leaks between parts
    for (const p of this.parts) {
      const map = new Map();
      p.object.traverse((o) => {
        if (!o.isMesh || !o.material || o.userData.noClone) return;
        const cloneOf = (src) => {
          if (!map.has(src)) {
            const c = src.clone();
            c.userData = { ...src.userData, baseOpacity: src.opacity, baseTransparent: src.transparent, baseDepthWrite: src.depthWrite, baseEmissive: c.emissive?.clone(), baseEmissiveIntensity: c.emissiveIntensity };
            map.set(src, c);
            p.mats.push(c);
          }
          return map.get(src);
        };
        o.material = Array.isArray(o.material) ? o.material.map(cloneOf) : cloneOf(o.material);
        o.userData.component = p.component;
      });
      p.object.userData.component = p.component;
    }
    this.components = [...new Set(this.parts.map((p) => p.component))];
    this._tmpQ = new THREE.Quaternion();
  }

  apply(t, explode = 0) {
    for (const p of this.parts) {
      const raw = (t - p.start) / (p.end - p.start);
      if (raw <= 0) { p.object.visible = false; continue; }
      p.object.visible = true;
      const k = p.ease(clamp01(raw));
      const inv = 1 - k;
      const o = p.object;
      o.position.copy(p.basePos).addScaledVector(p.from, inv).addScaledVector(p.explode, explode);
      if (p.path === 'lift') o.position.y += Math.sin(Math.PI * clamp01(raw)) * p.from.length() * 0.18;
      if (p.rotQ) {
        this._tmpQ.identity().slerp(p.rotQ, inv);
        o.quaternion.copy(p.baseQuat).multiply(this._tmpQ);
      }
      if (p.fade) this.setAlpha(p, clamp01(raw / 0.28));
    }
  }

  setAlpha(p, a) {
    if (Math.abs(a - p.alpha) < 0.001) return;
    const wasOpaque = p.alpha >= 1;
    p.alpha = a;
    for (const m of p.mats) {
      if (a >= 1) {
        m.opacity = m.userData.baseOpacity;
        m.transparent = m.userData.baseTransparent;
        m.depthWrite = m.userData.baseDepthWrite;
      } else {
        m.transparent = true;
        m.opacity = m.userData.baseOpacity * a;
        m.depthWrite = m.userData.baseDepthWrite && a > 0.5;
      }
      if (wasOpaque !== a >= 1) m.needsUpdate = true;
    }
  }

  setHighlight(component, color) {
    for (const p of this.parts) {
      const on = component && p.component === component;
      for (const m of p.mats) {
        if (!m.emissive || m.userData.led) continue;
        if (on) { m.emissive.set(color); m.emissiveIntensity = 0.32; } else { m.emissive.copy(m.userData.baseEmissive); m.emissiveIntensity = m.userData.baseEmissiveIntensity; }
      }
    }
  }

  stageAt(t) {
    let idx = 0;
    this.stages.forEach((s, i) => { if (t >= s.start - 1e-6) idx = i; });
    return idx;
  }

  stageProgress(i, t) {
    const s = this.stages[i];
    return clamp01((t - s.start) / (s.end - s.start));
  }

  installed(component, t) {
    return this.parts.filter((p) => p.component === component).every((p) => t >= p.end - 1e-6);
  }

  started(component, t) {
    return this.parts.some((p) => p.component === component && t > p.start);
  }

  /** Centre of a component in world space (its parts' combined bounds). */
  componentCenter(component, target = new THREE.Vector3()) {
    const box = new THREE.Box3();
    for (const p of this.parts) if (p.component === component && p.object.visible) box.expandByObject(p.object);
    if (box.isEmpty()) return null;
    return box.getCenter(target);
  }

  objectsFor(component) {
    return this.parts.filter((p) => p.component === component).map((p) => p.object);
  }
}
