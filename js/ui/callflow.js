// Chapter 1: step-by-step explanation of how a digital exchange connects a call.
import { t, onLangChange } from '../i18n/i18n.js';
import { FlowAnimator } from './flowAnimator.js';
import { REDUCED_MOTION } from '../util/env.js';

const P = { a: [70, 150], lineA: [250, 150], net: [450, 150], ctrl: [450, 48], lineB: [650, 150], b: [830, 150] };
const STEPS = [
  { nodes: ['a', 'lineA'], flows: [{ points: [P.a, P.lineA], color: 'var(--chapter-accent)' }, { points: [P.lineA, P.a], color: '#7d7466', speed: 90 }] },
  { nodes: ['a', 'lineA', 'ctrl'], flows: [{ points: [P.a, P.lineA, [250, 48], P.ctrl], color: 'var(--chapter-accent)', count: 4 }] },
  { nodes: ['lineA', 'net', 'lineB', 'ctrl'], path: [P.lineA, P.net, P.lineB], flows: [{ points: [P.ctrl, P.net], color: '#7d7466', count: 2 }, { points: [P.lineA, P.net, P.lineB], color: 'var(--chapter-accent)', count: 2 }] },
  { nodes: ['lineB', 'b'], path: [P.lineA, P.net, P.lineB], ring: true, flows: [{ points: [P.lineB, P.b], color: 'var(--chapter-accent)', count: 3 }] },
  { nodes: ['a', 'lineA', 'net', 'lineB', 'b'], path: [P.a, P.lineA, P.net, P.lineB, P.b], flows: [{ points: [P.a, P.lineA, P.net, P.lineB, P.b], color: 'var(--chapter-accent)', count: 6 }, { points: [P.b, P.lineB, P.net, P.lineA, P.a], color: '#3c6e8f', count: 6 }] },
];

const phone = (x, y) => `<g transform="translate(${x - 26} ${y - 22})"><rect x="0" y="14" width="52" height="30" rx="6"/><path d="M4 14c0-12 44-12 44 0" fill="none" stroke-width="7" stroke-linecap="round"/><circle cx="26" cy="29" r="7" fill="var(--bg)"/></g>`;

export function initCallFlow() {
  const root = document.getElementById('callflow');
  let step = 0;
  let timer = null;

  root.innerHTML = `
    <div class="callflow__head"><h3 class="display-3"></h3><p class="muted"></p></div>
    <div class="callflow__grid">
      <svg class="callflow__svg" viewBox="0 0 900 230" role="img">
        <g class="cf-wires">
          <path d="M70 150H830" />
          <path d="M250 150V48H450" class="cf-ctrl-wire" />
          <path d="M450 48V150" class="cf-ctrl-wire" />
        </g>
        <polyline class="cf-path" points="" />
        <g class="cf-node" data-n="a">${phone(...P.a)}</g>
        <g class="cf-node" data-n="b">${phone(...P.b)}<g class="cf-ring"><path d="M846 112a26 26 0 0 1 14 14M852 102a38 38 0 0 1 20 22" fill="none" stroke-width="3"/></g></g>
        <g class="cf-node" data-n="lineA"><rect x="205" y="122" width="90" height="56" rx="4"/></g>
        <g class="cf-node" data-n="lineB"><rect x="605" y="122" width="90" height="56" rx="4"/></g>
        <g class="cf-node" data-n="net"><rect x="385" y="112" width="130" height="76" rx="4"/><path d="M400 130h100M400 150h100M400 170h100M420 120v60M450 120v60M480 120v60" class="cf-grid"/></g>
        <g class="cf-node" data-n="ctrl"><rect x="400" y="22" width="100" height="52" rx="4"/></g>
        <g class="cf-labels">
          <text data-l="a" x="70" y="208"></text><text data-l="b" x="830" y="208"></text>
          <text data-l="lineA" x="250" y="208"></text><text data-l="lineB" x="650" y="208"></text>
          <text data-l="net" x="450" y="208"></text><text data-l="ctrl" x="450" y="13"></text>
        </g>
        <g class="cf-dots"></g>
      </svg>
      <div class="callflow__panel">
        <p class="callflow__count"></p>
        <h4 class="callflow__title"></h4>
        <p class="callflow__text" aria-live="polite"></p>
        <ol class="callflow__steps"></ol>
        <div class="callflow__controls">
          <button type="button" class="icon-btn" data-cf="prev">←</button>
          <button type="button" class="tb-btn" data-cf="play"></button>
          <button type="button" class="icon-btn" data-cf="next">→</button>
        </div>
      </div>
    </div>`;

  const svg = root.querySelector('svg');
  const anim = new FlowAnimator(svg, root.querySelector('.cf-dots'));

  function render() {
    const steps = t('ch1.how.steps');
    root.querySelector('.callflow__head h3').textContent = t('ch1.how.title');
    root.querySelector('.callflow__head p').textContent = t('ch1.how.lede');
    svg.setAttribute('aria-label', t('ch1.how.title'));
    root.querySelectorAll('[data-l]').forEach((n) => { n.textContent = t(`ch1.how.nodes.${n.dataset.l}`); });
    root.querySelector('.callflow__count').textContent = t('ch1.how.stepOf', { n: step + 1, total: steps.length });
    root.querySelector('.callflow__title').textContent = steps[step].title;
    root.querySelector('.callflow__text').textContent = steps[step].text;
    root.querySelector('.callflow__steps').innerHTML = steps.map((s, i) => `<li><button type="button" data-goto="${i}" aria-current="${i === step}">${i + 1}. ${s.title}</button></li>`).join('');
    root.querySelector('[data-cf="prev"]').setAttribute('aria-label', t('ch1.how.prev'));
    root.querySelector('[data-cf="next"]').setAttribute('aria-label', t('ch1.how.next'));
    root.querySelector('[data-cf="prev"]').disabled = step === 0;
    root.querySelector('[data-cf="next"]').disabled = step === steps.length - 1;
    root.querySelector('[data-cf="play"]').textContent = timer ? t('ch1.how.pause') : t('ch1.how.play');
  }

  function show(i) {
    step = i;
    const s = STEPS[i];
    root.querySelectorAll('.cf-node').forEach((g) => g.classList.toggle('is-on', s.nodes.includes(g.dataset.n)));
    root.querySelector('.cf-path').setAttribute('points', (s.path || []).map((p) => p.join(',')).join(' '));
    root.querySelector('.cf-ring').style.display = s.ring ? '' : 'none';
    root.querySelector('.cf-ring').classList.toggle('is-ringing', !!s.ring && !REDUCED_MOTION.matches);
    anim.set(s.flows.map((f) => ({ count: 3, speed: 150, r: 5, ...f })));
    render();
  }

  function stopAuto() { clearInterval(timer); timer = null; render(); }

  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cf], [data-goto]');
    if (!b) return;
    if (b.dataset.goto) { stopAuto(); show(Number(b.dataset.goto)); return; }
    const act = b.dataset.cf;
    if (act === 'prev') { stopAuto(); show(Math.max(0, step - 1)); }
    if (act === 'next') { stopAuto(); show(Math.min(STEPS.length - 1, step + 1)); }
    if (act === 'play') {
      if (timer) { stopAuto(); return; }
      if (step === STEPS.length - 1) show(0);
      timer = setInterval(() => { if (step >= STEPS.length - 1) stopAuto(); else show(step + 1); }, 3600);
      render();
    }
  });

  show(0);
  onLangChange(render);
}
