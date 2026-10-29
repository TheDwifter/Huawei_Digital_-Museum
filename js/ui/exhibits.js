// Lazily creates and disposes 3D exhibits as they approach / leave the viewport.
import { ExhibitPanel } from '../viewer/panel.js';
import { EXHIBIT_META } from '../exhibits/meta.js';
import { webglAvailable } from '../util/env.js';

const registry = new Map();
let libPromise = null;
const loadLib = () => (libPromise ??= import('../viewer/controller.js'));

export const getExhibit = (id) => registry.get(id);

export function mountExhibits() {
  const gl = webglAvailable();
  const near = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) activate(registry.get(e.target.dataset.exhibit)); }), { rootMargin: '60% 0px' });
  const far = new IntersectionObserver((entries) => entries.forEach((e) => { if (!e.isIntersecting) deactivate(registry.get(e.target.dataset.exhibit)); }), { rootMargin: '170% 0px' });
  const vis = new IntersectionObserver((entries) => entries.forEach((e) => {
    const entry = registry.get(e.target.dataset.exhibit);
    entry.visible = e.intersectionRatio >= 0.3;
    const stage = entry.controller?.stage;
    if (stage) { if (e.isIntersecting) stage.start(); else stage.stop(); }
    if (entry.visible) entry.controller?.autoplay();
  }), { threshold: [0, 0.3] });

  document.querySelectorAll('[data-exhibit]').forEach((el) => {
    const id = el.dataset.exhibit;
    const entry = { id, el, panel: new ExhibitPanel(el, id), controller: null, options: {}, near: false, visible: false };
    registry.set(id, entry);
    entry.panel.handlers.retry = () => activate(entry);
    if (!gl) { entry.panel.setStatus('error'); return; }
    near.observe(el); far.observe(el); vis.observe(el);
  });
}

async function activate(entry) {
  if (!entry || entry.controller?.stage) return;
  entry.near = true;
  try {
    if (!entry.controller) {
      const [{ ExhibitController }, mod] = await Promise.all([loadLib(), EXHIBIT_META[entry.id].load()]);
      if (entry.controller) return;
      entry.controller = new ExhibitController(entry.panel, mod.default, entry.options);
      entry.controller.onRetry = () => activate(entry);
    }
    if (!entry.near || entry.controller.stage) return;
    entry.controller.activate();
    if (entry.visible) entry.controller.autoplay();
    entry.onActivate?.(entry.controller);
  } catch (err) {
    console.error(`[exhibit:${entry.id}]`, err);
    try { entry.controller?.deactivate(); } catch { /* ignore */ }
    libPromise = null;
    entry.panel.setStatus('error');
    entry.panel.handlers.retry = () => activate(entry);
  }
}

function deactivate(entry) {
  if (!entry) return;
  entry.near = false;
  entry.controller?.deactivate();
}
