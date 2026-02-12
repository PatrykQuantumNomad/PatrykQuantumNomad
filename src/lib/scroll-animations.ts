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
    // Show card items too
    document.querySelectorAll('[data-card-item]').forEach((el) => {
      (el as HTMLElement).style.opacity = '1';
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

  // Animated section dividers — draw from left to right
  const dividers = gsap.utils.toArray<HTMLElement>('[data-divider-reveal]');
  dividers.forEach((el) => {
    gsap.set(el, { scaleX: 0, transformOrigin: 'left center' });
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        gsap.to(el, { scaleX: 1, duration: 1.2, ease: 'power2.inOut' });
      },
    });
  });

  // Tech pill scatter — pills settle into grid from random offsets
  initTechPillScatter();

  // Card group stagger — cascading reveal for grouped cards
  initCardGroupStagger();

  ScrollTrigger.refresh();
}

function initTechPillScatter() {
  const pills = gsap.utils.toArray<HTMLElement>('.tech-pill');
  if (!pills.length) return;

  pills.forEach((pill) => {
    gsap.set(pill, {
      x: (Math.random() - 0.5) * 40,
      y: (Math.random() - 0.5) * 20,
      rotation: (Math.random() - 0.5) * 8,
      opacity: 0,
    });
  });

  ScrollTrigger.batch(pills, {
    onEnter: (batch) => {
      gsap.to(batch, {
        x: 0,
        y: 0,
        rotation: 0,
        opacity: 1,
        stagger: 0.03,
        duration: 0.6,
        ease: 'back.out(1.2)',
        overwrite: true,
      });
    },
    start: 'top 85%',
    once: true,
  });
}

function initCardGroupStagger() {
  const groups = document.querySelectorAll<HTMLElement>('[data-card-group]');
  groups.forEach((group) => {
    const items = gsap.utils.toArray<HTMLElement>(
      group.querySelectorAll('[data-card-item]')
    );
    if (!items.length) return;

    gsap.set(items, { y: 30, opacity: 0 });

    ScrollTrigger.create({
      trigger: group,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(items, {
          y: 0,
          opacity: 1,
          stagger: 0.08,
          duration: 0.7,
          ease: 'power3.out',
          overwrite: true,
        });
      },
    });
  });
}
