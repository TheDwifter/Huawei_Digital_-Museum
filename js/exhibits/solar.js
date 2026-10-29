// Chapter 4 — illustrative home solar + storage system with an interactive energy-flow simulation. Units: metres.
import { t, formatNumber } from '../i18n/i18n.js';

const DC = '#f2b134';
const AC = '#55d1ff';
const PV_KW = 6;
const BATT_KWH = 10;
const BATT_KW = 5;
const gauss = (x, mu, s) => Math.exp(-((x - mu) ** 2) / (2 * s * s));

/** Simple, documented energy balance for one instant. All values in kW. */
export function balance(h, on, soc) {
  const sun = h > 6 && h < 18 ? Math.sin((Math.PI * (h - 6)) / 12) : 0;
  const gen = on.pv ? PV_KW * 0.9 * Math.pow(sun, 1.15) : 0;
  const load = on.home ? 0.35 + 1.1 * gauss(h, 7.5, 1) + 2.0 * gauss(h, 19.5, 1.6) + 0.3 * gauss(h, 13, 2) : 0;
  const r = { sun, gen, load, charge: 0, discharge: 0, imp: 0, exp: 0, curtailed: 0, unserved: 0, pvUsed: 0 };
  if (!on.inverter) {
    r.curtailed = gen;
    if (on.grid) r.imp = load; else r.unserved = load;
    return r;
  }
  const surplus = gen - load;
  if (surplus >= 0) {
    r.charge = on.battery && soc < 0.995 ? Math.min(surplus, BATT_KW) : 0;
    r.exp = on.grid ? surplus - r.charge : 0;
    r.curtailed = surplus - r.charge - r.exp;
  } else {
    const deficit = -surplus;
    r.discharge = on.battery && soc > 0.05 ? Math.min(deficit, BATT_KW) : 0;
    r.imp = on.grid ? deficit - r.discharge : 0;
    r.unserved = deficit - r.discharge - r.imp;
  }
  r.pvUsed = gen - r.curtailed;
  return r;
}

export function buildPanel(kit, { w = 1.08, d = 0.74 } = {}) {
  const { mat, geo, mesh, group } = kit;
  return group(
    mesh(geo.box(w + 0.03, 0.035, d + 0.03), mat.metal('#aeb4bb', 0.35), [0, -0.005, 0]),
    mesh(geo.box(w, 0.04, d), [mat.metal('#aeb4bb'), mat.metal('#aeb4bb'), mat.textured(kit.tex.solarCell(), { roughness: 0.25, metalness: 0.5 }), mat.paint('#222'), mat.metal('#aeb4bb'), mat.metal('#aeb4bb')]),
  );
}

