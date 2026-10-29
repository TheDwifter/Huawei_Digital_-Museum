// Header behaviour: language switch, scroll state, active section, progress bar and mobile menu.
import { getLang, setLang, onLangChange, t } from '../i18n/i18n.js';

const LIGHT_THEMES = new Set(['light', 'paper', 'ice']);

export function initNav() {
  const header = document.getElementById('site-header');
  const nav = document.getElementById('primary-nav');
  const toggle = header.querySelector('.menu-toggle');
  const bar = document.getElementById('read-progress-bar');
  const langButtons = header.querySelectorAll('[data-lang]');

  const syncLang = () => langButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === getLang())));
  langButtons.forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  syncLang();

  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', t(open ? 'nav.menuClose' : 'nav.menuOpen'));
    nav.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); } });
  onLangChange(() => { syncLang(); setMenu(nav.classList.contains('is-open')); });
  setMenu(false);

  // theme under the header + active link + progress
  const sections = [...document.querySelectorAll('main > section, .site-footer')];
  const links = new Map([...nav.querySelectorAll('a[href^="#"]')].map((a) => [a.getAttribute('href').slice(1), a]));
  let ticking = false;
  const update = () => {
    ticking = false;
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 10);
    const probe = 34;
    let current = sections[0];
    for (const s of sections) { if (s.getBoundingClientRect().top <= probe) current = s; }
    header.classList.toggle('is-light', LIGHT_THEMES.has(current.dataset.theme));
    let activeId = null;
    for (const s of sections) { if (s.id && links.has(s.id) && s.getBoundingClientRect().top <= window.innerHeight * 0.4) activeId = s.id; }
    links.forEach((a, id) => { a.classList.toggle('is-active', id === activeId); if (id === activeId) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();
}
