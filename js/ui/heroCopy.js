// Hero copy that depends on the current date, plus the timeline preview strip.
import { t, onLangChange } from '../i18n/i18n.js';

const FOUNDED = 1987;

export function initHeroCopy() {
  const year = new Date().getFullYear();
  const years = Math.min(50, Math.max(0, year - FOUNDED));
  const label = document.getElementById('years-label');
  const note = document.getElementById('years-note');
  const fill = document.getElementById('years-meter-fill');
  const preview = document.getElementById('hero-preview');

  const render = () => {
    label.textContent = t('hero.yearsLabel', { years });
    note.textContent = t('hero.yearsNote', { year });
    preview.innerHTML = `<ol>${t('hero.eras').map((e) => `
      <li><a href="${e.href}"${e.future ? ' class="is-future"' : ''}><span class="yr">${e.year}</span><span class="ttl">${e.title}</span></a></li>`).join('')}</ol>`;
  };
  render();
  onLangChange(render);
  requestAnimationFrame(() => { fill.style.width = `${(years / 50) * 100}%`; });
}
