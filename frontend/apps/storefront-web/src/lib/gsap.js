'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Observer } from 'gsap/Observer';

gsap.registerPlugin(ScrollTrigger, Observer);

// Global GSAP defaults
gsap.defaults({
  ease: 'power3.out',
  duration: 0.75,
});

export { gsap, ScrollTrigger, Observer };
