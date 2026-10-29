// Chapter 5 — illustrative 42U data-centre rack. Units: metres.
export default {
  id: 'rack',
  accent: '#1c64d8',
  exposure: 1.05,
  view: { azimuth: -0.6, polar: 1.3, distance: 0.98 },
  build(kit) {
    const { THREE, mat, geo, mesh, group } = kit;
    const parts = [];
    const add = (object, component, stage, o = {}) => { parts.push({ object, component, stage, ...o }); return object; };
    const root = new THREE.Group();
    const U = 0.0445;
    const Y0 = 0.1;
    const uy = (u, n) => Y0 + (u - 1) * U + (n * U) / 2; // centre of an n-U device starting at slot u
    const black = mat.paint('#1b1d21', 0.45);

    // ---- stage 0: rack frame ----
    const base = mesh(geo.box(0.6, 0.06, 1.0), black, [0, 0.03, 0]);
    root.add(add(base, 'rack', 0, { from: [0, 0.4, 0], dur: 0.7 }));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz], i) => {
      root.add(add(mesh(geo.box(0.04, 1.94, 0.04), black, [sx * 0.28, 1.03, sz * 0.48]), 'rack', 0, { from: [0, 1.1, 0], delay: 0.3 + i * 0.1, dur: 0.8 }));
    });
    root.add(add(mesh(geo.box(0.6, 0.05, 1.0), black, [0, 2.02, 0]), 'rack', 0, { from: [0, 0.6, 0], delay: 0.8, dur: 0.8 }));
    const railTex = kit.tex.vents('#3a3d43', '#0d0e10', 'rail');
    const railMat = mat.textured(railTex, { metalness: 0.6, roughness: 0.4 });
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([sx, sz], i) => {
      root.add(add(mesh(geo.box(0.02, 1.9, 0.03), railMat, [sx * 0.245, 1.03, sz * 0.44]), 'rack', 0, { from: [0, 0, sz * 0.5], delay: 1.0 + i * 0.08, dur: 0.6 }));
    });

    // ---- stage 1: PDUs ----
    [-1, 1].forEach((sx, i) => {
      const pdu = group(mesh(geo.box(0.05, 1.7, 0.05), mat.paint('#2b2e34', 0.4)));
      for (let k = 0; k < 14; k++) pdu.add(mesh(geo.box(0.03, 0.04, 0.006), mat.plastic('#0b0b0c'), [0, -0.78 + k * 0.12, 0.028]));
      const led = mesh(geo.box(0.02, 0.008, 0.004), mat.led(i ? '#ffb347' : '#5be08f'), [0, 0.8, 0.028]);
      pdu.add(led);
      pdu.userData.led = led;
      pdu.position.set(sx * 0.2, 1.03, -0.455);
      pdu.rotation.y = Math.PI;
      root.add(add(pdu, 'pdu', 1, { from: [0, 0, -0.7], explode: [sx * 0.15, 0, -0.35], delay: i * 0.3, dur: 0.9 }));
    });

    const leds = [];
    const chassis = kit.mat.brushed('#cfd3d9');
    chassis.metalness = 0.55;
    const frontBox = (w, h, d, frontMat) => new THREE.Mesh(geo.box(w, h, d), [chassis, chassis, chassis, chassis, frontMat, chassis]);

    // ---- stage 2: top-of-rack switches ----
    const portTex = kit.tex.driveBays('#24272c', 24, 2);
    [39, 40].forEach((u, i) => {
      const sw = group(frontBox(0.48, U * 0.95, 0.5, mat.textured(portTex, { roughness: 0.5 })));
      for (let k = 0; k < 4; k++) { const l = mesh(geo.box(0.006, 0.006, 0.004), mat.led('#5be08f'), [-0.22 + k * 0.01, 0.012, 0.252]); sw.add(l); leds.push(l); }
      sw.position.set(0, uy(u, 1), 0.23);
      root.add(add(sw, 'switches', 2, { from: [0, 0, 0.8], explode: [0, 0.08 * (i + 1), 0.5], delay: i * 0.3, dur: 0.9 }));
    });

    // ---- stage 3: compute servers (10 × 2U) ----
    const bezel = mat.textured(kit.tex.serverFront('#d6dbe1'), { roughness: 0.45, metalness: 0.3 });
    const servers = [];
    for (let i = 0; i < 10; i++) {
      const u = 31 - i * 2;
      const s = group(frontBox(0.48, U * 2 * 0.96, 0.8, bezel));
      const l1 = mesh(geo.box(0.008, 0.008, 0.004), mat.led('#5be08f'), [0.2, 0.025, 0.402]);
      const l2 = mesh(geo.box(0.008, 0.008, 0.004), mat.led('#4aa3ff'), [0.215, 0.025, 0.402]);
      s.add(l1, l2); leds.push(l1, l2);
      s.position.set(0, uy(u, 2), 0.08);
      servers.push(s);
      root.add(add(s, 'servers', 3, { from: [0, 0, 1.0], explode: [0, (i - 4.5) * 0.02, 0.55], delay: i * 0.17, dur: 0.85 }));
    }

    // ---- stage 4: storage (2 × 4U) ----
    const bays = mat.textured(kit.tex.driveBays('#2a2e35', 6, 3), { roughness: 0.5 });
    [6, 2].forEach((u, i) => {
      const st = group(frontBox(0.48, U * 4 * 0.97, 0.85, bays));
      const l = mesh(geo.box(0.01, 0.01, 0.004), mat.led('#5be08f'), [0.21, 0.07, 0.427]);
      st.add(l); leds.push(l);
      st.position.set(0, uy(u, 4), 0.055);
      root.add(add(st, 'storage', 4, { from: [0, 0, 1.0], explode: [0, -0.04 * (i + 1), 0.45], delay: i * 0.35, dur: 1.0 }));
    });

    // ---- stage 5: cabling + power on ----
    const cableMats = [mat.plastic('#2f7bf2', 0.4), mat.plastic('#f2c230', 0.4)];
    const cables = [];
    servers.forEach((s, i) => {
      const y0 = uy(39, 1);
      const y1 = s.position.y;
      const x = 0.12 + (i % 5) * 0.018;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.2 + i * 0.02, y0, 0.485), new THREE.Vector3(-0.2 + i * 0.02, y0 - 0.02, 0.53),
        new THREE.Vector3(0.265, y0 - 0.06, 0.53), new THREE.Vector3(0.265, y1 + 0.02, 0.53), new THREE.Vector3(x, y1, 0.49),
      ], false, 'catmullrom', 0.2);
      const c = mesh(new THREE.TubeGeometry(curve, 48, 0.0035, 6), cableMats[i % 2]);
      cables.push(c);
      root.add(add(c, 'cabling', 5, { from: [0, 0, 0.25], explode: [0.25, 0, 0.6], delay: i * 0.08, dur: 0.7 }));
    });

    root.updateMatrixWorld(true);
    const ledY = (l) => l.getWorldPosition(new THREE.Vector3()).y;
    leds.sort((a, b) => ledY(b) - ledY(a));
    const pduLeds = [];
    root.traverse((o) => { if (o.userData.led && o.userData.led.isMesh) pduLeds.push(o.userData.led); });

    return {
      root, parts,
      timing: { stageMin: [0, 0, 0, 0, 0, 3.2] },
      update(s) {
        const st = s.assembly.stages[5];
        const pt = s.t - st.start - 1.2;
        const pduOn = s.installed('pdu') ? 1 : 0;
        pduLeds.forEach((l) => { l.material.emissiveIntensity = 2 * pduOn; });
        const n = leds.length;
        leds.forEach((l, i) => {
          let v = Math.min(1, Math.max(0, (pt - (i / n) * 1.6) * 4));
          if (s.complete && i % 3 === 0) v *= Math.sin(s.elapsed * 9 + i * 2.3) > -0.2 ? 1 : 0.15;
          l.material.emissiveIntensity = v * 2.4;
        });
        return s.complete || (pt > 0 && pt < 2);
      },
    };
  },
};
