// Chapter 1 — illustrative early-1990s digital switching cabinet. Units: metres.
export default {
  id: 'switch',
  accent: '#c8742f',
  exposure: 1.05,
  view: { azimuth: -0.62, polar: 1.28, distance: 1.16 },
  build(kit) {
    const { THREE, mat, geo, mesh, group } = kit;
    const parts = [];
    const add = (object, component, stage, o = {}) => { parts.push({ object, component, stage, ...o }); return object; };
    const root = new THREE.Group();

    const W = 0.6, D = 0.6, H = 2.0;
    const steel = mat.paint('#c9c4b8', 0.5);
    const darkSteel = mat.paint('#3b3a37', 0.45);
    const rail = mat.metal('#a7a9ab', 0.38);

    // ---- stage 0: frame ----
    const base = mesh(geo.box(W, 0.08, D), darkSteel, [0, 0.04, 0]);
    root.add(add(base, 'frame', 0, { from: [0, 0.5, 0] }));
    const postGeo = geo.box(0.04, 1.86, 0.04);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz], i) => {
      const p = mesh(postGeo, steel, [sx * (W / 2 - 0.02), 0.08 + 0.93, sz * (D / 2 - 0.02)]);
      root.add(add(p, 'frame', 0, { from: [0, 1.1, 0], delay: 0.35 + i * 0.1, dur: 0.9 }));
    });
    const cap = mesh(geo.box(W, 0.04, D), steel, [0, 1.96, 0]);
    root.add(add(cap, 'frame', 0, { from: [0, 0.7, 0], delay: 0.95, dur: 0.9 }));
    // front mounting rails
    [-1, 1].forEach((sx, i) => {
      const r = mesh(geo.box(0.02, 1.84, 0.012), rail, [sx * 0.262, 1.0, 0.262]);
      root.add(add(r, 'frame', 0, { from: [0, 0, 0.5], delay: 1.2 + i * 0.1, dur: 0.8 }));
    });

    // ---- stage 1: backplane + shelves ----
    const backplane = mesh(geo.box(0.5, 1.72, 0.018), mat.textured(kit.tex.pcb('#123329', 3), { roughness: 0.6 }), [0, 1.0, -0.245]);
    root.add(add(backplane, 'backplane', 1, { from: [0, 0, -0.9], explode: [0, 0, -0.5], dur: 1.1 }));

    const shelves = [
      { y0: 0.12, h: 0.24, kind: 'power' },
      { y0: 0.4, h: 0.32, kind: 'line' },
      { y0: 0.76, h: 0.32, kind: 'line' },
      { y0: 1.12, h: 0.32, kind: 'line' },
      { y0: 1.48, h: 0.34, kind: 'switch' },
    ];
    const cageMat = mat.metal('#8e9296', 0.45);
    shelves.forEach((s, i) => {
      const yc = s.y0 + s.h / 2;
      const g = geo.merge([
        geo.translated(geo.box(0.52, 0.01, 0.48), 0, -s.h / 2 + 0.005, 0),
        geo.translated(geo.box(0.52, 0.01, 0.48), 0, s.h / 2 - 0.005, 0),
        geo.translated(geo.box(0.01, s.h, 0.48), -0.255, 0, 0),
        geo.translated(geo.box(0.01, s.h, 0.48), 0.255, 0, 0),
      ]);
      const cage = mesh(g, cageMat, [0, yc, 0.01]);
      root.add(add(cage, 'subracks', 1, { from: [0, 0, 0.8], explode: [0, 0, 0.18], delay: 0.5 + i * 0.16, dur: 0.9 }));
      s.yc = yc;
    });

    // ---- cards ----
    const leds = [];
    const cardPcb = mat.textured(kit.tex.pcb('#173a2e', 11), { roughness: 0.6 });
    const facePlate = { line: mat.paint('#d8d3c6', 0.5), switch: mat.paint('#3a3936', 0.45), ctrl: mat.paint('#7d2a1d', 0.5) };
    const handle = mat.plastic('#202022');
    const makeCard = (h, face, ledCount, ledColor) => {
      const g = group(
        mesh(geo.box(0.003, h - 0.03, 0.42), cardPcb, [0, 0, -0.01]),
        mesh(geo.box(0.03, h - 0.018, 0.012), face, [0, 0, 0.21]),
        mesh(geo.box(0.012, 0.03, 0.02), handle, [0, -(h / 2) + 0.03, 0.225]),
        mesh(geo.box(0.012, 0.03, 0.02), handle, [0, h / 2 - 0.03, 0.225]),
      );
      // a few chips on the card
      for (let c = 0; c < 3; c++) g.add(mesh(geo.box(0.006, 0.03, 0.04), mat.plastic('#111'), [0.004, -h / 4 + c * (h / 4), -0.05 + c * 0.04]));
      for (let l = 0; l < ledCount; l++) {
        const led = mesh(geo.box(0.008, 0.008, 0.004), mat.led(ledColor), [0, h / 2 - 0.06 - l * 0.016, 0.218]);
        g.add(led);
        leds.push(led);
      }
      return g;
    };

    let cardIndex = 0;
    shelves.filter((s) => s.kind === 'line').forEach((s) => {
      for (let i = 0; i < 14; i++) {
        const c = makeCard(s.h, facePlate.line, 1, '#3be37f');
        c.position.set(-0.221 + i * 0.034, s.yc, 0.02);
        c.userData.order = cardIndex++;
        root.add(add(c, 'linecards', 2, { from: [0, 0, 0.6], explode: [0, 0, 0.42], delay: cardIndex * 0.04, dur: 0.6 }));
      }
    });
    const sw = shelves.find((s) => s.kind === 'switch');
    for (let i = 0; i < 12; i++) {
      const ctrl = i < 2;
      const c = makeCard(sw.h, ctrl ? facePlate.ctrl : facePlate.switch, ctrl ? 4 : 3, ctrl ? '#ffb347' : '#3be37f');
      c.position.set(-0.221 + i * 0.0402, sw.yc, 0.02);
      c.userData.order = cardIndex++;
      root.add(add(c, 'switching', 3, { from: [0, 0, 0.6], explode: [0, 0.12, 0.42], delay: i * 0.12, dur: 0.75 }));
    }

    // ---- stage 4: power + cabling ----
    const ps = shelves.find((s) => s.kind === 'power');
    const vent = mat.textured(kit.tex.vents('#4a4945', '#151515', 'psu'), { metalness: 0.3, roughness: 0.6 });
    for (let i = 0; i < 4; i++) {
      const psu = group(
        mesh(geo.box(0.118, ps.h - 0.03, 0.42), mat.paint('#5a5955', 0.5)),
        mesh(geo.box(0.112, ps.h - 0.05, 0.004), vent, [0, 0, 0.212]),
      );
      const led = mesh(geo.box(0.01, 0.01, 0.004), mat.led('#3be37f'), [0.04, ps.h / 2 - 0.035, 0.216]);
      psu.add(led); leds.push(led);
      psu.position.set(-0.188 + i * 0.125, ps.yc, 0.02);
      root.add(add(psu, 'power', 4, { from: [0, 0, 0.6], explode: [0, 0, 0.45], delay: i * 0.15, dur: 0.8 }));
    }
    const trough = group(
      mesh(geo.box(W, 0.012, 0.26), darkSteel, [0, 0, 0]),
      mesh(geo.box(W, 0.07, 0.012), darkSteel, [0, 0.035, -0.125]),
      mesh(geo.box(W, 0.07, 0.012), darkSteel, [0, 0.035, 0.125]),
    );
    trough.position.set(0, 2.0, -0.12);
    root.add(add(trough, 'cabling', 4, { from: [0, 0.5, 0], explode: [0, 0.35, 0], delay: 0.5, dur: 0.9 }));
    const cableMat = [mat.plastic('#6f7f8f', 0.5), mat.plastic('#c9c3b3', 0.55), mat.plastic('#3a4a6a', 0.5)];
    for (let i = 0; i < 6; i++) {
      const x = -0.22 + i * 0.088;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(x, 2.03, -0.12), new THREE.Vector3(x, 2.03, -0.2), new THREE.Vector3(x, 1.92, -0.27), new THREE.Vector3(x, 1.7, -0.275),
      ]);
      const cable = mesh(new THREE.TubeGeometry(curve, 24, 0.012, 8), cableMat[i % 3]);
      root.add(add(cable, 'cabling', 4, { from: [0, 0.5, 0], explode: [0, 0.35, 0], delay: 0.8 + i * 0.08, dur: 0.8 }));
    }

    // ---- stage 5: side panels + power on ----
    [-1, 1].forEach((sx, i) => {
      const panel = mesh(geo.box(0.012, 1.88, D - 0.01), steel, [sx * (W / 2 + 0.006), 1.02, 0]);
      root.add(add(panel, 'panels', 5, { from: [sx * 0.7, 0, 0], explode: [sx * 0.45, 0, 0], delay: i * 0.2, dur: 1.0 }));
    });
    const plate = mesh(geo.box(0.36, 0.05, 0.004), mat.textured(kit.tex.label('DIGITAL EXCHANGE · 1993', { bg: '#2c2b28', fg: '#d9c9a8', w: 512, h: 64 })), [0, 1.885, 0.272]);
    root.add(add(plate, 'panels', 5, { from: [0, 0, 0.3], delay: 0.4, dur: 0.8 }));

    root.updateMatrixWorld(true);
    leds.sort((a, b) => b.getWorldPosition(new THREE.Vector3()).y - a.getWorldPosition(new THREE.Vector3()).y);

    return {
      root,
      parts,
      timing: { stageMin: [0, 0, 0, 0, 0, 3.4] },
      update(s) {
        const st = s.assembly.stages[5];
        const powerT = s.t - (st.start + 1.0);
        const n = leds.length;
        leds.forEach((led, i) => {
          const on = powerT - (i / n) * 1.8;
          let v = on <= 0 ? 0 : Math.min(1, on * 4);
          if (s.complete && v >= 1 && (i % 5 === 2)) v = 0.35 + 0.65 * (Math.sin(s.elapsed * 6 + i * 1.7) > 0 ? 1 : 0);
          led.material.emissiveIntensity = v * 2.4;
        });
        return s.complete;
      },
    };
  },
};
