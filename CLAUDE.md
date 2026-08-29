# COMP4020 prototype

Your starter repo for a COMP4020 prototype: a static site in HTML/CSS/TypeScript
that builds to plain HTML/CSS/JS and deploys to GitHub Pages. The deployed site
is what gets marked, not this repo.

The
[course website](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/)
publishes this deliverable's brief and spec, and this repo's name tells you
which deliverable applies. Read both before you plan or build.

## The link-preview card

`public/card.png` (1200x630) is the image a shared link shows; `index.html`'s
head points at it. Replace it and the `description` meta, and copy the head
block into any new page. The card URL resolves against the page that names it,
like any link --- `./card.png` is wrong one directory down, and nothing in CI
checks it, so the deployed head is the only place a broken one shows up.

## The checks

`pnpm check` runs them, and `pnpm check:evidence` is the extra gate before you
ship. CI runs the same plus links, secrets and the deploy.

`spec/README.md`, `PROCESS.md` and `reflections/README.md` are in this repo and
say what they are for.

## This file is yours

A starting point, not a rulebook: what you add to it is the harness, and the
harness is assessed. This file and the sensors you wire into `check` carry
across the course --- both come with you into next week's repo. The prototype
doesn't: source, and the tests answering this week's published spec, stay
behind. `spec/README.md` draws the line.

## Bloomshift harness

- Treat this as a new visual system. Do not import layouts, palettes, motifs or
  components from earlier course prototypes.
- The shipped page must contain no gameplay tutorial, instruction screen or
  explanatory copy. Affordance, pacing and feedback teach the interaction.
- Keep the playable rule set separate from canvas rendering. Any rule cited as
  automated evidence belongs in `src/game-rules.ts` and receives a focused
  Vitest contract.
- The same run must remain playable with pointer, touch and keyboard input.
  Verify changes at desktop and narrow mobile viewports before accepting them.
- A run always reaches a win or loss in under five minutes. Do not add systems
  that postpone the ending, permanent progression or a second game mode.
- Optimise for one polished loop: move, auto-fire, collect, choose and face the
  final bloom. Reject features that make this loop harder to read cold.
