/**
 * GridSense AI — shared motion language.
 * One easing curve and two variants, kept in a plain module so the
 * component files only export components (Fast Refresh stays happy).
 */

/** Long, confident ease-out — used for every reveal on the site. */
export const EASE = [0.16, 1, 0.3, 1];

/** Staggered parent for page-load choreography. */
export const staggerParent = (stagger = 0.075, delay = 0.05) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

/** Shared child variant: rises out of blur. */
export const riseChild = {
  hidden: { opacity: 0, y: 26, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.85, ease: EASE },
  },
};
