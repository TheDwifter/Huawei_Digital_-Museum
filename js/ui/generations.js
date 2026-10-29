// Chapter 2: mobile generations selector with an animated signal-path diagram.
import { t, onLangChange } from '../i18n/i18n.js';
import { FlowAnimator } from './flowAnimator.js';

const GENS = ['g2', 'g3', 'g4', 'g5'];
const SPEED = { g2: 45, g3: 90, g4: 200, g5: 380 };
const X = { device: 90, radio: 300, transport: 510, core: 710, services: 900 };
const Y = 130;

export function initGenerations() {
  const root = document.getElementById('generations');
  let gen = 'g4';

  root.innerHTML = `
    <div class="gens__tabs" role="tablist"></div>
    <div class="gens__panel" role="tabpanel">
      <div class="gens__facts"></div>
      <figure class="gens__signal">
        <figcaption><h3 class="gens__sig-title"></h3><p class="gens__caption"></p></figcaption>
        <svg viewBox="0 20 1000 245" role="img">
          <g class="sig-links"></g>
          <g class="sig-beams"></g>
          <g class="sig-nodes"></g>
          <g class="sig-dots"></g>
        </svg>
        <p class="gens__legend"></p>
      </figure>
    </div>`;
  const tabs = root.querySelector('.gens__tabs');
  const svg = root.querySelector('svg');
  const anim = new FlowAnimator(svg, root.querySelector('.sig-dots'));

  const nodeSvg = {
    device: (x, y) => `<rect x="${x - 13}" y="${y - 24}" width="26" height="48" rx="5"/><rect class="sig-screen" x="${x - 9}" y="${y - 18}" width="18" height="32" rx="2"/>`,
    radio: (x, y) => `<path d="M${x} ${y - 46}v86M${x - 22} ${y + 40}h44M${x} ${y - 30}l-16 70M${x} ${y - 30}l16 70" fill="none"/><rect x="${x - 7}" y="${y - 58}" width="14" height="30" rx="2"/>`,
    transport: (x, y) => `<rect x="${x - 34}" y="${y - 16}" width="68" height="32" rx="4"/><path d="M${x - 22} ${y}h44M${x + 12} ${y - 7}l10 7-10 7" fill="none"/>`,
    core: (x, y) => `<rect x="${x - 30}" y="${y - 40}" width="60" height="80" rx="4"/><path d="M${x - 20} ${y - 22}h40M${x - 20} ${y - 6}h40M${x - 20} ${y + 10}h40M${x - 20} ${y + 26}h40" fill="none"/>`,
    services: (x, y) => `<path d="M${x - 40} ${y + 18}a20 20 0 0 1 4-38a26 26 0 0 1 48-6a18 18 0 0 1 26 22a14 14 0 0 1-6 22z"/>`,
  };

  function render() {
    tabs.setAttribute('aria-label', t('ch2.genLabel'));
    tabs.innerHTML = GENS.map((g) => `<button type="button" role="tab" id="gen-tab-${g}" aria-selected="${g === gen}" tabindex="${g === gen ? 0 : -1}" data-gen="${g}"><b>${t(`ch2.gens.${g}.name`)}</b><span>${t(`ch2.gens.${g}.era`)}</span></button>`).join('');
    root.querySelector('.gens__panel').setAttribute('aria-labelledby', `gen-tab-${gen}`);
    const f = (k) => t(`ch2.gens.${gen}.${k}`);
    root.querySelector('.gens__facts').innerHTML = `
      <div class="gens__big">${f('name')}<small>${f('speed')}</small></div>
      <dl>
        <dt>${t('ch2.industry')}</dt><dd>${f('industry')}</dd>
        <dt>${t('ch2.huawei')}</dt><dd>${f('huawei')}</dd>
        <dt>${t('ch2.arch')}</dt><dd>${f('arch')}</dd>
      </dl>`;
    root.querySelector('.gens__sig-title').textContent = t('ch2.signal.title');
    root.querySelector('.gens__caption').textContent = t(`ch2.signal.caption.${gen}`);
    root.querySelector('.gens__legend').textContent = t('ch2.signal.legend');
    svg.setAttribute('aria-label', `${t('ch2.signal.title')}: ${t(`ch2.signal.caption.${gen}`)}`);
    drawDiagram();
  }

  function drawDiagram() {
    const is5g = gen === 'g5';
    const devices = is5g ? [[X.device, Y - 62], [X.device, Y], [X.device, Y + 62]] : [[X.device, Y]];
    const label = (key, x, sub) => `<text x="${x}" y="226" class="sig-label">${t(`ch2.signal.${key}`)}</text>${sub ? `<text x="${x}" y="250" class="sig-sub">${sub}</text>` : ''}`;
    root.querySelector('.sig-nodes').innerHTML = [
      ...devices.map(([x, y]) => `<g class="sig-node">${nodeSvg.device(x, y)}</g>`),
      `<g class="sig-node">${nodeSvg.radio(X.radio, Y)}</g>`,
      `<g class="sig-node">${nodeSvg.transport(X.transport, Y)}</g>`,
      `<g class="sig-node">${nodeSvg.core(X.core, Y)}</g>`,
      `<g class="sig-node">${nodeSvg.services(X.services, Y)}</g>`,
      label('device', X.device), label('radio', X.radio, t(`ch2.signal.radioBy.${gen}`)), label('transport', X.transport),
      label('core', X.core, t(`ch2.signal.coreBy.${gen}`)), label('services', X.services),
    ].join('');
    root.querySelector('.sig-links').innerHTML = [
      ...devices.map(([x, y]) => `<path class="sig-air" d="M${x + 16} ${y}L${X.radio - 10} ${Y - 40}"/>`),
      `<path d="M${X.radio + 12} ${Y}H${X.transport - 34}M${X.transport + 34} ${Y}H${X.core - 30}M${X.core + 30} ${Y}H${X.services - 40}"/>`,
    ].join('');
    root.querySelector('.sig-beams').innerHTML = is5g
      ? devices.map(([x, y]) => `<path class="sig-beam" d="M${X.radio - 6} ${Y - 40}L${x + 30} ${y - 14}L${x + 30} ${y + 14}Z"/>`).join('')
      : '';
    const flows = devices.map(([x, y]) => ({
      points: [[x + 16, y], [X.radio - 8, Y - 40], [X.radio, Y], [X.transport, Y], [X.core, Y], [X.services - 30, Y]],
      speed: SPEED[gen], count: gen === 'g2' ? 2 : 4, r: 4.5, color: 'var(--accent)',
    }));
    anim.set(flows);
  }

  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('[data-gen]');
    if (b) { gen = b.dataset.gen; render(); tabs.querySelector(`[data-gen="${gen}"]`).focus(); }
  });
  tabs.addEventListener('keydown', (e) => {
    const i = GENS.indexOf(gen);
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      gen = GENS[(i + (e.key === 'ArrowRight' ? 1 : GENS.length - 1)) % GENS.length];
      render();
      tabs.querySelector(`[data-gen="${gen}"]`).focus();
    }
  });

  render();
  onLangChange(render);
}
