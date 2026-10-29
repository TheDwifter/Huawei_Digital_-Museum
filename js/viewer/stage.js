// A self-contained WebGL stage: renderer, studio lighting, orbit camera, picking, resize and disposal.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { LOW_POWER } from '../util/env.js';

export class Stage3D {
  constructor(host, { exposure = 1, fov = 30, accent = '#ffffff', keyIntensity = 2.2, envIntensity = 1, shadow = true, enableZoom = true } = {}) {
    this.host = host;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, LOW_POWER ? 1.25 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = exposure;
    this.renderer.setClearColor(0x000000, 0);
    this.canvas = this.renderer.domElement;
    host.appendChild(this.canvas);

    this.scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.scene.environment = this.envTexture;
    this.envIntensity = envIntensity;

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x30343a, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, keyIntensity);
    key.position.set(4, 7, 5);
    const rim = new THREE.DirectionalLight(new THREE.Color(accent), 1.4);
    rim.position.set(-6, 3, -5);
    const fill = new THREE.DirectionalLight(0xdfe8ff, 0.5);
    fill.position.set(-4, 1, 6);
    this.scene.add(key, rim, fill);
    this.lights = { key, rim, fill };

    this.camera = new THREE.PerspectiveCamera(fov, 1, 0.01, 500);
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.enableZoom = enableZoom;
    this.controls.zoomSpeed = 0.6;
    this.controls.rotateSpeed = 0.7;
    this.controls.addEventListener('change', () => { this.dirty = true; });

