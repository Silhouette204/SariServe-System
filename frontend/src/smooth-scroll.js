import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

export function initSmoothScroll() {
  if (!document.getElementById('landing-page')) {
    console.log('Lenis: hindi landing page');
    return;
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  console.log('Lenis: reduce motion =', reduceMotion);
  // pansamantalang naka-comment para ma-test
  // if (reduceMotion) return;

  const lenis = new Lenis({ autoRaf: true });
  console.log('Lenis: tumatakbo na');

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || href === '#') return; // iwasan ang href="#"

    link.addEventListener('click', (e) => {
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -30 });
    });
  });
}