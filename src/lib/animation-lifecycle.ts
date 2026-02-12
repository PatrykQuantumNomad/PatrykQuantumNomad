import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

let lenisInstance: Lenis | null = null;

export function setLenisInstance(lenis: Lenis) {
  lenisInstance = lenis;
}

export function getLenisInstance(): Lenis | null {
  return lenisInstance;
}

export function cleanupAnimations() {
  ScrollTrigger.getAll().forEach((t) => t.kill());
  if (lenisInstance) {
    lenisInstance.destroy();
    lenisInstance = null;
  }
  gsap.killTweensOf('*');
}