export default {
  id: 'solar',
  accent: '#f2b134',
  exposure: 1.0,
  view: { azimuth: 0.62, polar: 1.12, distance: 0.82, target: [0.05, -0.05, 0] },
  build(kit, options = {}) {
    const { THREE, mat, geo, mesh, group } = kit;
    const parts = [];
    const add = (object, component, stage, o = {}) => { parts.push({ object, component, stage, ...o }); return object; };
    const root = new THREE.Group();

    // ---- static context: house ----
    const wallMat = mat.paint('#d9d2c3', 0.8);
    const roofMat = mat.paint('#3b3f45', 0.7);
    const house = group(mesh(geo.box(6, 3, 5), wallMat, [0, 1.5, 0]));
    const slope = Math.atan2(1.6, 2.7);
    const roofLen = Math.hypot(1.6, 2.9);
    [-1, 1].forEach((s) => house.add(mesh(geo.box(6.5, 0.12, roofLen), roofMat, [0, 3.0 + 0.8, s * 1.4], [s * slope, 0, 0])));
    const gable = new THREE.Shape([new THREE.Vector2(-2.5, 0), new THREE.Vector2(2.5, 0), new THREE.Vector2(0, 1.6)]);
    [-1, 1].forEach((s) => {
      const g = new THREE.ShapeGeometry(gable);
      const m = mesh(g, wallMat, [s * 3, 3.0, 0], [0, s * Math.PI / 2, 0]);
      house.add(m);
    });
    const windowMat = mat.glow('#ffcf7a', 0);
    windowMat.color.set('#30343a');
    windowMat.roughness = 0.2;
    const windows = [];
    [[-1.6, 1.6], [1.6, 1.6], [-1.6, 0.0]].forEach(([x, y], i) => {
      if (i === 2) return;
      const w = mesh(geo.box(1.1, 0.9, 0.04), windowMat, [x, y, 2.5]);
      windows.push(w); house.add(w);
    });
    const w3 = mesh(geo.box(0.04, 0.9, 1.1), windowMat, [3.0, 1.7, 0.0]);
    windows.push(w3); house.add(w3);
    house.add(mesh(geo.box(0.9, 2.0, 0.05), mat.paint('#5a4636', 0.6), [0, 1.0, 2.52]));
    root.add(house);

    // ---- stage 0: PV array on the front (south) roof ----
    const roofGroup = new THREE.Group();
    roofGroup.position.set(0, 3.0 + 0.8, 1.4);
    roofGroup.rotation.x = slope;
    root.add(roofGroup);
    const rails = group(
      mesh(geo.box(5.8, 0.04, 0.05), mat.metal('#9aa0a7'), [0, 0.09, -0.8]),
      mesh(geo.box(5.8, 0.04, 0.05), mat.metal('#9aa0a7'), [0, 0.09, 0.0]),
      mesh(geo.box(5.8, 0.04, 0.05), mat.metal('#9aa0a7'), [0, 0.09, 0.8]),
    );
    roofGroup.add(add(rails, 'panels', 0, { from: [0, 0.6, 0], dur: 0.8 }));
    let k = 0;
    for (let row = 0; row < 3; row++) for (let col = 0; col < 5; col++) {
      const pnl = buildPanel(kit);
      pnl.position.set(-2.26 + col * 1.13, 0.14, -0.79 + row * 0.79);
      roofGroup.add(add(pnl, 'panels', 0, { from: [0, 0.9, 0], delay: 0.5 + k * 0.08, dur: 0.6 }));
      k++;
    }

    // ---- stage 1: inverter on the east wall + DC cable ----
    const invGroup = group(
      mesh(geo.rbox(0.18, 0.6, 0.5, 0.03), mat.paint('#f2f1ed', 0.45)),
      mesh(geo.box(0.01, 0.012, 0.18), mat.glow('#5be08f', 1.6), [0.095, -0.2, 0]),
    );
    invGroup.position.set(3.1, 1.75, 1.0);
    root.add(add(invGroup, 'inverter', 1, { from: [1.6, 0, 0], explode: [0.8, 0, 0], dur: 1.0 }));
    const cableMat = mat.rubber('#151618');
    const tube = (pts, r = 0.025) => mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 40, r, 8), cableMat);
    const P = {
      pv: [[2.8, 3.2, 2.35], [3.06, 3.0, 2.3], [3.06, 2.3, 1.5], [3.12, 2.06, 1.0]],
      bat: [[3.14, 1.1, -0.2], [3.14, 1.3, 0.3], [3.14, 1.45, 0.85]],
      ac: [[3.14, 1.75, 0.75], [3.14, 1.75, -0.6], [3.12, 1.6, -1.35]],
      grid: [[3.12, 1.35, -1.5], [3.1, 1.2, -2.15], [3.06, 2.9, -2.3], [4.3, 4.4, -2.42], [5.5, 4.55, -2.5]],
    };
    root.add(add(tube(P.pv), 'inverter', 1, { from: [0.8, 0, 0], explode: [0.8, 0, 0], delay: 0.6, dur: 0.8 }));

    // ---- stage 2: battery stack ----
    for (let i = 0; i < 3; i++) {
      const m = group(
        mesh(geo.rbox(0.22, 0.32, 0.62, 0.03), mat.paint('#e6e4de', 0.5)),
        mesh(geo.box(0.005, 0.02, 0.3), mat.paint('#8c8a84'), [0.112, 0.08, 0]),
      );
      m.position.set(3.13, 0.17 + i * 0.33, -0.2);
      root.add(add(m, 'battery', 2, { from: [0.4, 1.1, 0], explode: [0.9, 0.15 * i, 0], delay: i * 0.25, dur: 0.85 }));
    }
    root.add(add(tube(P.bat, 0.02), 'battery', 2, { from: [0.5, 0, 0], explode: [0.8, 0, 0], delay: 0.9, dur: 0.6 }));

    // ---- stage 3: distribution board + AC cable ----
    const board = group(mesh(geo.rbox(0.12, 0.5, 0.4, 0.02), mat.paint('#b9bcc0', 0.5)), mesh(geo.box(0.01, 0.3, 0.3), mat.paint('#8f9399'), [0.062, 0, 0]));
    board.position.set(3.08, 1.5, -1.45);
    root.add(add(board, 'board', 3, { from: [1.2, 0, 0], explode: [0.7, 0, 0], dur: 0.9 }));
    root.add(add(tube(P.ac, 0.022), 'board', 3, { from: [0.6, 0, 0], explode: [0.7, 0, 0], delay: 0.5, dur: 0.7 }));

    // ---- stage 4: grid connection ----
    const pole = group(
      mesh(geo.cyl(0.11, 0.14, 6, 16), mat.paint('#5b4a3a', 0.85), [0, 3, 0]),
      mesh(geo.box(1.4, 0.1, 0.1), mat.paint('#5b4a3a', 0.85), [0, 5.6, 0]),
      mesh(geo.cyl(0.05, 0.05, 0.16, 10), mat.paint('#e1e1e1', 0.3), [-0.5, 5.73, 0]),
      mesh(geo.cyl(0.05, 0.05, 0.16, 10), mat.paint('#e1e1e1', 0.3), [0.5, 5.73, 0]),
      mesh(geo.cyl(0.28, 0.28, 0.6, 16), mat.paint('#6f7378', 0.5), [0, 4.55, 0.22]),
    );
    pole.position.set(5.5, 0, -2.5);
    root.add(add(pole, 'grid', 4, { from: [0, 2.5, 0], explode: [1.2, 0, 0], dur: 1.1 }));
    const meter = mesh(geo.rbox(0.12, 0.4, 0.3, 0.02), mat.paint('#d4d6d9', 0.4), [3.08, 1.2, -2.2]);
    root.add(add(meter, 'grid', 4, { from: [0.8, 0, 0], explode: [0.8, 0, 0], delay: 0.5, dur: 0.7 }));
    root.add(add(tube(P.grid, 0.018), 'grid', 4, { from: [0, 0.6, 0], explode: [1.0, 0, 0], delay: 0.9, dur: 0.8 }));

    // ---- flow particles + sun (added after framing) ----
    const fx = new THREE.Group();
    const flows = {};
    const makeFlow = (key, pts, color, n = 12) => {
      const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
      const m = new THREE.MeshBasicMaterial({ color, toneMapped: false });
      const dots = Array.from({ length: n }, () => { const s = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), m); s.userData.noClone = true; fx.add(s); return s; });
      flows[key] = { curve, dots, phase: 0 };
    };
    makeFlow('pv', P.pv, DC);
    makeFlow('bat', P.bat, DC, 8);
    makeFlow('ac', P.ac, AC);
    makeFlow('grid', P.grid, AC, 16);
    const ground = mesh(new THREE.CircleGeometry(9, 64), mat.paint('#29251c', 0.95), [0.6, -0.03, 0], [-Math.PI / 2, 0, 0]);
    const sun = mesh(new THREE.SphereGeometry(0.55, 24, 16), new THREE.MeshBasicMaterial({ color: '#ffd27a', toneMapped: false }));

    const sim = options.sim || (options.sim = { hour: 12, playing: false, soc: 0.45, on: { pv: true, inverter: true, battery: true, home: true, grid: true } });
    let last = null;
    let uiTimer = 0;
    let ui = null;
    let stageRef = null;

    function renderExtra(host) {
      host.innerHTML = `
        <div class="solar-ctl">
          <div class="solar-ctl__row">
            <label for="solar-hour">${t('solar.hour')} <b class="solar-hour-val"></b></label>
            <button type="button" class="tb-btn solar-play"></button>
          </div>
          <input id="solar-hour" type="range" min="0" max="24" step="0.25" value="${sim.hour}" class="solar-range">
          <div class="solar-toggles" role="group">
            ${['pv', 'inverter', 'battery', 'home', 'grid'].map((k) => `<label class="switch"><input type="checkbox" data-tg="${k}" ${sim.on[k] ? 'checked' : ''}><span></span>${t(`solar.toggles.${k}`)}</label>`).join('')}
          </div>
          <p class="solar-hint muted">${t('solar.toggleHint')}</p>
          <dl class="solar-readouts">
            <div><dt>${t('solar.readouts.generation')}</dt><dd data-r="gen"></dd></div>
            <div><dt>${t('solar.readouts.load')}</dt><dd data-r="load"></dd></div>
            <div><dt>${t('solar.readouts.battery')}</dt><dd data-r="bat"></dd></div>
            <div><dt>${t('solar.readouts.grid')}</dt><dd data-r="grid"></dd></div>
          </dl>
          <p class="solar-msg" aria-live="polite"></p>
          <p class="solar-legend"><i style="background:${DC}"></i>${t('solar.legendDc')} <i style="background:${AC}"></i>${t('solar.legendAc')}</p>
          <p class="solar-note muted">${t('solar.note')}</p>
        </div>`;
      const q = (s) => host.querySelector(s);
      ui = { host, hour: q('.solar-hour-val'), range: q('#solar-hour'), play: q('.solar-play'), msg: q('.solar-msg'), r: (k) => q(`[data-r="${k}"]`), toggles: host.querySelectorAll('[data-tg]') };
      ui.range.addEventListener('input', () => { sim.hour = Number(ui.range.value); sim.playing = false; recompute(); refreshUI(true); wake(); });
      ui.play.addEventListener('click', () => { sim.playing = !sim.playing; refreshUI(true); wake(); });
      ui.toggles.forEach((cb) => cb.addEventListener('change', () => { sim.on[cb.dataset.tg] = cb.checked; recompute(); refreshUI(true); wake(); }));
      refreshUI(true);
    }
    /** Re-run the energy balance immediately (UI events should not wait for the next frame). */
    function recompute() {
      if (!last) return;
      const inst = last.inst;
      const on = { pv: inst.panels && sim.on.pv, inverter: inst.inverter && sim.on.inverter, battery: inst.battery && sim.on.battery, home: inst.board && sim.on.home, grid: inst.grid && sim.on.grid };
      last = { r: balance(sim.hour, on, sim.soc), inst, on };
    }
    const wake = () => { if (stageRef) stageRef.dirty = true; };
    const kw = (v) => `${formatNumber(Math.abs(v), { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kW`;
    const hhmm = (h) => `${String(Math.floor(h) % 24).padStart(2, '0')}:${String(Math.round((h % 1) * 60) % 60).padStart(2, '0')}`;

    function refreshUI(force) {
      if (!ui || !last) return;
      const { r, inst } = last;
      ui.hour.textContent = hhmm(sim.hour);
      if (force) ui.range.value = String(sim.hour);
      ui.play.textContent = sim.playing ? t('solar.pauseDay') : t('solar.playDay');
      const req = { pv: 'panels', inverter: 'inverter', battery: 'battery', home: 'board', grid: 'grid' };
      ui.toggles.forEach((cb) => { cb.disabled = !inst[req[cb.dataset.tg]]; cb.closest('label').classList.toggle('is-disabled', cb.disabled); });
      ui.r('gen').textContent = r.curtailed > 0.05 && r.gen > 0.05 ? `${kw(r.gen)} · ${t('solar.curtailed')} ${kw(r.curtailed)}` : kw(r.gen);
      ui.r('load').textContent = kw(r.load) + (r.unserved > 0.05 ? ` · ${t('solar.unserved', { kw: formatNumber(r.unserved, { maximumFractionDigits: 1 }) })}` : '');
      const soc = `${Math.round(sim.soc * 100)}% ${t('solar.soc')}`;
      ui.r('bat').textContent = !last.on.battery ? t('solar.off') : r.charge > 0.05 ? `${t('solar.charging')} ${kw(r.charge)} · ${soc}` : r.discharge > 0.05 ? `${t('solar.discharging')} ${kw(r.discharge)} · ${soc}` : `${t('solar.idle')} · ${soc}`;
      ui.r('grid').textContent = !last.on.grid ? t('solar.off') : r.exp > 0.05 ? `${t('solar.exporting')} ${kw(r.exp)}` : r.imp > 0.05 ? `${t('solar.importing')} ${kw(r.imp)}` : t('solar.idle');
      let msg = 'msgNormal';
      if (!last.on.inverter && inst.inverter) msg = 'msgNoInverter';
      else if (!last.on.grid && inst.grid) msg = 'msgNoGrid';
      else if (r.sun <= 0) msg = 'msgNight';
      ui.msg.textContent = t(`solar.${msg}`);
    }

    return {
      root, parts,
      timing: { stageMin: [0, 0, 0, 0, 0] },
      onReady(ctrl) {
        stageRef = ctrl.stage;
        ctrl.stage.scene.add(fx, ground, sun);
        renderExtra(ctrl.panel.extraHost);
        ctrl.panel.onRelabel = () => renderExtra(ctrl.panel.extraHost);
      },
      dispose() { if (ui) ui.host.innerHTML = ''; },
      update(s) {
        if (sim.playing) {
          const dh = s.dt * 1.2;
          sim.hour = (sim.hour + dh) % 24;
        }
        const inst = { panels: s.installed('panels'), inverter: s.installed('inverter'), battery: s.installed('battery'), board: s.installed('board'), grid: s.installed('grid') };
        const on = { pv: inst.panels && sim.on.pv, inverter: inst.inverter && sim.on.inverter, battery: inst.battery && sim.on.battery, home: inst.board && sim.on.home, grid: inst.grid && sim.on.grid };
        const r = balance(sim.hour, on, sim.soc);
        if (sim.playing) sim.soc = Math.min(1, Math.max(0, sim.soc + ((r.charge * 0.95 - r.discharge / 0.95) * s.dt * 1.2) / BATT_KWH));
        last = { r, inst, on };

        // sun & light
        const a = ((sim.hour - 6) / 12) * Math.PI;
        sun.position.set(Math.cos(a) * -11 + 0.5, Math.sin(a) * 9 + 1, 7);
        sun.visible = r.sun > 0;
        const key = stageRef.lights.key;
        key.position.copy(sun.position);
        key.intensity = 0.35 + 2.0 * r.sun;
        // windows reflect the household load actually served
        const served = Math.max(0, r.load - r.unserved);
        windows.forEach((w) => { w.material.emissiveIntensity = on.home ? (r.sun > 0.25 ? 0.15 : 0.5) + served * 0.35 : 0; });

        // flows: [key, power kW, direction]
        const explodeFade = s.explode < 0.05;
        const flowSpec = {
          pv: [r.pvUsed, 1],
          bat: [r.charge > 0.01 ? r.charge : r.discharge, r.charge > 0.01 ? -1 : 1],
          ac: [on.inverter ? Math.max(0, r.pvUsed - r.charge + r.discharge) : 0, 1],
          grid: [r.exp > 0.01 ? r.exp : r.imp, r.exp > 0.01 ? 1 : -1],
        };
        for (const [k2, f] of Object.entries(flows)) {
          const [p, dir] = flowSpec[k2];
          const show = explodeFade && p > 0.03;
          f.phase += s.dt * (0.08 + p * 0.05) * dir;
          f.dots.forEach((d, i) => {
            d.visible = show;
            if (!show) return;
            const u = (((f.phase + i / f.dots.length) % 1) + 1) % 1;
            f.curve.getPointAt(u, d.position);
            d.scale.setScalar(0.6 + Math.min(1, p / 3) * 0.7);
          });
        }
        uiTimer += s.dt;
        if (uiTimer > 0.12) { uiTimer = 0; refreshUI(sim.playing); }
        return true;
      },
    };
  },
};
