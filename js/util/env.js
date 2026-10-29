// Device capability flags shared by the 3D code and the UI.
const mq = (q) => (typeof matchMedia === 'function' ? matchMedia(q) : { matches: false, addEventListener() {} });

export const REDUCED_MOTION = mq('(prefers-reduced-motion: reduce)');
export const COARSE_POINTER = mq('(pointer: coarse)').matches;
export const LOW_POWER = (navigator.hardwareConcurrency || 4) <= 4 || COARSE_POINTER || (navigator.deviceMemory && navigator.deviceMemory <= 4);

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}
