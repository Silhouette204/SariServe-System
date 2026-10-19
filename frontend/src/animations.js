import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Isang trigger bawat element, para bawat isa ay may sariling oras ng labas
function animateOnScroll(selector, fromVars) {
  gsap.utils.toArray(selector).forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out',
      ...fromVars,
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });
}

export function initAnimations() {
  console.log('1. initAnimations called');
  if (!document.getElementById('landing-page')) return;
  console.log('2. landing page found');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    console.log('3. STOPPED: reduced motion is ON');
    return;
  }
  console.log('4. animations running');

  // Hero: sunud-sunod pag-load (hindi scroll)
  gsap.from('.hero-item', {
    opacity: 0, y: 30, duration: 0.8, stagger: 0.15, ease: 'power2.out',
  });

  // Scroll animations
  animateOnScroll('.fade-up',     { y: 40 });
  animateOnScroll('.slide-left',  { x: -60 });
  animateOnScroll('.slide-right', { x: 60 });
  animateOnScroll('.zoom-in',     { scale: 0.9 });

  // Services cards: sunud-sunod
  gsap.from('.service-card', {
    opacity: 0, y: 40, duration: 0.7, stagger: 0.15, ease: 'power2.out',
    scrollTrigger: { trigger: '#services .grid', start: 'top 80%', once: true },
  });

  // Ang taas ng page ay nagbabago kapag nag-load ang images at JS content
  ScrollTrigger.refresh();
  window.addEventListener('load', () => ScrollTrigger.refresh());
}