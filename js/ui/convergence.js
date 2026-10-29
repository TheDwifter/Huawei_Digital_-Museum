// Finale: how the five technologies depend on each other.
import { t, onLangChange } from '../i18n/i18n.js';
import { DOMAIN_COLORS } from '../content/milestones.js';
import { DOMAIN_ICONS } from './timeline.js';

const NODES = { telecom: [300, 60], devices: [520, 210], power: [440, 450], computing: [160, 450], ai: [80, 210] };
const CHAPTER = { telecom: 'ch2', devices: 'ch3', power: 'ch4', computing: 'ch5', ai: 'ch6' };
const LINKS = ['telecom-devices', 'telecom-computing', 'power-telecom', 'power-computing', 'computing-ai', 'devices-ai', 'ai-telecom', 'ai-power'];

export function initConvergence() {
  const root = document.getElementById('convergence');
  let current = 'computing-ai';

  function render() {
    const [a, b] = current.split('-');
    root.innerHTML = `
      <svg class="conv__svg" viewBox="0 0 600 520" role="img" aria-label="${t('finale.title')}">
        ${LINKS.map((l) => {
          const [p, q] = l.split('-');
          return `<line x1="${NODES[p][0]}" y1="${NODES[p][1]}" x2="${NODES[q][0]}" y2="${NODES[q][1]}" class="conv__link ${l === current ? 'is-on' : ''}" data-link="${l}"/>
                  <line x1="${NODES[p][0]}" y1="${NODES[p][1]}" x2="${NODES[q][0]}" y2="${NODES[q][1]}" class="conv__hit" data-link="${l}"/>`;
        }).join('')}
        ${Object.entries(NODES).map(([k, [x, y]]) => `
          <a href="#${CHAPTER[k]}" class="conv__node ${k === a || k === b ? 'is-on' : ''}" style="--c:${DOMAIN_COLORS[k]}">
            <circle cx="${x}" cy="${y}" r="46"/>
            <g transform="translate(${x - 16} ${y - 26}) scale(.667)">${DOMAIN_ICONS[k].replace('<svg viewBox="0 0 48 48" aria-hidden="true">', '').replace('</svg>', '')}</g>
            <text x="${x}" y="${y + 26}">${t(`finale.nodes.${k}`)}</text>
          </a>`).join('')}
      </svg>
      <div class="conv__side">
        <p class="eyebrow">${t('finale.pick')}</p>
        <div class="conv__pairs" role="group" aria-label="${t('finale.pick')}">
          ${LINKS.map((l) => { const [p, q] = l.split('-'); return `<button type="button" data-link="${l}" aria-pressed="${l === current}">${t(`finale.nodes.${p}`)} <span>↔</span> ${t(`finale.nodes.${q}`)}</button>`; }).join('')}
        </div>
        <div class="conv__text" aria-live="polite">
          <h3 class="display-3">${t(`finale.nodes.${a}`)} ↔ ${t(`finale.nodes.${b}`)}</h3>
          <p>${t(`finale.links.${current}`)}</p>
        </div>
      </div>`;
  }

  root.addEventListener('click', (e) => {
    const l = e.target.closest('[data-link]');
    if (l) { current = l.dataset.link; render(); root.querySelector(`button[data-link="${current}"]`)?.focus({ preventScroll: true }); }
  });
  render();
  onLangChange(render);
}
