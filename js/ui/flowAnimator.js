// Tiny helper that moves dots along polylines inside an SVG (used by several diagrams).
import { REDUCED_MOTION } from '../util/env.js';

const NS = 'http://www.w3.org/2000/svg';

export class FlowAnimator {
  constructor(svg, layer) {
    this.svg = svg;
    this.layer = layer;
    this.flows = [];
    this.running = false;
    this.visible = true;
    this.last = 0;
    const io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; if (this.visible) this.kick(); });
    io.observe(svg);
  }

  /** flows: [{ points: [[x,y],...], speed (px/s), count, color, r, reverse, once, onDone }] */
  set(flows) {
    this.layer.replaceChildren();
    this.flows = flows.map((f) => {
      const segs = [];
      let total = 0;
      for (let i = 1; i < f.points.length; i++) {
        const [x0, y0] = f.points[i - 1];
        const [x1, y1] = f.points[i];
        const len = Math.hypot(x1 - x0, y1 - y0);
        segs.push({ x0, y0, x1, y1, len, at: total });
        total += len;
      }
      const dots = Array.from({ length: f.count ?? 3 }, () => {
        const c = document.createElementNS(NS, 'circle');
        c.setAttribute('r', f.r ?? 4);
        c.style.fill = f.color ?? 'currentColor';
        this.layer.appendChild(c);
        return c;
      });
      return { ...f, segs, total, dots, phase: 0 };
    });
    if (REDUCED_MOTION.matches) {
      this.flows.forEach((f) => f.dots.forEach((d, i) => this.place(f, d, ((i + 0.5) / f.dots.length) * f.total)));
      return;
    }
    this.kick();
  }

  place(f, dot, dist) {
    let d = f.reverse ? f.total - dist : dist;
    d = Math.max(0, Math.min(f.total, d));
    const s = f.segs.find((sg) => d <= sg.at + sg.len) || f.segs[f.segs.length - 1];
    const k = s.len ? (d - s.at) / s.len : 0;
    dot.setAttribute('cx', (s.x0 + (s.x1 - s.x0) * k).toFixed(1));
    dot.setAttribute('cy', (s.y0 + (s.y1 - s.y0) * k).toFixed(1));
  }

  kick() {
    if (this.running || REDUCED_MOTION.matches || !this.flows.length) return;
    this.running = true;
    this.last = performance.now();
    const loop = (now) => {
      if (!this.visible || !this.flows.length) { this.running = false; return; }
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      let active = false;
      for (const f of this.flows) {
        if (f.done) continue;
        f.phase += dt * (f.speed ?? 120);
        const n = f.dots.length;
        const spacing = f.once ? 18 : f.total / n;
        f.dots.forEach((dot, i) => {
          const dist = f.once ? f.phase - i * spacing : (f.phase + i * spacing) % f.total;
          dot.style.opacity = f.once && (dist < 0 || dist > f.total) ? 0 : 1;
          this.place(f, dot, dist);
        });
        if (f.once && f.phase - (n - 1) * spacing > f.total) { f.done = true; f.onDone?.(); }
        else active = true;
      }
      if (!active) { this.running = false; return; }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  clear() { this.flows = []; this.layer.replaceChildren(); }
}
