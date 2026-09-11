'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

export default function MotionReveal({ children, className, delay = 0, y = 26 }: { children: ReactNode; className?: string; delay?: number; y?: number }) {
  const reduced = useReducedMotion();
  return <motion.div
    className={className}
    initial={reduced ? false : { opacity: 0, y }}
    whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.14 }}
    transition={{ duration: 0.72, delay, ease: [0.16, 1, 0.3, 1] }}
  >{children}</motion.div>;
}
