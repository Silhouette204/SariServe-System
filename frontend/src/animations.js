import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initAnimations() {
  
  if (!document.getElementById('landing-page')) return; 

  // Kung ayaw ng user ng galaw, laktawan lahat
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // 1. Hero: sunud-sunod na pasok pag-load
  gsap.from('.hero-item', {
    opacity: 0,
    y: 30,
    duration: 0.8,
    stagger: 0.15,
    ease: 'power2.out',
  });

  // 2. Mga section/elemento na lalabas habang nag-i-scroll
  gsap.utils.toArray('.reveal').forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      y: 40,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });

  // 3. Services cards: sunud-sunod, hindi sabay-sabay
  gsap.from('.service-card', {
    opacity: 0,
    y: 40,
    duration: 0.7,
    stagger: 0.15,
    ease: 'power2.out',
    scrollTrigger: { trigger: '#services .grid', start: 'top 80%', once: true },
  });
}