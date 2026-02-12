import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const REDUCED_MOTION = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initScrollAnimations() {
  if (REDUCED_MOTION) {
    // Instantly show all reveal elements
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      (el as HTMLElement).style.opacity = '1';
      (el as HTMLElement).style.clipPath = 'none';
      (el as HTMLElement).style.transform = 'none';
    });
    return;
  }

  // Clip-path reveal animation with stagger
  const revealElements = gsap.utils.toArray<HTMLElement>('[data-reveal]');
  if (revealElements.length) {
    // Set initial clipped state based on direction
    revealElements.forEach((el) => {
      const dir = el.dataset.reveal || 'up';
      if (dir === 'left') {
        gsap.set(el, { clipPath: 'inset(0 100% 0 0)', opacity: 1 });
      } else if (dir === 'right') {
        gsap.set(el, { clipPath: 'inset(0 0 0 100%)', opacity: 1 });
      } else {
        gsap.set(el, { clipPath: 'inset(100% 0 0 0)', opacity: 1 });
      }
    });

    ScrollTrigger.batch(revealElements, {
      onEnter: (batch) => {
        gsap.to(batch, {
          clipPath: 'inset(0 0 0 0)',
          stagger: 0.08,
          duration: 0.9,
          ease: 'power3.out',
          overwrite: true,
        });
      },
      start: 'top 88%',
      once: true,
    });
  }

  // Parallax for hero
  document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
    gsap.to(el, {
      y: 120,
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });
  });

  ScrollTrigger.refresh();
}
