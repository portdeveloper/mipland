import { describe, expect, it } from "vitest";
import { HERO_STEPS, HERO_STEP_DELAY, nextHeroTick, type HeroTick } from "./heroTimeline";

describe("MIP-3 hero counter timeline", () => {
  it("waits before the first cycle, climbs, holds, and starts over", () => {
    let tick: HeroTick = { step: 0, cycle: 0 };
    const delays: number[] = [];
    // Two full cycles: every step, the hold, and the restart.
    for (let i = 0; i < 2 * (HERO_STEPS + 1); i += 1) {
      const { delay, ...next } = nextHeroTick(tick);
      delays.push(delay);
      tick = next;
    }

    expect(tick).toEqual({ step: 0, cycle: 2 });
    // First cycle starts after 1s, a restart after 0.5s, each plus one step.
    expect(delays[0]).toBe(1000 + HERO_STEP_DELAY);
    expect(delays[HERO_STEPS + 1]).toBe(500 + HERO_STEP_DELAY);
    // The last frame is held for 3s before resetting to step 0.
    expect(delays[HERO_STEPS]).toBe(3000);
    expect(delays.slice(1, HERO_STEPS)).toEqual(new Array(HERO_STEPS - 1).fill(HERO_STEP_DELAY));
  });

  it("resets from the last frame rather than stopping there", () => {
    expect(nextHeroTick({ step: HERO_STEPS, cycle: 3 })).toEqual({
      step: 0,
      cycle: 4,
      delay: 3000,
    });
  });
});
