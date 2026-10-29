// Logo reveal: the animation itself is CSS (css/intro.css); this adds skip, scroll lock and cleanup.
const KEY = 'journey-intro-seen';

export function initIntro() {
  const html = document.documentElement;
  const el = document.getElementById('intro');
  if (!el) return;
  if (!html.classList.contains('intro-on')) { el.remove(); return; }

  html.style.overflow = 'hidden';
  if (!location.hash) window.scrollTo(0, 0);
  const skipBtn = el.querySelector('.intro__skip');
  skipBtn.focus({ preventScroll: true });

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    try { sessionStorage.setItem(KEY, '1'); } catch { /* ignore */ }
    html.style.overflow = '';
    html.classList.remove('intro-on');
    el.remove();
    document.removeEventListener('keydown', onKey);
    if (new URLSearchParams(location.search).get('intro') === '1') {
      // drop ?intro=1 so a reload doesn't replay it
      const url = new URL(location.href);
      url.searchParams.delete('intro');
      history.replaceState(null, '', url);
    }
  };
  const skip = () => el.classList.add('is-skipping');
  const onKey = (e) => { if (e.key === 'Escape') skip(); };

  el.addEventListener('animationend', (e) => { if (e.target === el && e.animationName === 'introOut') finish(); });
  skipBtn.addEventListener('click', skip);
  el.addEventListener('click', (e) => { if (e.target !== skipBtn) skip(); });
  document.addEventListener('keydown', onKey);
  // safety net in case animation events never fire (e.g. background tab)
  setTimeout(finish, 6000);
}
