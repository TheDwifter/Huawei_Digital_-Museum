// Sources & methodology section.
import { t, onLangChange, formatDate } from '../i18n/i18n.js';
import { SOURCES, SOURCE_ORDER, ACCESSED } from '../content/sources.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Split "Publisher, 7 Jan 2019" into a publisher name and a localized date. */
export function publication(pub) {
  const m = pub.match(/^(.*), (?:(\d{1,2}) )?(?:([A-Z][a-z]{2}) )?(\d{4})$/);
  if (!m) return pub;
  const [, name, day, mon, year] = m;
  const mi = mon ? MONTHS.indexOf(mon) + 1 : 0;
  const iso = [year, mi && String(mi).padStart(2, '0'), day && mi && String(day).padStart(2, '0')].filter(Boolean).join('-');
  return `${name}, ${formatDate(iso, { short: true })}`;
}

export function initReferences() {
  const method = document.getElementById('method-list');
  const list = document.getElementById('ref-list');
  const render = () => {
    method.innerHTML = t('refs.method').map((m) => `<li><strong>${m.title}</strong>${m.text}</li>`).join('');
    const accessed = t('refs.accessed', { date: formatDate(ACCESSED) });
    list.innerHTML = SOURCE_ORDER.map((id) => {
      const s = SOURCES[id];
      return `<li id="ref-${id}"><a href="${s.url}" target="_blank" rel="noopener noreferrer" lang="en">${s.title}</a><span class="pub">${publication(s.pub)} · ${accessed}</span></li>`;
    }).join('');
  };
  render();
  onLangChange(render);
}
