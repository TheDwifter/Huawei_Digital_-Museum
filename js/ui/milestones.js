// Chapter-level milestone lists, rendered from the shared milestone data.
import { t, formatDate, onLangChange } from '../i18n/i18n.js';
import { milestonesFor } from '../content/milestones.js';
import { SOURCES } from '../content/sources.js';

export function sourceLinks(ids) {
  return ids.map((id) => {
    const s = SOURCES[id];
    return s ? `<a href="#ref-${id}">${s.pub.split(',')[0]}</a>` : '';
  }).join(' · ');
}

export function initChapterMilestones() {
  const lists = document.querySelectorAll('.mini-milestones[data-chapter]');
  const render = () => lists.forEach((ol) => {
    ol.innerHTML = milestonesFor(ol.dataset.chapter).map((m) => `
      <li id="m-${m.id}">
        <time datetime="${m.date}">${formatDate(m.date, { short: true })}</time>
        <div>
          <strong>${t(`milestones.${m.id}.title`)}</strong>
          <p>${t(`milestones.${m.id}.text`)}</p>
          <span class="src">${t('timeline.sources')}: ${sourceLinks(m.sources)}</span>
        </div>
      </li>`).join('');
  });
  render();
  onLangChange(render);
}
