# Contributing to MIP Land

Thank you for your interest in contributing to MIP Land - interactive explainers for Monad Improvement Proposals and blockchain research.

## How work lands

All changes go through a pull request, and every pull request needs an approving review from @portdeveloper before it can merge. Direct pushes to `master` are turned off. A merge means the work was read and accepted, not just that it was opened.

## About the Project

MIP Land turns dense technical specs and research papers into interactive, visual explainers. Each page lets you play with the underlying models rather than just reading about them.

**Stack:** Next.js 16 + React 19 + TypeScript + Tailwind CSS v4 + Framer Motion

### Vision

Keep each explainer focused, interactive, and visually clear. The goal is understanding through interaction, not walls of text.

### Project Status

Under active development. Current pages:

- `/mip-8` - Page-ified Storage
- `/mip-3` - Linear Memory
- `/mip-4` - Reserve Balance Introspection
- `/mip-7` - Extension Opcodes
- `/spam-mev` - Spam MEV equilibrium model (Category Labs)

## Getting Started

```bash
git clone https://github.com/portdeveloper/pageified-storage.git
cd pageified-storage
npm install
npm run dev
```

The dev server runs at `http://localhost:3000`.

## How to Contribute

Contributions are welcome via Issues and Pull Requests.

- **Report bugs** or **suggest features** by opening an Issue.
- **Add a new explainer page** for a MIP or research paper.
- **Improve existing interactives** with better visualizations or clearer explanations.
- **Fix bugs** or improve accessibility.

### Guidelines

- Search for existing Issues and PRs before creating your own.
- Each contribution should focus on one thing - don't mix a feature with style fixes.
- Use the existing code patterns (see below).
- If applicable, update the home page to link to new pages.

### Code Patterns

The codebase follows consistent patterns. Before contributing, look at an existing page like `/mip-8` or `/spam-mev`:

- **Page files** live in `src/app/<slug>/page.tsx` with exported `metadata`.
- **Section components** live in `src/components/<slug>/` - each section is its own file.
- **Scroll reveals** use the `useInView` hook with the `section-reveal` CSS class.
- **Animations** use Framer Motion with the standard easing `[0.16, 1, 0.3, 1]`.
- **Interactive controls** are `<input type="range">` sliders and button groups.
- **Color palette**: problem (warm red `#c4653a`), solution (cool green `#2a7d6a`), user (blue `#3b7dd8`), neutrals defined in `globals.css`.
- **Typography**: IBM Plex Sans for body, IBM Plex Mono for code/numbers.
- All interactive components need `"use client"` at the top.

### Rules

1. **Every PR requires an approved Issue first.** Open an Issue describing what you want to do and wait for a maintainer to agree before writing code. PRs without a linked, approved Issue will be closed.
2. Contributors must be humans, not bots.
3. First-time contributions must not be only spelling, grammar, or formatting fixes.
4. If you contribute with an AI agent, the agent must read and follow <https://most.devnads.com/agents.md>: wait for approval before writing code, one PR per day.
5. **One claimed issue per person at a time, across all pool repos.** A claim reserves the issue once a maintainer approves it. Claiming a second issue while you already hold one voids all of your claims, and a claim with no PR or progress update for 7 days gets released so someone else can take it.

### Issues

Open an Issue before doing any work. Describe what you want to change and why. This lets us discuss the approach, avoid duplicate effort, and say no early if the change doesn't fit.

When reporting a bug:
- Describe what you expected vs what happened.
- Include browser/OS if relevant.
- Screenshots help.

### Pull Requests

Once your Issue is approved, follow the fork-and-pull workflow:

1. Fork the repo
2. Create a branch with a descriptive name
3. Make your changes
4. Run `npm run build` to verify everything compiles
5. Push to your fork and open a PR

Tips for a good PR:
- Keep the title short and descriptive.
- Link the approved Issue.
- Describe what changed and why.
- One commit per logical change is fine; we squash-merge.

PRs without a linked Issue, or that change things not discussed in the Issue, will be closed. After review, we may ask questions or request changes. Once approved, we'll squash-and-merge.

## Adding a New Explainer Page

1. Create `src/app/<slug>/page.tsx` with metadata.
2. Create `src/components/<slug>/` with section components.
3. Follow the section pattern: hero, content sections, footer.
4. Add a card to the home page in `src/components/HomeContent.tsx`.
5. If the page has a model, put the math in a separate `model.ts` file.
6. Test with `npm run build` before submitting.
