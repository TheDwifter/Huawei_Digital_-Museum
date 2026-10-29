// Hero: a 3D progression of all six principal exhibits, assembled on load and linked to their chapters.
import { t, onLangChange } from '../i18n/i18n.js';
import { REDUCED_MOTION, webglAvailable, LOW_POWER, COARSE_POINTER } from '../util/env.js';

const ITEMS = [
  { key: 'switch', href: '#ch1', size: 1.9, load: () => import('../exhibits/switch.js') },
  { key: 'aau', href: '#ch2', size: 1.95, options: { beams: false }, load: () => import('../exhibits/aau.js') },
  { key: 'phone', href: '#ch3', size: 0.95, options: { phone: 'mate60pro' }, spin: Math.PI * 0.82, load: () => import('../exhibits/phone.js') },
  { key: 'inverter', href: '#ch4', size: 0.75, panel: true, load: () => import('../exhibits/inverter.js') },
  { key: 'rack', href: '#ch5', size: 2.0, load: () => import('../exhibits/rack.js') },
  { key: 'ai', href: '#ch6', size: 1.15, spin: -0.5, load: () => import('../exhibits/ai.js') },
];
// exhibits stand on an arc, nearest to the viewer in the middle
const LAYOUT = ITEMS.map((_, i) => {
  const a = (-62 + (124 * i) / (ITEMS.length - 1)) * (Math.PI / 180);
  return [3.5 * Math.sin(a), -3.5 * (1 - Math.cos(a))];
});

