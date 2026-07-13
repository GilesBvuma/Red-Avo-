'use client';

import { useEffect, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

/**
 * useGsapScrollTrigger
 * A lightweight hook that wires up a GSAP ScrollTrigger animation
 * on a given ref element, with automatic cleanup.
 *
 * @param {React.RefObject} containerRef  – the scoping container ref
 * @param {(context: GSAPContext) => void} callback – receives the gsap context; build your animations here
 * @param {Array} deps – extra dependencies (re-runs animation if these change)
 */
export function useGsapScrollTrigger(containerRef, callback, deps = []) {
  useGSAP(
    () => {
      if (!containerRef.current) return;
      callback();
    },
    { scope: containerRef, dependencies: deps }
  );
}

/**
 * useGsapTimeline
 * Creates a GSAP timeline scoped to a container ref.
 * Returns the timeline so the caller can chain tweens.
 *
 * @param {React.RefObject} containerRef
 * @param {gsap.TimelineVars} vars – timeline options
 * @param {Array} deps
 * @returns {React.MutableRefObject<GSAPTimeline|null>}
 */
export function useGsapTimeline(containerRef, vars = {}, deps = []) {
  const tl = useRef(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;
      tl.current = gsap.timeline(vars);
    },
    { scope: containerRef, dependencies: deps }
  );

  return tl;
}
