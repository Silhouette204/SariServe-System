import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initSmoothScroll() {
  if (!document.getElementById('landing-page')) return;

  // autoRaf: false, dahil ang ticker ng GSAP ang magpapatakbo
  const lenis = new Lenis({ autoRaf: false });

  // 1. Sabihan ang ScrollTrigger tuwing gumagalaw ang Lenis
  lenis.on('scroll', ScrollTrigger.update);

  // 2. Iisang loop lang: ang ticker ng GSAP
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Smooth anchor links (Home, About, Services, Contact)
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || href === '#') return;

    link.addEventListener('click', (e) => {
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -80 }); // -80 para hindi matakpan ng sticky navbar
    });
  });

  return lenis;
}