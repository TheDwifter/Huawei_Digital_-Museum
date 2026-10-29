// Chapter 2 — illustrative Massive MIMO active antenna unit on a pole. Units: metres.
export default {
  id: 'aau',
  accent: '#55d1ff',
  exposure: 1.1,
  envIntensity: 0.9,
  view: { azimuth: 0.75, polar: 1.32, distance: 0.92, target: [0, 0.05, 0] },
  build(kit, options = {}) {
    const { THREE, mat, geo, mesh, group } = kit;
    const parts = [];
    const add = (object, component, stage, o = {}) => { parts.push({ object, component, stage, ...o }); return object; };
    const root = new THREE.Group();
    const W = 0.45, H = 0.82, CY = 1.05;

    // ---- stage 0: pole & brackets ----
    const galv = mat.metal('#9aa3ab', 0.45);
    const pole = mesh(geo.cyl(0.045, 0.045, 1.75, 28), galv, [0, 0.875, -0.27]);
    root.add(add(pole, 'pole', 0, { from: [0, 0.8, 0], dur: 1.0 }));
    const base = mesh(geo.cyl(0.14, 0.16, 0.04, 32), mat.paint('#4a5058'), [0, 0.02, -0.27]);
    root.add(add(base, 'pole', 0, { from: [0, 0.3, 0], delay: 0, dur: 0.6 }));
    [CY + 0.26, CY - 0.26].forEach((y, i) => {
      const clamp = group(
        mesh(new THREE.TorusGeometry(0.052, 0.012, 10, 24, Math.PI), galv, [0, 0, 0], [-Math.PI / 2, 0, 0]),
        mesh(geo.box(0.16, 0.04, 0.012), galv, [0, 0, 0.055]),
        mesh(geo.box(0.04, 0.04, 0.17), galv, [0, 0, 0.14]),
      );
      clamp.position.set(0, y, -0.27);
      root.add(add(clamp, 'pole', 0, { from: [0.45, 0, 0], explode: [0, 0, -0.12], delay: 0.6 + i * 0.2, dur: 0.8 }));
    });

    // ---- stage 1: rear housing + fins ----
    const alu = mat.paint('#dfe3e7', 0.42);
    const finMat = mat.brushed('#c3c9cf');
    const finGeo = [];
    for (let i = 0; i < 15; i++) finGeo.push(geo.translated(geo.box(0.006, H - 0.08, 0.05), -W / 2 + 0.03 + i * ((W - 0.06) / 14), 0, -0.025));
    const housing = group(
      mesh(geo.rbox(W, H, 0.06, 0.012), alu, [0, 0, 0]),
      mesh(geo.merge(finGeo), finMat, [0, 0, -0.03]),
    );
    housing.position.set(0, CY, -0.06);
    root.add(add(housing, 'housing', 1, { from: [0, 0, -0.7], explode: [0, 0, -0.35], dur: 1.2 }));

    // ---- stage 2: transceiver boards ----
    const pcb = mat.textured(kit.tex.pcb('#0e2a3a', 21), { roughness: 0.55 });
    const chip = mat.plastic('#0d0f12', 0.5);
    const shield = mat.metal('#b9c0c7', 0.35);
    for (let i = 0; i < 4; i++) {
      const b = group(mesh(geo.box(W - 0.05, 0.17, 0.006), pcb));
      for (let c = 0; c < 6; c++) b.add(mesh(geo.box(0.035, 0.035, 0.008), c % 2 ? chip : shield, [-0.15 + c * 0.06, 0.02, 0.006]));
      b.add(mesh(geo.box(0.32, 0.012, 0.01), shield, [0, -0.06, 0.007]));
      b.position.set(0, CY - 0.29 + i * 0.193, -0.022);
      root.add(add(b, 'transceivers', 2, { from: [0, 0, 0.55], explode: [0, 0, 0.12 + i * 0.0], delay: i * 0.22, dur: 0.85 }));
    }

    // ---- stage 3: reflector & calibration ----
    const reflector = group(
      mesh(geo.box(W - 0.02, H - 0.02, 0.004), mat.metal('#c8cdd2', 0.3)),
      mesh(geo.box(0.05, H - 0.1, 0.004), mat.textured(kit.tex.pcb('#173a2a', 5)), [W / 2 - 0.05, 0, 0.003]),
    );
    reflector.position.set(0, CY, -0.006);
    root.add(add(reflector, 'reflector', 3, { from: [0, 0, 0.5], explode: [0, 0, 0.25], dur: 1.0 }));

    // ---- stage 4: antenna elements (12 rows × 8) ----
    const elMat = mat.brushed('#e6e9ec');
    const rows = 12, cols = 8, dx = 0.05, dy = 0.062;
    const elementGeo = (x, y) => [
      geo.translated(new THREE.BoxGeometry(0.036, 0.005, 0.003).rotateZ(Math.PI / 4), x, y, 0.03),
      geo.translated(new THREE.BoxGeometry(0.036, 0.005, 0.003).rotateZ(-Math.PI / 4), x, y, 0.03),
      geo.translated(new THREE.CylinderGeometry(0.003, 0.004, 0.026, 8).rotateX(Math.PI / 2), x, y, 0.016),
    ];
    for (let r = 0; r < rows; r++) {
      const list = [];
      for (let c = 0; c < cols; c++) list.push(...elementGeo(-((cols - 1) * dx) / 2 + c * dx, 0));
      const row = mesh(geo.merge(list), elMat, [0, CY - ((rows - 1) * dy) / 2 + r * dy, -0.004]);
      root.add(add(row, 'elements', 4, { from: [0, 0, 0.35], explode: [0, 0, 0.42], delay: r * 0.09, dur: 0.6 }));
    }

    // ---- stage 5: radome ----
    const radomeMat = new THREE.MeshPhysicalMaterial({ color: '#eef1f4', roughness: 0.55, metalness: 0, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false });
    const radome = mesh(geo.rbox(W + 0.02, H + 0.02, 0.06, 0.018, 4), radomeMat, [0, CY, 0.022]);
    radome.renderOrder = 2;
    root.add(add(radome, 'radome', 5, { from: [0, 0, 0.6], explode: [0, 0, 0.62], dur: 1.1 }));
    const statusLed = mesh(geo.box(0.02, 0.008, 0.004), mat.led('#55d1ff'), [0, CY - H / 2 + 0.03, 0.054]);
    root.add(add(statusLed, 'radome', 5, { from: [0, 0, 0.6], explode: [0, 0, 0.62], dur: 1.1 }));

    // ---- beams (effect, added after framing so they do not affect bounds) ----
    const beams = [];
    const beamGroup = new THREE.Group();
    beamGroup.position.set(0, CY, 0.06);
    const beamColors = ['#55d1ff', '#8affc1', '#b48cff'];
    const alpha = new THREE.CanvasTexture((() => {
      const c = document.createElement('canvas'); c.width = 4; c.height = 128;
      const g2 = c.getContext('2d'); const gr = g2.createLinearGradient(0, 0, 0, 128);
      gr.addColorStop(0, '#fff'); gr.addColorStop(1, '#000'); g2.fillStyle = gr; g2.fillRect(0, 0, 4, 128);
      return c;
    })());
    beamColors.forEach((c) => {
      const g = new THREE.ConeGeometry(0.13, 1.3, 32, 1, true);
      g.translate(0, -0.65, 0);
      g.rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: c, alphaMap: alpha, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      beams.push(m);
      beamGroup.add(m);
    });

    return {
      root, parts,
      timing: { stageMin: [0, 0, 0, 0, 0, 2.8] },
      onReady(ctrl) { if (options.beams !== false) ctrl.stage.scene.add(beamGroup); },
      update(s) {
        const st = s.assembly.stages[5];
        const p = Math.min(1, Math.max(0, (s.t - st.start - 1.1) / 1.2));
        statusLed.material.emissiveIntensity = p * 2.5;
        const on = p * (1 - Math.min(1, s.explode * 3));
        beams.forEach((b, i) => {
          b.material.opacity = 0.42 * on;
          b.visible = on > 0.01;
          const ph = s.elapsed * 0.6 + i * 2.1;
          b.rotation.set(Math.sin(ph * 0.8) * 0.15 - 0.12, -0.55 + Math.sin(ph) * 0.3 + (i - 1) * 0.42, 0);
        });
        return on > 0.01 || (p > 0 && p < 1);
      },
    };
  },
};
