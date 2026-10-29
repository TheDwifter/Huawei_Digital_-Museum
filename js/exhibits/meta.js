// Lightweight exhibit metadata (no 3D dependencies) so panels can render before/without WebGL.
export const EXHIBIT_META = {
  switch: { components: ['frame', 'backplane', 'subracks', 'linecards', 'switching', 'power', 'cabling', 'panels'], stages: 6, load: () => import('./switch.js') },
  aau: { components: ['pole', 'housing', 'transceivers', 'reflector', 'elements', 'radome'], stages: 6, load: () => import('./aau.js') },
  phone: { components: ['frame', 'board', 'soc', 'cameras', 'battery', 'internals', 'back', 'display'], stages: 5, load: () => import('./phone.js') },
  inverter: { components: ['bracket', 'housing', 'powerstage', 'capacitors', 'inductors', 'control', 'terminals', 'cover'], stages: 6, load: () => import('./inverter.js') },
  solar: { components: ['panels', 'inverter', 'battery', 'board', 'grid'], stages: 5, load: () => import('./solar.js') },
  rack: { components: ['rack', 'pdu', 'switches', 'servers', 'storage', 'cabling'], stages: 6, load: () => import('./rack.js') },
  ai: { components: ['chassis', 'baseboard', 'npu', 'hbm', 'cooling', 'fans', 'cpu', 'interconnect'], stages: 6, load: () => import('./ai.js') },
};