export async function initHero3D() {
  const host = document.getElementById('hero-stage');
  if (!webglAvailable()) { host.classList.add('is-fallback'); return; }
  let mods;
  try {
    mods = await Promise.all([
      import('three'), import('../viewer/stage.js'), import('../viewer/kit.js'), import('../viewer/assembly.js'),
      import('../exhibits/solar.js'), ...ITEMS.map((i) => i.load()),
    ]);
  } catch (err) {
    console.error('[hero]', err);
    host.classList.add('is-fallback');
    return;
  }
  const [THREE, { Stage3D }, { createKit }, { Assembly }, solar, ...defs] = mods;
  const stage = new Stage3D(host, { accent: '#ff3b44', exposure: 1.05, keyIntensity: 2.0, envIntensity: 0.8 });
  const kit = createKit();
  const world = new THREE.Group();
  stage.root.add(world);

  const entries = ITEMS.map((item, i) => {
    const def = defs[i].default;
    const wrapper = new THREE.Group();
    const model = def.build(kit, item.options || {});
    const assembly = new Assembly(model.parts, { ...(model.timing || {}) });
    assembly.apply(assembly.duration, 0);
    model.root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model.root);
    const size = box.getSize(new THREE.Vector3());
    const scale = item.size / Math.max(size.x, size.y, size.z);
    const center = box.getCenter(new THREE.Vector3());
    model.root.position.set(-center.x, -box.min.y, -center.z);
    const inner = new THREE.Group();
    inner.add(model.root);
    inner.scale.setScalar(scale);
    inner.rotation.y = item.spin || 0;
    wrapper.add(inner);
    if (item.panel) {
      const pv = solar.buildPanel(kit, { w: 1.08, d: 0.74 });
      pv.scale.setScalar(0.62);
      pv.position.set(-0.05, 0.62, -0.32);
      pv.rotation.x = -0.9;
      wrapper.add(pv);
    }
    // plinth
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.66, 0.06, 48), kit.mat.paint('#17191d', 0.35));
    plinth.position.y = -0.03;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.006, 8, 96), kit.mat.glow('#ff3b44', 1.4));
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.002;
    wrapper.add(plinth, ring);
    const [x, z] = LAYOUT[i];
    wrapper.position.set(x, 0, z);
    wrapper.lookAt(0, 0, 6);
    world.add(wrapper);
    const height = new THREE.Box3().setFromObject(wrapper).max.y;
    return { item, model, assembly, wrapper, height, start: REDUCED_MOTION.matches ? -99 : 0.35 + i * 0.45 };
  });
  // frame on the exhibits only (before effects, path and floor are added)
  const fullBox = new THREE.Box3().setFromObject(world);
  entries.forEach((e) => e.model.onReady?.({ stage: { scene: e.model.root, lights: stage.lights }, panel: { extraHost: document.createElement('div') } }));
  stage.applyEnvIntensity(world);

  // journey path between plinths
  const curve = new THREE.CatmullRomCurve3(LAYOUT.map(([x, z]) => new THREE.Vector3(x, 0.01, z)));
  const path = new THREE.Mesh(new THREE.TubeGeometry(curve, 120, 0.008, 6), kit.mat.glow('#ff3b44', 0.9));
  const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), kit.mat.glow('#ffd0d3', 3));
  world.add(path, pulse);

  // floor glow
  const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.MeshBasicMaterial({ map: kit.tex.radial('rgba(255,59,68,.16)', 'herofloor'), transparent: true, depthWrite: false }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -0.06, -1);
  world.add(floor);

  // camera
  // On wide screens the composition sits right of the headline: shift the lens instead of the orbit target.
  const narrow = () => window.innerWidth <= 900; // matches the CSS breakpoint where the canvas moves below the text
  let wasNarrow = null;
  const frame = (w = host.clientWidth, h = host.clientHeight) => {
    const n = narrow();
    if (n) stage.camera.clearViewOffset();
    else stage.camera.setViewOffset(w, h, -w * 0.19, h * 0.03, w, h);
    if (n !== wasNarrow) {
      stage.frame(fullBox, n
        ? { azimuth: 0, polar: 1.25, distance: 0.92, target: [0, 0.02, 0], minPolar: 0.9, maxPolar: 1.45 }
        : { azimuth: 0, polar: 1.3, distance: 1.02, target: [0, 0.06, 0], minPolar: 0.9, maxPolar: 1.45 });
      wasNarrow = n;
    }
  };
  frame();
  stage.onResize = frame;
  stage.controls.enableZoom = false;
  if (COARSE_POINTER) {
    // never trap vertical page scrolling on touch screens; taps still open chapters
    stage.controls.enableRotate = false;
    stage.canvas.style.touchAction = 'pan-y';
  }
  stage.controls.autoRotate = !REDUCED_MOTION.matches;
  stage.controls.autoRotateSpeed = 0.25;
  stage.controls.minAzimuthAngle = -0.6;
  stage.controls.maxAzimuthAngle = 0.6;
  let dir = 1;

  // labels
  const labelLayer = document.createElement('div');
  labelLayer.className = 'hero__labels';
  host.parentElement.insertBefore(labelLayer, host.nextSibling);
  const labels = entries.map((e) => {
    const a = document.createElement('a');
    a.className = 'hero-label';
    a.href = e.item.href;
    labelLayer.appendChild(a);
    return a;
  });
  const renderLabels = () => entries.forEach((e, i) => {
    labels[i].innerHTML = `<b>${t(`hero.objects.${e.item.key}.year`)}</b>${t(`hero.objects.${e.item.key}.name`)}`;
  });
  renderLabels();
  onLangChange(renderLabels);

  const tmp = new THREE.Vector3();
  stage.onRender = () => {
    const rect = host.getBoundingClientRect();
    const layerRect = labelLayer.getBoundingClientRect();
    entries.forEach((e, i) => {
      tmp.set(e.wrapper.position.x, e.height + 0.14, e.wrapper.position.z).applyMatrix4(world.matrixWorld);
      const p = stage.project(tmp);
      const el = labels[i];
      if (!p) { el.style.opacity = 0; return; }
      el.style.opacity = '';
      el.style.transform = `translate(${rect.left - layerRect.left + p.x}px, ${rect.top - layerRect.top + p.y}px) translate(-50%, -100%)`;
    });
  };

  // hover + click on objects
  const pickables = entries.map((e) => e.wrapper);
  let hot = -1;
  const findEntry = (obj) => { for (let o = obj; o; o = o.parent) { const i = pickables.indexOf(o); if (i >= 0) return i; } return -1; };
  let down = null;
  stage.canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
  stage.canvas.addEventListener('pointermove', (e) => {
    if (e.buttons) return;
    const hit = stage.pick(e.clientX, e.clientY, pickables);
    const i = hit ? findEntry(hit.object) : -1;
    if (i !== hot) {
      labels[hot]?.classList.remove('is-hot');
      hot = i;
      labels[hot]?.classList.add('is-hot');
      stage.canvas.style.cursor = hot >= 0 ? 'pointer' : '';
    }
  });
  stage.canvas.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
    const hit = stage.pick(e.clientX, e.clientY, pickables);
    const i = hit ? findEntry(hit.object) : -1;
    if (i >= 0) document.querySelector(entries[i].item.href)?.scrollIntoView({ behavior: REDUCED_MOTION.matches ? 'auto' : 'smooth' });
  });

  // animation
  // wall-clock driven so the intro finishes on time even when frames are dropped
  const t0 = performance.now();
  let elapsed = 0;
  stage.addTicker((dt) => {
    elapsed = (performance.now() - t0) / 1000;
    entries.forEach((e) => {
      const T = e.assembly.duration;
      const local = Math.min(T, Math.max(0, (elapsed - e.start) * (T / 3.4)));
      e.assembly.apply(local, 0);
      e.model.update?.({ t: local, dt, T, explode: 0, elapsed, assembly: e.assembly, complete: local >= T - 1e-3, installed: (c) => e.assembly.installed(c, local), stageProgress: (k) => e.assembly.stageProgress(k, local) });
    });
    curve.getPointAt((elapsed * 0.08) % 1, pulse.position);
    if (stage.controls.autoRotate) {
      const az = stage.controls.getAzimuthalAngle();
      if (az > 0.28) dir = -1; else if (az < -0.28) dir = 1;
      stage.controls.autoRotateSpeed = 0.25 * dir;
    }
    return true;
  });

  const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) stage.start(); else stage.stop(); });
  io.observe(host);
  if (LOW_POWER) stage.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
}
