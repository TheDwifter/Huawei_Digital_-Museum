// Glue between an ExhibitPanel (DOM), a Stage3D (WebGL) and an exhibit definition (geometry + timeline).
import * as THREE from 'three';
import { Stage3D } from './stage.js';
import { Assembly } from './assembly.js';
import { createKit } from './kit.js';
import { REDUCED_MOTION } from '../util/env.js';

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class ExhibitController {
  constructor(panel, def, options = {}) {
    this.panel = panel;
    this.def = def;
    this.options = options;
    this.state = { t: 0, playing: false, speed: 1, explodeOn: false, explode: 0, labels: true, selected: null, stopAt: null, elapsed: 0 };
    this.centers = new Map();
    this.started = false;
    this.bindPanel();
  }

  bindPanel() {
    const s = this.state;
    const p = this.panel;
    p.handlers = {
      play: () => {
        if (!this.assembly) return;
        if (s.playing) { s.playing = false; }
        else {
          if (s.t >= this.assembly.duration - 1e-3) s.t = 0;
          s.playing = true; s.stopAt = null;
        }
        this.syncUI();
        this.wake();
      },
      restart: () => { s.t = 0; s.playing = true; s.stopAt = null; this.apply(); this.wake(); },
      scrub: (f) => { if (!this.assembly) return; s.playing = false; s.t = f * this.assembly.duration; this.apply(); this.wake(); },
      speed: (v) => { s.speed = v; },
      explode: () => { s.explodeOn = !s.explodeOn; p.setExplode(s.explodeOn); this.wake(); },
      labels: () => { s.labels = !s.labels; p.setLabels(s.labels); this.wake(); },
      zoomIn: () => { this.stage?.zoom(0.8); this.wake(); },
      zoomOut: () => { this.stage?.zoom(1.25); this.wake(); },
      reset: () => { this.stage?.resetView(); this.wake(); },
      orbit: ([a, b]) => this.stage?.orbit(a, b),
      stage: (i) => {
        if (!this.assembly) { p.setStage(i, false); return; }
        const st = this.assembly.stages[i];
        s.t = st.start; s.playing = true; s.stopAt = st.end; this.apply(); this.wake();
      },
      select: (c) => this.select(c),
      retry: () => this.onRetry?.(),
    };
  }

  /** Create WebGL resources. Throws if WebGL is unavailable. */
  activate() {
    if (this.stage) return;
    const d = this.def;
    this.stage = new Stage3D(this.panel.canvasHost, { accent: d.accent, exposure: d.exposure ?? 1, envIntensity: d.envIntensity ?? 1, keyIntensity: d.keyIntensity ?? 2.2 });
    this.build();
    this.stage.addTicker((dt) => this.tick(dt));
    this.stage.onRender = () => this.updateHotspots();
    this.bindPointer();
    this.panel.setStatus('ready');
    this.panel.setLabels(this.state.labels);
    this.panel.setExplode(this.state.explodeOn);
    this.stage.start();
  }

  build() {
    const kit = createKit();
    this.kit = kit;
    this.model = this.def.build(kit, this.options);
    this.stage.root.add(this.model.root);
    this.assembly = new Assembly(this.model.parts, { stageCount: this.panel.meta.stages, ...(this.model.timing || {}) });
    this.stage.applyEnvIntensity();
    const T = this.assembly.duration;
    this.assembly.apply(T, 0);
    this.model.root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(this.model.root);
    this.model.extendBounds?.(box);
    if (this.stage.shadow) { this.stage.scene.remove(this.stage.shadow); this.stage.shadow.geometry.dispose(); this.stage.shadow.material.dispose(); }
    this.stage.addContactShadow(box, kit, this.def.shadow ?? 0.45);
    this.stage.frame(box, this.def.view);
    this.state.t = Math.min(this.state.t, T);
    if (REDUCED_MOTION.matches && !this.started) this.state.t = T;
    this.panel.setTicks(this.assembly.stages.slice(1).map((st) => st.start / T));
    if (this.state.selected) this.assembly.setHighlight(this.state.selected, this.def.accent);
    this.model.onReady?.(this);
    this.apply();
  }

  /** Swap model options (e.g. another phone) and replay the assembly. */
  rebuild(options) {
    this.options = { ...this.options, ...options };
    if (!this.stage) return;
    this.stage.root.remove(this.model.root);
    disposeTree(this.model.root);
    this.model.dispose?.();
    this.state.t = 0;
    this.build();
    if (!REDUCED_MOTION.matches) { this.state.playing = true; this.state.stopAt = null; } else { this.state.t = this.assembly.duration; this.apply(); }
    this.syncUI();
    this.wake();
  }

  /** Called when the exhibit becomes meaningfully visible. Starts the assembly once. */
  autoplay() {
    if (this.started || !this.assembly) return;
    this.started = true;
    if (REDUCED_MOTION.matches) return;
    if (this.state.t <= 0.001) { this.state.playing = true; this.syncUI(); }
  }

  bindPointer() {
    const c = this.stage.canvas;
    let down = null;
    c.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
    c.addEventListener('pointerup', (e) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
      const hit = this.stage.pick(e.clientX, e.clientY, [this.model.root]);
      let comp = null;
      for (let o = hit?.object; o; o = o.parent) if (o.userData.component) { comp = o.userData.component; break; }
      this.panel.select(comp === this.state.selected ? null : comp, true);
    });
    c.addEventListener('pointermove', (e) => {
      if (e.buttons) return;
      const hit = this.stage.pick(e.clientX, e.clientY, [this.model.root]);
      c.style.cursor = hit ? 'pointer' : '';
    });
  }

  select(component) {
    this.state.selected = component;
    this.assembly?.setHighlight(component, this.def.accent);
    this.wake();
  }

  wake() { if (this.stage) this.stage.dirty = true; }

  tick(dt) {
    const s = this.state;
    const T = this.assembly.duration;
    let changed = false;
    s.elapsed += dt;
    if (s.playing) {
      s.t += dt * s.speed;
      const limit = s.stopAt ?? T;
      if (s.t >= limit) { s.t = limit; s.playing = false; s.stopAt = null; }
      changed = true;
    }
    const target = s.explodeOn ? 1 : 0;
    if (s.explode !== target) {
      const step = dt / 0.75;
      s.explode = target > s.explode ? Math.min(target, s.explode + step) : Math.max(target, s.explode - step);
      changed = true;
    }
    if (changed) this.apply();
    const fx = this.model.update?.({
      t: s.t, dt, T, explode: s.explode, elapsed: s.elapsed, assembly: this.assembly,
      complete: s.t >= T - 1e-3, installed: (c) => this.assembly.installed(c, s.t), stageProgress: (i) => this.assembly.stageProgress(i, s.t),
    });
    return changed || !!fx;
  }

  apply() {
    const s = this.state;
    const A = this.assembly;
    A.apply(s.t, easeInOut(s.explode));
    this.centers.clear();
    this.syncUI();
  }

  syncUI() {
    if (!this.assembly) return;
    const s = this.state;
    const A = this.assembly;
    const T = A.duration;
    this.panel.setProgress(s.t, T);
    this.panel.setPlaying(s.playing, s.t >= T - 1e-3);
    this.panel.setStage(A.stageAt(s.t), s.t >= T - 1e-3);
    const pending = new Set(A.components.filter((c) => !A.started(c, s.t)));
    if (!sameSet(pending, this.panel.pending)) this.panel.setPending(pending);
  }

  updateHotspots() {
    if (!this.state.labels) return;
    const positions = new Map();
    for (const c of this.panel.meta.components) {
      if (!this.centers.has(c)) this.centers.set(c, this.assembly.componentCenter(c) || null);
      const w = this.centers.get(c);
      positions.set(c, w ? this.stage.project(w) : null);
    }
    this.panel.placeHotspots(positions);
  }

  deactivate() {
    if (!this.stage) return;
    this.model.dispose?.();
    this.stage.dispose();
    this.stage = null;
    this.assembly = null;
    this.model = null;
    this.panel.placeHotspots(new Map());
    this.panel.setStatus('loading');
  }
}

function sameSet(a, b) {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

export function disposeTree(root) {
  root.traverse((o) => {
    o.geometry?.dispose();
    if (o.material) [].concat(o.material).forEach((m) => m.dispose());
  });
}
