// Chapter 6 — illustrative eight-accelerator AI training server (lid removed). Units: metres.
export default {
  id: 'ai',
  accent: '#ff3b44',
  exposure: 1.0,
  view: { azimuth: -0.72, polar: 0.98, distance: 1.12, maxPolar: Math.PI * 0.55 },
  build(kit) {
    const { THREE, mat, geo, mesh, group } = kit;
    const parts = [];
    const add = (object, component, stage, o = {}) => { parts.push({ object, component, stage, ...o }); return object; };
    const root = new THREE.Group();
    const W = 0.45, D = 0.86, H = 0.18;

    // ---- stage 0: chassis + accelerator baseboard ----
    const steel = mat.metal('#5d636b', 0.4);
    const chassis = group(
      mesh(geo.box(W, 0.004, D), steel, [0, 0.002, 0]),
      mesh(geo.box(0.004, H, D), steel, [-W / 2, H / 2, 0]),
      mesh(geo.box(0.004, H, D), steel, [W / 2, H / 2, 0]),
      mesh(geo.box(W, H, 0.004), steel, [0, H / 2, -D / 2]),
      mesh(geo.box(W, 0.12, 0.008), mat.textured(kit.tex.vents('#26282d', '#08090a', 'aivent'), { metalness: 0.5, roughness: 0.4 }), [0, 0.06, D / 2]),
    );
    root.add(add(chassis, 'chassis', 0, { from: [0, -0.25, 0], explode: [0, -0.08, 0], dur: 1.0 }));
    const npuBoard = group(mesh(geo.box(W - 0.02, 0.003, 0.4), mat.textured(kit.tex.pcb('#0c1a17', 51), { roughness: 0.5 })));
    npuBoard.position.set(0, 0.011, 0.14);
    // high-speed links between accelerators (glow on power-up)
    const links = [];
    const linkMat = () => mat.led('#ff3b44');
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
      const l = mesh(geo.box(0.02, 0.0015, 0.004), linkMat(), [-0.1 + c * 0.1, 0.002, -0.08 + r * 0.16]);
      npuBoard.add(l); links.push(l);
    }
    for (let c = 0; c < 4; c++) {
      const l = mesh(geo.box(0.004, 0.0015, 0.08), linkMat(), [-0.15 + c * 0.1, 0.002, 0]);
      npuBoard.add(l); links.push(l);
    }
    root.add(add(npuBoard, 'baseboard', 0, { from: [0, 0.3, 0], explode: [0, 0, 0], delay: 0.6, dur: 1.0 }));

    // ---- stage 1: NPU packages (substrate + die), stage 2: HBM ----
    const pos = [];
    for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) pos.push([-0.15 + c * 0.1, 0.06 + r * 0.16]);
    const dies = [];
    const hbmMat = mat.metal('#8e949c', 0.3);
    pos.forEach(([x, z], i) => {
      const dieMat = new THREE.MeshPhysicalMaterial({ color: '#1a1c22', metalness: 0.6, roughness: 0.12, clearcoat: 1, emissive: new THREE.Color('#ff2a36'), emissiveIntensity: 0 });
      dieMat.userData.led = true;
      const die = mesh(geo.box(0.032, 0.002, 0.032), dieMat, [0, 0.0035, 0]);
      dies.push(die);
      const pkg = group(mesh(geo.box(0.07, 0.004, 0.07), mat.textured(kit.tex.pcb('#12241c', 60 + i), { roughness: 0.5 })), die);
      pkg.position.set(x, 0.0145, z);
      root.add(add(pkg, 'npu', 1, { from: [0, 0.22, 0], explode: [0, 0.035, 0], delay: i * 0.14, dur: 0.75 }));
      [[-0.024, -0.011], [-0.024, 0.011], [0.024, -0.011], [0.024, 0.011]].forEach(([hx, hz], k) => {
        const hbm = mesh(geo.box(0.011, 0.004, 0.017), hbmMat, [x + hx, 0.0185, z + hz]);
        root.add(add(hbm, 'hbm', 2, { from: [0, 0.12, 0], explode: [0, 0.07, 0], delay: i * 0.1 + k * 0.03, dur: 0.55 }));
      });
    });

    // ---- stage 3: heat sinks + fan wall ----
    const finMat = mat.brushed('#d2d6db');
    const fins = [];
    for (let f = 0; f < 15; f++) fins.push(geo.translated(geo.box(0.0022, 0.085, 0.084), -0.04 + f * 0.0057, 0.0475, 0));
    fins.push(geo.box(0.086, 0.006, 0.086));
    const sinkGeo = geo.merge(fins);
    pos.forEach(([x, z], i) => {
      const sink = mesh(sinkGeo, finMat, [x, 0.024, z]);
      root.add(add(sink, 'cooling', 3, { from: [0, 0.3, 0], explode: [0, 0.2, 0], delay: i * 0.12, dur: 0.8 }));
    });
    const fanBlades = [];
    for (let i = 0; i < 6; i++) {
      const blades = new THREE.Group();
      for (let b = 0; b < 7; b++) {
        const bl = mesh(geo.box(0.004, 0.028, 0.012), mat.plastic('#202226', 0.5), [0, 0.016, 0], [0, 0.5, 0]);
        const holder = new THREE.Group();
        holder.add(bl);
        holder.rotation.z = (b / 7) * Math.PI * 2;
        blades.add(holder);
      }
      blades.add(mesh(geo.cyl(0.012, 0.012, 0.014, 20).rotateX(Math.PI / 2), mat.plastic('#2a2c30')));
      const fan = group(
        mesh(geo.merge([
          geo.translated(geo.box(0.07, 0.006, 0.03), 0, 0.037, 0), geo.translated(geo.box(0.07, 0.006, 0.03), 0, -0.037, 0),
          geo.translated(geo.box(0.006, 0.08, 0.03), 0.032, 0, 0), geo.translated(geo.box(0.006, 0.08, 0.03), -0.032, 0, 0),
        ]), mat.plastic('#141518', 0.6)),
        blades,
      );
      fanBlades.push(blades);
      fan.position.set(-0.18 + i * 0.072, 0.056, -0.1);
      root.add(add(fan, 'fans', 3, { from: [0, 0.28, 0], explode: [0, 0.14, 0], delay: 1.0 + i * 0.1, dur: 0.7 }));
    }

    // ---- stage 4: host CPUs, memory ----
    const mobo = mesh(geo.box(W - 0.02, 0.003, 0.3), mat.textured(kit.tex.pcb('#0d2230', 71), { roughness: 0.5 }), [0, 0.011, -0.27]);
    root.add(add(mobo, 'cpu', 4, { from: [0, 0.25, 0], explode: [0, 0.02, 0], dur: 0.8 }));
    [-0.1, 0.1].forEach((x, i) => {
      const cpu = group(
        mesh(geo.box(0.06, 0.006, 0.07), mat.metal('#b7bcc2', 0.3), [0, 0, 0]),
        mesh(geo.merge(Array.from({ length: 11 }, (_, f) => geo.translated(geo.box(0.002, 0.05, 0.09), -0.03 + f * 0.006, 0.03, 0))), finMat, [0, 0, 0]),
      );
      cpu.position.set(x, 0.016, -0.27);
      root.add(add(cpu, 'cpu', 4, { from: [0, 0.25, 0], explode: [0, 0.12, 0], delay: 0.5 + i * 0.2, dur: 0.8 }));
      for (let d = 0; d < 8; d++) {
        const side = d < 4 ? -1 : 1;
        const dimm = mesh(geo.box(0.004, 0.032, 0.13), mat.paint('#1d3b2c', 0.5), [x + side * (0.045 + (d % 4) * 0.008), 0.03, -0.27]);
        root.add(add(dimm, 'cpu', 4, { from: [0, 0.18, 0], explode: [0, 0.09, 0], delay: 0.9 + i * 0.3 + d * 0.04, dur: 0.5 }));
      }
    });

    // ---- stage 5: interconnect ----
    const cage = mesh(geo.box(0.4, 0.034, 0.08), mat.metal('#9097a0', 0.35), [0, 0.142, D / 2 - 0.04]);
    root.add(add(cage, 'interconnect', 5, { from: [0, 0.2, 0], explode: [0, 0.05, 0.12], dur: 0.7 }));
    const optLeds = [];
    const fiberMat = [mat.plastic('#ff7a2f', 0.35), mat.plastic('#38c6d9', 0.35)];
    for (let i = 0; i < 8; i++) {
      const x = -0.175 + i * 0.05;
      const m = group(mesh(geo.box(0.02, 0.014, 0.09), mat.metal('#c8ccd1', 0.25)));
      const led = mesh(geo.box(0.006, 0.004, 0.002), mat.led('#ff3b44'), [0.005, 0.004, 0.046]);
      m.add(led); optLeds.push(led);
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0.045), new THREE.Vector3(0, 0, 0.09), new THREE.Vector3(0, -0.04, 0.12), new THREE.Vector3(0, -0.12, 0.13)]);
      m.add(mesh(new THREE.TubeGeometry(curve, 16, 0.0028, 6), fiberMat[i % 2]));
      m.position.set(x, 0.142, D / 2 + 0.0);
      root.add(add(m, 'interconnect', 5, { from: [0, 0, 0.3], explode: [0, 0.05, 0.22], delay: 0.6 + i * 0.1, dur: 0.6 }));
    }

    return {
      root, parts,
      timing: { stageMin: [0, 0, 0, 0, 0, 3.0] },
      update(s) {
        const st = s.assembly.stages[5];
        const p = Math.min(1, Math.max(0, (s.t - st.start - 1.6) / 1.0));
        const run = s.complete ? 1 : p;
        dies.forEach((d, i) => { d.material.emissiveIntensity = run * (0.9 + 0.5 * Math.sin(s.elapsed * 3 + i)); });
        links.forEach((l, i) => { l.material.emissiveIntensity = run * (1.2 + 1.2 * Math.max(0, Math.sin(s.elapsed * 5 - i * 0.8))); });
        optLeds.forEach((l, i) => { l.material.emissiveIntensity = run * (Math.sin(s.elapsed * 11 + i * 1.3) > 0 ? 2.4 : 0.6); });
        fanBlades.forEach((b) => { b.rotation.z += s.dt * run * 18; });
        return run > 0;
      },
    };
  },
};
