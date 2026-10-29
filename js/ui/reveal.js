// Gentle reveal-on-scroll for section headings and blocks (disabled for reduced motion via CSS).
export function initReveal() {
  const targets = document.querySelectorAll('.chapter-head, .section-head, .two-col, .c1-intro, .exhibit__head, .compare, .anniversary, .solar-head');
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -10% 0px' });
  targets.forEach((el) => {
    // already on screen at load: show immediately
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    el.classList.add('reveal');
    io.observe(el);
  });
}
