// Interactive swim-lane timeline (desktop) with a vertical list alternative (narrow screens).
import { t, formatDate, onLangChange } from '../i18n/i18n.js';
import { MILESTONES, DOMAINS, DOMAIN_COLORS } from '../content/milestones.js';
import { sourceLinks } from './milestones.js';

export const DOMAIN_ICONS = {
  telecom: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 18v24M17 42h14M24 18l-6 24M24 18l6 24" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="24" cy="16" r="3" fill="currentColor"/><path d="M16 9a11 11 0 0 0 0 14M32 9a11 11 0 0 1 0 14M11 5a17 17 0 0 0 0 22M37 5a17 17 0 0 1 0 22" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  devices: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="14" y="5" width="20" height="38" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M21 9h6" stroke="currentColor" stroke-width="2"/><rect x="17" y="13" width="14" height="22" rx="1.5" fill="currentColor" opacity=".25"/></svg>',
  power: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="34" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M34 2v3M34 19v3M24 12h3M41 12h3M27 5l2 2M39 17l2 2M27 19l2-2M39 7l2-2" stroke="currentColor" stroke-width="2"/><path d="M6 40l6-16h22l-6 16z M9 32h22M14 24l-4 16M22 24l-4 16" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  computing: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="12" y="4" width="24" height="40" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M15 11h18M15 18h18M15 25h18M15 32h18" stroke="currentColor" stroke-width="2"/><circle cx="31" cy="38" r="1.6" fill="currentColor"/></svg>',
  ai: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="13" y="13" width="22" height="22" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><rect x="19" y="19" width="10" height="10" fill="currentColor" opacity=".35"/><path d="M18 13V6M24 13V6M30 13V6M18 42v-7M24 42v-7M30 42v-7M13 18H6M13 24H6M13 30H6M42 18h-7M42 24h-7M42 30h-7" stroke="currentColor" stroke-width="2"/></svg>',
  future: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="17" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/><text x="24" y="29" text-anchor="middle" font-size="13" font-family="monospace" fill="currentColor">50</text></svg>',
};

const START = 1986.5;
const END = 2027.2;
const xOf = (year) => (year >= 2030 ? 97 : 3 + ((year - START) / (END - START)) * 87);
const TICKS = [1987, 1990, 1995, 2000, 2005, 2010, 2015, 2020, 2025];

