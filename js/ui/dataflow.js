// Chapter 5: follow one request from a phone through the network and data centre and back.
import { t, onLangChange } from '../i18n/i18n.js';
import { FlowAnimator } from './flowAnimator.js';
import { REDUCED_MOTION } from '../util/env.js';

const N = {
  phone: [60, 150], radio: [190, 150], core: [330, 150], spine: [480, 70], leaf: [480, 230],
  server: [640, 150], storage: [800, 150], power: [640, 270],
};
const HOPS = [
  { from: 'phone', to: 'radio', nodes: ['phone', 'radio'] },
  { from: 'radio', to: 'core', nodes: ['radio', 'core'] },
  { path: ['core', 'spine', 'leaf', 'server'], nodes: ['core', 'spine', 'leaf', 'server'] },
  { from: 'server', to: 'server', nodes: ['server'], pulse: true },
  { from: 'server', to: 'storage', nodes: ['server', 'storage'], back: true },
  { path: ['server', 'leaf', 'spine', 'core', 'radio', 'phone'], nodes: ['server', 'leaf', 'spine', 'core', 'radio', 'phone'] },
];
const TAB_NODES = { processing: ['server'], storage: ['storage'], networking: ['spine', 'leaf', 'core'], cloud: ['server', 'storage', 'spine', 'leaf', 'power'] };

export function initDataFlow() {
  const root = document.getElementById('dataflow');
  let tab = 'processing';
  let step = -1;
  let running = false;

  const icon = {
    phone: ([x, y]) => `<rect x="${x - 14}" y="${y - 26}" width="28" height="52" rx="5"/>`,
    radio: ([x, y]) => `<path d="M${x} ${y - 30}v58M${x - 14} ${y + 28}h28M${x} ${y - 20}l-10 48M${x} ${y - 20}l10 48" fill="none"/><rect x="${x - 5}" y="${y - 40}" width="10" height="22" rx="2"/>`,
    core: ([x, y]) => `<rect x="${x - 34}" y="${y - 30}" width="68" height="60" rx="4"/><path d="M${x - 22} ${y - 12}h44M${x - 22} ${y + 2}h44M${x - 22} ${y + 16}h44" fill="none"/>`,
    spine: ([x, y]) => `<rect x="${x - 44}" y="${y - 14}" width="88" height="28" rx="3"/>`,
    leaf: ([x, y]) => `<rect x="${x - 44}" y="${y - 14}" width="88" height="28" rx="3"/>`,
    server: ([x, y]) => `<rect x="${x - 40}" y="${y - 50}" width="80" height="100" rx="3"/><path d="M${x - 30} ${y - 30}h60M${x - 30} ${y - 10}h60M${x - 30} ${y + 10}h60M${x - 30} ${y + 30}h60" fill="none"/>`,
    storage: ([x, y]) => `<ellipse cx="${x}" cy="${y - 34}" rx="36" ry="10"/><path d="M${x - 36} ${y - 34}v66a36 10 0 0 0 72 0v-66" /><path d="M${x - 36} ${y - 8}a36 10 0 0 0 72 0M${x - 36} ${y + 14}a36 10 0 0 0 72 0" fill="none"/>`,
    power: ([x, y]) => `<rect x="${x - 40}" y="${y - 16}" width="80" height="32" rx="3"/><path d="M${x - 4} ${y - 10}l-8 12h10l-6 10" fill="none"/>`,
  };

  root.innerHTML = `
    <div class="dataflow__head">
      <div><h3 class="display-3"></h3><p class="muted"></p></div>
      <button type="button" class="btn btn--primary" data-df="send"></button>
    </div>
    <div class="dataflow__grid">
      <svg class="dataflow__svg" viewBox="0 0 880 320" role="img">
        <g class="df-links"><path d="M74 150H190M190 150H296M364 150L436 70M364 150L436 230M480 84V216M524 70L600 120M524 230L600 180M680 150H764M640 200V254"/></g>
        <g class="df-nodes">${Object.entries(N).map(([k, p]) => `<g class="df-node" data-n="${k}">${icon[k](p)}<text x="${p[0]}" y="${k === 'spine' ? p[1] - 24 : p[1] + (k === 'leaf' || k === 'power' ? 34 : 70)}" data-l="${k}"></text></g>`).join('')}</g>
        <g class="df-dots"></g>
      </svg>
      <div class="dataflow__side">
        <ol class="df-steps" aria-live="polite"></ol>
        <div class="df-tabs" role="tablist"></div>
        <p class="df-tabtext" role="tabpanel"></p>
      </div>
    </div>`;
  const svg = root.querySelector('svg');
  const anim = new FlowAnimator(svg, root.querySelector('.df-dots'));

  function highlight(nodes) {
    root.querySelectorAll('.df-node').forEach((g) => g.classList.toggle('is-on', nodes.includes(g.dataset.n)));
  }

  function render() {
    root.querySelector('.dataflow__head h3').textContent = t('ch5.flow.title');
    root.querySelector('.dataflow__head p').textContent = t('ch5.flow.lede');
    root.querySelector('[data-df="send"]').textContent = step >= HOPS.length - 1 && !running ? t('ch5.flow.again') : t('ch5.flow.send');
    root.querySelector('[data-df="send"]').disabled = running;
    svg.setAttribute('aria-label', t('ch5.flow.title'));
    root.querySelectorAll('[data-l]').forEach((n) => { n.textContent = t(`ch5.flow.nodes.${n.dataset.l}`); });
    root.querySelector('.df-steps').innerHTML = t('ch5.flow.steps').map((s, i) => `<li class="${i === step ? 'is-current' : i < step ? 'is-done' : ''}">${s}</li>`).join('');
    const tabs = root.querySelector('.df-tabs');
    tabs.innerHTML = Object.keys(TAB_NODES).map((k) => `<button type="button" role="tab" aria-selected="${k === tab}" data-tab="${k}">${t(`ch5.flow.tabs.${k}.name`)}</button>`).join('');
    root.querySelector('.df-tabtext').textContent = t(`ch5.flow.tabs.${tab}.text`);
    if (!running) highlight(TAB_NODES[tab]);
  }

  function runHop(i) {
    step = i;
    render();
    if (i >= HOPS.length) { running = false; step = HOPS.length - 1; render(); highlight(TAB_NODES[tab]); return; }
    const h = HOPS[i];
    highlight(h.nodes);
    const ids = h.path || [h.from, h.to];
    let pts = ids.map((k) => N[k]);
    if (h.pulse) pts = [[N.server[0] - 30, N.server[1] - 30], [N.server[0] + 30, N.server[1] - 30], [N.server[0] + 30, N.server[1] + 30], [N.server[0] - 30, N.server[1] + 30], [N.server[0] - 30, N.server[1] - 30]];
    if (h.back) pts = [...pts, ...pts.slice(0, -1).reverse()];
    const next = () => setTimeout(() => runHop(i + 1), REDUCED_MOTION.matches ? 1200 : 250);
    if (REDUCED_MOTION.matches) { anim.set([{ points: pts, count: 1, r: 6, color: 'var(--accent)' }]); next(); return; }
    anim.set([{ points: pts, count: 3, r: 6, speed: 420, color: 'var(--accent)', once: true, onDone: next }]);
  }

  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-df="send"]') && !running) { running = true; runHop(0); }
    const tb = e.target.closest('[data-tab]');
    if (tb) { tab = tb.dataset.tab; render(); }
  });

  render();
  onLangChange(render);
}
