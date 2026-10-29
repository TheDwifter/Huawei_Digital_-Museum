// Chapter 4 — illustrative wall-mounted string inverter. Units: metres.
export default {
  id: 'inverter',
  accent: '#f2b134',
  exposure: 1.05,
  view: { azimuth: -0.55, polar: 1.2, distance: 1.22 },
  build(kit) {
    const { THREE, mat, geo, mesh, group } = kit;
    const parts = [];
    const add = (object, component, stage, o = {}) => { parts.push({ object, component, stage, ...o }); return object; };
    const root = new THREE.Group();
    const W = 0.5, H = 0.42, CY = 0.32;
    root.position.y = 0;

    // ---- stage 0: bracket + housing ----
    const bracket = group(
      mesh(geo.box(0.36, 0.3, 0.006), mat.metal('#8d939a', 0.4)),
      mesh(geo.box(0.36, 0.02, 0.03), mat.metal('#8d939a', 0.4), [0, 0.14, 0.012]),
    );
    bracket.position.set(0, CY, -0.098);
    root.add(add(bracket, 'bracket', 0, { from: [0, 0, -0.4], explode: [0, 0, -0.18], dur: 0.9 }));

    const shellMat = mat.paint('#e9e7e1', 0.5);
    const finMat = mat.brushed('#cfd2d5');
    const fins = [];
    for (let s of [-1, 1]) for (let k = 0; k < 7; k++) fins.push(geo.translated(geo.box(0.004, H - 0.05, 0.11), s * (W / 2 + 0.008 + k * 0.011), 0, -0.012));
    const housing = group(
      mesh(geo.box(W, H, 0.01), shellMat, [0, 0, -0.075]),
      mesh(geo.box(0.01, H, 0.12), shellMat, [-W / 2 + 0.005, 0, -0.015]),
      mesh(geo.box(0.01, H, 0.12), shellMat, [W / 2 - 0.005, 0, -0.015]),
      mesh(geo.box(W, 0.01, 0.12), shellMat, [0, H / 2 - 0.005, -0.015]),
      mesh(geo.box(W, 0.01, 0.12), shellMat, [0, -H / 2 + 0.005, -0.015]),
      mesh(geo.merge(fins), finMat),
    );
    housing.position.set(0, CY, 0);
    root.add(add(housing, 'housing', 0, { from: [0, 0.35, 0], path: 'lift', delay: 0.6, dur: 1.2 }));

    // ---- stage 1: power stage ----
    const pcb = mat.textured(kit.tex.pcb('#123a2c', 41), { roughness: 0.55 });
    const powerBoard = group(mesh(geo.box(W - 0.04, H - 0.06, 0.003), pcb, [0, 0, -0.064]));
    for (let i = 0; i < 4; i++) {
      const mod = group(
        mesh(geo.box(0.06, 0.04, 0.012), mat.plastic('#141518', 0.45)),
        mesh(geo.box(0.05, 0.03, 0.002), mat.metal('#a9aeb4', 0.3), [0, 0, 0.007]),
      );
      mod.position.set(-0.17 + i * 0.075, -0.12, -0.056);
      powerBoard.add(mod);
    }
    powerBoard.position.set(0, CY, 0);
    root.add(add(powerBoard, 'powerstage', 1, { from: [0, 0, 0.45], explode: [0, 0, 0.06], dur: 1.0 }));

    // ---- stage 2: capacitors + inductors ----
    const capSleeve = mat.paint('#2c4f7a', 0.4);
    const capTop = mat.metal('#c7cbd0', 0.3);
    for (let i = 0; i < 6; i++) {
      const cap = group(
        mesh(geo.cyl(0.016, 0.016, 0.05, 24).rotateX(Math.PI / 2), capSleeve),
        mesh(geo.cyl(0.0155, 0.0155, 0.002, 24).rotateX(Math.PI / 2), capTop, [0, 0, 0.026]),
      );
      cap.position.set(-0.19 + (i % 3) * 0.04, CY - 0.04 + Math.floor(i / 3) * 0.038, -0.037);
      root.add(add(cap, 'capacitors', 2, { from: [0, 0, 0.35], explode: [0, 0, 0.14], delay: i * 0.1, dur: 0.7 }));
    }
    const copper = mat.copper();
    for (let i = 0; i < 3; i++) {
      const tor = mesh(new THREE.TorusGeometry(0.026, 0.011, 14, 36), copper, [0.07 + i * 0.062, CY + 0.06, -0.05]);
      root.add(add(tor, 'inductors', 2, { from: [0, 0, 0.35], explode: [0, 0, 0.14], delay: 0.7 + i * 0.12, dur: 0.7 }));
    }
    const boost = group(
      mesh(geo.box(0.06, 0.05, 0.035), mat.plastic('#2a2b2e', 0.6)),
      mesh(geo.cyl(0.022, 0.022, 0.03, 24).rotateZ(Math.PI / 2), copper, [0, 0, 0.004]),
    );
    boost.position.set(0.17, CY - 0.05, -0.045);
    root.add(add(boost, 'inductors', 2, { from: [0, 0, 0.35], explode: [0, 0, 0.14], delay: 1.1, dur: 0.7 }));

    // ---- stage 3: control board ----
    const ctrl = group(mesh(geo.box(0.2, 0.12, 0.002), mat.textured(kit.tex.pcb('#1b2f4d', 9))));
    for (let i = 0; i < 4; i++) ctrl.add(mesh(geo.cyl(0.003, 0.003, 0.04, 8).rotateX(Math.PI / 2), mat.metal('#bfc4c9'), [(i % 2 ? 0.09 : -0.09), (i < 2 ? 0.05 : -0.05), -0.021]));
    ctrl.add(mesh(geo.box(0.03, 0.03, 0.004), mat.plastic('#0f1012', 0.4), [-0.04, 0.01, 0.003]));
    ctrl.add(mesh(geo.box(0.018, 0.018, 0.003), mat.plastic('#0f1012', 0.4), [0.03, 0.02, 0.003]));
    ctrl.add(mesh(geo.box(0.04, 0.012, 0.006), mat.paint('#e8e2d4', 0.5), [0.05, -0.04, 0.004]));
    ctrl.position.set(-0.09, CY + 0.1, 0.002);
    root.add(add(ctrl, 'control', 3, { from: [0, 0, 0.35], explode: [0, 0, 0.22], dur: 1.0 }));

    // ---- stage 4: connectors ----
    const conn = mat.plastic('#18191c', 0.5);
    const connectors = [];
    for (let i = 0; i < 4; i++) {
      const c = mesh(geo.cyl(0.009, 0.009, 0.04, 16), conn, [-0.17 + i * 0.03, CY - H / 2 - 0.02, -0.01]);
      connectors.push(c);
    }
    const ac = mesh(geo.cyl(0.018, 0.018, 0.045, 24), mat.plastic('#202125', 0.5), [0.12, CY - H / 2 - 0.022, -0.01]);
    const com = mesh(geo.cyl(0.011, 0.011, 0.035, 16), mat.plastic('#3a3c41', 0.5), [0.18, CY - H / 2 - 0.018, -0.01]);
    [...connectors, ac, com].forEach((c, i) => root.add(add(c, 'terminals', 4, { from: [0, -0.25, 0], explode: [0, -0.1, 0], delay: i * 0.12, dur: 0.7 })));

    // ---- stage 5: front cover + indicators ----
    const cover = group(
      mesh(geo.rbox(W + 0.004, H + 0.004, 0.034, 0.012), mat.paint('#f2f1ed', 0.45)),
      mesh(geo.box(0.16, 0.006, 0.002), mat.paint('#c9c6bd', 0.5), [0, -H / 2 + 0.05, 0.018]),
    );
    const leds = [0, 1, 2].map((i) => {
      const l = mesh(geo.rbox(0.03, 0.006, 0.004, 0.002), mat.led('#5be08f'), [-0.04 + i * 0.04, -H / 2 + 0.09, 0.018]);
      cover.add(l);
      return l;
    });
    cover.position.set(0, CY, 0.062);
    root.add(add(cover, 'cover', 5, { from: [0, 0, 0.5], explode: [0.42, 0, 0.3], dur: 1.1 }));

    return {
      root, parts,
      timing: { stageMin: [0, 0, 0, 0, 0, 2.6] },
      update(s) {
        const st = s.assembly.stages[5];
        const p = s.t - st.start - 1.1;
        leds.forEach((l, i) => {
          let v = Math.min(1, Math.max(0, (p - i * 0.45) * 3));
          if (s.complete && i === 2) v = 0.5 + 0.5 * Math.sin(s.elapsed * 3);
          l.material.emissiveIntensity = v * 2.2;
        });
        return s.complete;
      },
    };
  },
};