export function initTimeline() {
  const root = document.getElementById('timeline-root');
  const narrow = matchMedia('(max-width: 860px)');
  const state = { filter: 'all', index: MILESTONES.findIndex((m) => m.id === 'cc08') };

  const visible = () => MILESTONES.filter((m) => state.filter === 'all' || m.domain === state.filter || m.status === 'future');

  function render() {
    const list = visible();
    if (!list.includes(MILESTONES[state.index])) state.index = MILESTONES.indexOf(list[0]);
    const filters = `
      <div class="tl__filters" role="group" aria-label="${t('timeline.filterLabel')}">
        <button type="button" data-filter="all" aria-pressed="${state.filter === 'all'}">${t('timeline.all')}</button>
        ${DOMAINS.map((d) => `<button type="button" data-filter="${d}" aria-pressed="${state.filter === d}"><i style="background:${DOMAIN_COLORS[d]}"></i>${t(`timeline.lanes.${d}`)}</button>`).join('')}
        <span class="tl__count">${t('timeline.count', { n: list.filter((m) => m.status !== 'future').length })}</span>
      </div>`;
    root.innerHTML = filters + (narrow.matches ? renderList(list) : renderChart(list) + '<div class="tl__detail" aria-live="polite"></div>');
    if (!narrow.matches) renderDetail();
  }

  function renderChart(list) {
    const lanes = DOMAINS.filter((d) => state.filter === 'all' || d === state.filter);
    const today = new Date();
    const todayYear = today.getFullYear() + today.getMonth() / 12;
    const lastX = {};
    const marker = (m) => {
      const x = xOf(m.t);
      const lane = m.domain || 'future';
      const near = lastX[lane] !== undefined && x - lastX[lane] < 1.6;
      lastX[lane] = near ? lastX[lane] : x;
      const bump = near ? ' is-bumped' : '';
      const sel = MILESTONES[state.index] === m;
      const color = m.domain ? DOMAIN_COLORS[m.domain] : 'var(--ink)';
      return `<button type="button" class="tl-marker${bump}${m.status ? ` is-${m.status}` : ''}" style="left:${x}%;--c:${color}" data-id="${m.id}"
        aria-pressed="${sel}" tabindex="${sel ? 0 : -1}" aria-label="${formatDate(m.date)}: ${t(`milestones.${m.id}.title`)}"><span></span></button>`;
    };
    return `
      <div class="tl__chart-wrap" tabindex="-1">
        <div class="tl__chart" role="group" aria-label="${t('timeline.title')}">
          <div class="tl__axis" aria-hidden="true">
            ${TICKS.map((y) => `<span style="left:${xOf(y)}%">${y}</span>`).join('')}
            <span class="tl__break" style="left:93.5%">//</span>
            <span class="tl__future-tick" style="left:97%">2037</span>
            <span class="tl__today" style="left:${xOf(todayYear)}%"><b>${t('timeline.today')}</b></span>
          </div>
          ${lanes.map((d) => `
            <div class="tl__lane">
              <div class="tl__lane-label"><i style="background:${DOMAIN_COLORS[d]}"></i>${t(`timeline.lanes.${d}`)}</div>
              <div class="tl__lane-track">${list.filter((m) => m.domain === d).map(marker).join('')}</div>
            </div>`).join('')}
          <div class="tl__lane tl__lane--future">
            <div class="tl__lane-label"></div>
            <div class="tl__lane-track">${list.filter((m) => m.status === 'future').map(marker).join('')}</div>
          </div>
        </div>
      </div>
      <p class="tl__hint">${t('timeline.hint')}</p>`;
  }

  function renderList(list) {
    return `<ol class="tl-list">${list.map((m) => `
      <li class="tl-list__item${m.status ? ` is-${m.status}` : ''}" style="--c:${m.domain ? DOMAIN_COLORS[m.domain] : 'var(--ink)'}">
        <div class="tl-list__meta"><time datetime="${m.date}">${formatDate(m.date, { short: true })}</time><span>${m.domain ? t(`timeline.lanes.${m.domain}`) : ''}</span></div>
        <strong>${t(`milestones.${m.id}.title`)}</strong>
        <p>${t(`milestones.${m.id}.text`)}</p>
        ${statusNote(m)}
        <div class="tl-list__foot"><a class="link-arrow" href="#${m.chapter}">${t(`timeline.chapterNames.${m.chapter}`)} →</a></div>
      </li>`).join('')}</ol>`;
  }

  function statusNote(m) {
    return m.status ? `<p class="tl-status">${t(`timeline.${m.status}`)}</p>` : '';
  }

  function renderDetail() {
    const box = root.querySelector('.tl__detail');
    if (!box) return;
    const m = MILESTONES[state.index];
    const list = visible();
    const pos = list.indexOf(m);
    const icon = DOMAIN_ICONS[m.domain || 'future'];
    const color = m.domain ? DOMAIN_COLORS[m.domain] : 'var(--ink)';
    box.innerHTML = `
      <div class="tl-card" style="--c:${color}">
        <div class="tl-card__icon">${icon}</div>
        <div class="tl-card__body">
          <div class="tl-card__meta"><time datetime="${m.date}">${formatDate(m.date)}</time>${m.domain ? `<span>${t(`timeline.lanes.${m.domain}`)}</span>` : ''}</div>
          <h3>${t(`milestones.${m.id}.title`)}</h3>
          <p>${t(`milestones.${m.id}.text`)}</p>
          ${statusNote(m)}
          <p class="tl-card__src">${t('timeline.sources')}: ${sourceLinks(m.sources)}</p>
        </div>
        <div class="tl-card__actions">
          <a class="btn btn--primary" href="#${m.chapter}">${t('timeline.goto')}</a>
          <div class="tl-card__nav">
            <button type="button" class="icon-btn" data-step="-1" aria-label="${t('timeline.prev')}" ${pos <= 0 ? 'disabled' : ''}>←</button>
            <span>${pos + 1} / ${list.length}</span>
            <button type="button" class="icon-btn" data-step="1" aria-label="${t('timeline.next')}" ${pos >= list.length - 1 ? 'disabled' : ''}>→</button>
          </div>
        </div>
      </div>`;
  }

  function select(m, focus = false) {
    state.index = MILESTONES.indexOf(m);
    root.querySelectorAll('.tl-marker').forEach((b) => {
      const on = b.dataset.id === m.id;
      b.setAttribute('aria-pressed', String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus({ preventScroll: true });
      if (on) b.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    });
    renderDetail();
  }

  function step(dir, focus) {
    const list = visible();
    const pos = list.indexOf(MILESTONES[state.index]);
    const next = list[Math.min(list.length - 1, Math.max(0, pos + dir))];
    if (next) select(next, focus);
  }

  root.addEventListener('click', (e) => {
    const f = e.target.closest('[data-filter]');
    if (f) { state.filter = f.dataset.filter; render(); return; }
    const mk = e.target.closest('.tl-marker');
    if (mk) { select(MILESTONES.find((m) => m.id === mk.dataset.id)); return; }
    const st = e.target.closest('[data-step]');
    if (st) step(Number(st.dataset.step), false);
  });
  root.addEventListener('keydown', (e) => {
    if (!e.target.closest('.tl-marker')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); step(1, true); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); step(-1, true); }
    if (e.key === 'Home') { e.preventDefault(); select(visible()[0], true); }
    if (e.key === 'End') { e.preventDefault(); const l = visible(); select(l[l.length - 1], true); }
  });

  render();
  onLangChange(render);
  narrow.addEventListener('change', render);
}
