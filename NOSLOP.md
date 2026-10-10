# No slop

Phrasing that reads as AI-generated filler. Never use it in copy: UI strings,
`content/`, MIP explainers, README, OG images, contributor docs.

Anything that can be matched mechanically is enforced by
`scripts/check-slop.mjs` (`pnpm check:slop`, runs in CI). Rules that need
judgment are listed under "Judgment only" and are not checked by code.

When adding a rule: add the regex to `RULES` in the script, add an entry here,
then run `pnpm check:slop` and fix every hit.

## Enforced

### `not-just`: "X, not just Y" contrast framing

- **Flagged:** "Understand MIPs through visualizations, not just specs."
- **Pattern:** setting up a strawman to knock down. Covers `not just`,
  `not merely`, `not simply`, `not only`, `doesn't just`, `isn't just`,
  `more than just`, and other `-n't just/merely/simply/only` forms.
- **Why:** it implies a claim nobody made ("you thought it was only specs")
  so the real point can look bigger. It's filler with a fake contrast.
- **Instead:** state the positive claim directly. If scope really matters
  ("every account, including X"), say "including" or "also".
  - Before: "Understand MIPs through visualizations, not just specs."
  - After: "Change the inputs and watch the protocol respond."
  - Before: "MIP-8 doesn't just help existing contracts. It opens..."
  - After: "MIP-8 also opens..."

### `reality`: "reality" as a stand-in for a fact

- **Flagged:** "The storage engine touches 4,096 bytes for a 32-byte read.
  MIP-8 makes the EVM account for that page-sized reality."
- **Pattern:** the word "reality" (or "realities") used to dress up a
  technical fact: "hardware reality", "page-sized reality", "the reality is".
- **Why:** it sounds weighty and says nothing. The reader already has the
  fact; "reality" just repackages it as a grand noun.
- **Instead:** name the mechanism or the number.
  - Before: "MIP-8 makes the EVM account for that page-sized reality."
  - After: "MIP-8 proposes pricing gas by the page: the first read warms all
    128 slots on it."
  - Before: "Aligning EVM storage with hardware reality"
  - After: "Pricing EVM storage by the 4 KB page"

## Judgment only

### Slogan flow, and over-correcting it

- **Flagged:** "EVM memory has a quadratic cost curve. MIP-3 makes it linear."
  and "The storage engine touches 4,096 bytes for a 32-byte read. MIP-8 makes
  the EVM account for that page-sized reality."
- **Pattern:** neat rhetorical symmetry (quadratic / linear, problem / fix)
  standing in for information. Sounds like a tagline, carries no numbers.
- **Also flagged (the over-correction):** stitching every sentence together
  with ", so ..., and ..." or semicolons to make it look like reasoning.
  "EVM memory gets more expensive per byte the more you use, so a 1 MB buffer
  costs about 2.2 million gas. Under MIP-3 every word costs the same, and
  that buffer drops to about 16,000." is still slop. So is applying any one
  rewrite template across many strings: the sameness gives it away.
- **Target:** plain sentences, one fact each, real numbers, ordinary words.
  Short sentences are fine. No punchline, no forced connective.
  - "EVM memory gets more expensive per byte. A 1 MB buffer costs around
    2.2 million gas. With MIP-3 every word costs the same and 2.2 million can
    become 16,000."
- **Before rewriting a batch:** read each string on its own. If it already
  states plain facts, leave it alone.

### Bare "X, not Y"

Same family as `not-just`, but too common in legitimate technical precision
("charged by gas limit, not gas used", "a CALL, not STATICCALL") to grep for.
Keep it when Y is a real, plausible confusion the reader could have. Cut it
when Y is a strawman.
