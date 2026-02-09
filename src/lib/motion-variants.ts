import type { Variants, Transition } from 'framer-motion';

export const ease: Transition = { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: ease },
};

export const stagger: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

export const expandCollapse = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
  exit: { height: 0, opacity: 0, transition: { duration: 0.2 } },
};
