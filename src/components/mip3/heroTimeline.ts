export const HERO_STEPS = 40;
export const HERO_STEP_DELAY = 80;
const START_DELAY = 1000;
const END_PAUSE = 3000;
const RESTART_DELAY = 500;

export interface HeroTick {
  step: number;
  cycle: number;
}

/**
 * The next frame of the hero counter and how long to wait for it.
 *
 * The counter climbs to HERO_STEPS, holds the last frame, then starts over.
 * The first cycle waits a little longer before it begins.
 */
export function nextHeroTick({ step, cycle }: HeroTick): HeroTick & { delay: number } {
  if (step >= HERO_STEPS) return { step: 0, cycle: cycle + 1, delay: END_PAUSE };
  if (step === 0) {
    const wait = cycle === 0 ? START_DELAY : RESTART_DELAY;
    return { step: 1, cycle, delay: wait + HERO_STEP_DELAY };
  }
  return { step: step + 1, cycle, delay: HERO_STEP_DELAY };
}
