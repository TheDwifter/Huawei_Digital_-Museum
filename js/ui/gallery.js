// Chapter 3: lineup filters, device rail, specification sheet and comparison table, driving the phone exhibit.
import { t, formatDate, onLangChange, formatNumber } from '../i18n/i18n.js';
import { PHONES, phoneById, SERIES_FILTERS, matchesFilter } from '../content/phones.js';
import { getExhibit } from './exhibits.js';
import { sourceLinks } from './milestones.js';

export function initGallery() {
  const rail = document.getElementById('phone-rail');
  const specs = document.getElementById('phone-specs');
  const table = document.getElementById('phone-compare');
  const filters = document.createElement('div');
  filters.className = 'gallery__filters';
  filters.setAttribute('role', 'group');
  rail.before(filters);

  let current = 'pura80ultra';
  let filter = 'all';
  const maxInch = Math.max(...PHONES.map((p) => p.displayInch));
  const visible = () => PHONES.filter((p) => matchesFilter(p, filter));

  function render() {
    filters.setAttribute('aria-label', t('ch3.filterLabel'));
    filters.innerHTML = SERIES_FILTERS.map((f) => `<button type="button" data-filter="${f}" aria-pressed="${f === filter}">${t(`ch3.filters.${f}`)}<span>${PHONES.filter((p) => matchesFilter(p, f)).length}</span></button>`).join('');
    const list = visible();
    rail.innerHTML = list.map((p) => `
      <button type="button" class="rail-item" role="tab" aria-selected="${p.id === current}" tabindex="${p.id === current ? 0 : -1}" data-phone="${p.id}" aria-controls="phone-specs">
        <span class="yr">${formatDate(p.date, { short: true })}</span>
        <span class="nm">${p.name}</span>
        <span class="cls cls--${p.class}">${t(`ch3.classes.${p.class}`)}</span>
        <span class="swatch" style="background:${p.body}"></span>
      </button>`).join('');
    const p = phoneById(current);
    const k = (s) => `phones.${p.id}.${s}`;
    specs.innerHTML = `
      <h3>${p.name}</h3>
      <span class="tag">${t(`ch3.classes.${p.class}`)} · ${t(k('tag'))}</span>
      <p class="desc">${t(k('desc'))}</p>
      <dl>${p.specs.map((s) => `<dt>${t(`ch3.specLabels.${s}`)}</dt><dd>${t(k(`specs.${s}`))}</dd>`).join('')}</dl>
      <p class="src">${t('ch3.sourcesLabel')}: ${sourceLinks(p.sources)}</p>`;
    table.innerHTML = `
      <thead><tr><th scope="col">${t('ch3.cols.year')}</th><th scope="col">${t('ch3.cols.model')}</th><th scope="col">${t('ch3.cols.type')}</th><th scope="col">${t('ch3.cols.size')}</th><th scope="col">${t('ch3.cols.camera')}</th><th scope="col">${t('ch3.cols.note')}</th></tr></thead>
      <tbody>${list.map((ph) => `
        <tr data-phone="${ph.id}" class="${ph.id === current ? 'is-current' : ''}" tabindex="0" aria-selected="${ph.id === current}">
          <td class="yr">${formatDate(ph.date, { short: true })}</td>
          <th scope="row">${ph.name}</th>
          <td><span class="cls cls--${ph.class}">${t(`ch3.classes.${ph.class}`)}</span></td>
          <td>${formatNumber(ph.displayInch)}″<div class="compare__bar"><span style="width:${(ph.displayInch / maxInch) * 100}%"></span></div></td>
          <td>${t(`phones.${ph.id}.cameraShort`)}</td>
          <td>${t(`phones.${ph.id}.noteShort`)}</td>
        </tr>`).join('')}</tbody>`;
  }

  function select(id, focusRail = false) {
    if (id === current) return;
    current = id;
    render();
    const btn = rail.querySelector(`[data-phone="${id}"]`);
    btn?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    if (focusRail) btn?.focus({ preventScroll: true });
    const ex = getExhibit('phone');
    if (!ex) return;
    ex.options.phone = id;
    ex.controller?.rebuild({ phone: id });
  }

  filters.addEventListener('click', (e) => {
    const b = e.target.closest('[data-filter]');
    if (!b) return;
    filter = b.dataset.filter;
    const list = visible();
    if (!list.some((p) => p.id === current)) select(list[list.length - 1].id);
    else render();
  });
  rail.addEventListener('click', (e) => { const b = e.target.closest('[data-phone]'); if (b) select(b.dataset.phone, true); });
  rail.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const list = visible();
    const i = list.findIndex((p) => p.id === current);
    const next = list[(i + (e.key === 'ArrowRight' ? 1 : list.length - 1)) % list.length];
    select(next.id, true);
  });
  table.addEventListener('click', (e) => {
    const r = e.target.closest('tr[data-phone]');
    if (!r) return;
    select(r.dataset.phone);
    document.getElementById('phone-gallery').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });
  table.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const r = e.target.closest('tr[data-phone]');
    if (r) { e.preventDefault(); select(r.dataset.phone); }
  });

  const ex = getExhibit('phone');
  if (ex) ex.options.phone = current;
  render();
  onLangChange(render);
}