    this.shadowEnabled = shadow;
    this.root = new THREE.Group();
    this.scene.add(this.root);
    this.dirty = true;
    this.tickers = new Set();
    this.raycaster = new THREE.Raycaster();
    this.clock = new THREE.Clock();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.resize();
  }

  resize() {
    const w = this.host.clientWidth || 1;
    const h = this.host.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.onResize?.(w, h);
    this.dirty = true;
  }

  /** Apply environment intensity to every standard material (r160 has no scene-wide control). */
  applyEnvIntensity(obj = this.root) {
    obj.traverse((o) => {
      if (o.material) [].concat(o.material).forEach((m) => { if ('envMapIntensity' in m) m.envMapIntensity = this.envIntensity; });
    });
  }

  /** Place a soft contact shadow under the given box. */
  addContactShadow(box, kit, strength = 0.5) {
    if (!this.shadowEnabled) return;
    const size = box.getSize(new THREE.Vector3());
    const r = Math.max(size.x, size.z) * 1.25;
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(r, r),
      new THREE.MeshBasicMaterial({ map: kit.tex.radial(`rgba(0,0,0,${strength})`, `shadow-${strength}`), transparent: true, depthWrite: false }),
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set((box.min.x + box.max.x) / 2, box.min.y - 0.002 * r, (box.min.z + box.max.z) / 2);
    m.renderOrder = -1;
    this.scene.add(m);
    this.shadow = m;
  }

  /**
   * Frame a bounding box. view: { azimuth, polar, distance (multiplier), target offset [x,y,z] }.
   * Stores the result as the "home" view for resetView().
   */
  frame(box, view = {}) {
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const fov = THREE.MathUtils.degToRad(this.camera.fov);
    const fitH = sphere.radius / Math.sin(fov / 2);
    const fitW = fitH / Math.min(1, this.camera.aspect);
    const dist = Math.max(fitH, fitW) * (view.distance ?? 1);
    const target = sphere.center.clone();
    if (view.target) target.add(new THREE.Vector3(...view.target).multiplyScalar(sphere.radius));
    const az = view.azimuth ?? -0.6;
    const po = view.polar ?? 1.2;
    const dir = new THREE.Vector3(Math.sin(po) * Math.sin(az), Math.cos(po), Math.sin(po) * Math.cos(az));
    this.home = { target, position: target.clone().add(dir.multiplyScalar(dist)) };
    this.controls.minDistance = sphere.radius * 0.9;
    this.controls.maxDistance = dist * 2.6;
    this.controls.minPolarAngle = view.minPolar ?? 0.15;
    this.controls.maxPolarAngle = view.maxPolar ?? Math.PI * 0.62;
    this.camera.near = Math.max(sphere.radius / 200, 0.001);
    this.camera.far = dist * 20;
    this.camera.updateProjectionMatrix();
    this.resetView(true);
  }

  resetView(instant = false) {
    if (!this.home) return;
    if (instant) {
      this.camera.position.copy(this.home.position);
      this.controls.target.copy(this.home.target);
      this.controls.update();
      this.dirty = true;
      return;
    }
    this.tween = { from: this.camera.position.clone(), fromT: this.controls.target.clone(), t: 0 };
  }

  zoom(factor) {
    const offset = this.camera.position.clone().sub(this.controls.target);
    const len = THREE.MathUtils.clamp(offset.length() * factor, this.controls.minDistance, this.controls.maxDistance);
    this.zoomTween = { from: offset.length(), to: len, t: 0 };
  }

  /** Orbit by keyboard. */
  orbit(dAz, dPolar) {
    const offset = this.camera.position.clone().sub(this.controls.target);
    const s = new THREE.Spherical().setFromVector3(offset);
    s.theta += dAz;
    s.phi = THREE.MathUtils.clamp(s.phi + dPolar, this.controls.minPolarAngle, this.controls.maxPolarAngle);
    offset.setFromSpherical(s);
    this.camera.position.copy(this.controls.target).add(offset);
    this.controls.update();
    this.dirty = true;
  }

  pick(clientX, clientY, objects) {
    const rect = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    return this.raycaster.intersectObjects(objects, true).find((h) => h.object.visible && isVisibleChain(h.object));
  }

  /** Project a world point to CSS pixels within the host; returns null when behind the camera. */
  project(v) {
    const p = v.clone().project(this.camera);
    if (p.z > 1) return null;
    return { x: (p.x * 0.5 + 0.5) * this.host.clientWidth, y: (-p.y * 0.5 + 0.5) * this.host.clientHeight };
  }

  addTicker(fn) { this.tickers.add(fn); }

  start() {
    if (this.running) return;
    this.running = true;
    this.clock.getDelta();
    this.renderer.setAnimationLoop(() => this.frameLoop());
  }

  stop() {
    this.running = false;
    this.renderer.setAnimationLoop(null);
  }

  frameLoop() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (this.tween) {
      this.tween.t = Math.min(1, this.tween.t + dt / 0.7);
      const e = easeInOut(this.tween.t);
      this.camera.position.lerpVectors(this.tween.from, this.home.position, e);
      this.controls.target.lerpVectors(this.tween.fromT, this.home.target, e);
      if (this.tween.t >= 1) this.tween = null;
      this.dirty = true;
    }
    if (this.zoomTween) {
      this.zoomTween.t = Math.min(1, this.zoomTween.t + dt / 0.35);
      const len = THREE.MathUtils.lerp(this.zoomTween.from, this.zoomTween.to, easeInOut(this.zoomTween.t));
      const dir = this.camera.position.clone().sub(this.controls.target).normalize();
      this.camera.position.copy(this.controls.target).addScaledVector(dir, len);
      if (this.zoomTween.t >= 1) this.zoomTween = null;
      this.dirty = true;
    }
    this.controls.update();
    for (const fn of this.tickers) if (fn(dt)) this.dirty = true;
    if (this.dirty) {
      this.renderer.render(this.scene, this.camera);
      this.dirty = false;
      this.onRender?.();
    }
  }

  dispose() {
    this.stop();
    this.resizeObserver.disconnect();
    this.controls.dispose();
    const textures = new Set();
    this.scene.traverse((o) => {
      o.geometry?.dispose();
      if (o.material) [].concat(o.material).forEach((m) => {
        Object.values(m).forEach((v) => { if (v && v.isTexture) textures.add(v); });
        m.dispose();
      });
    });
    textures.forEach((tx) => tx.dispose());
    this.envTexture.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.canvas.remove();
    this.tickers.clear();
  }
}

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function isVisibleChain(o) {
  for (let n = o; n; n = n.parent) if (!n.visible) return false;
  return true;
}
