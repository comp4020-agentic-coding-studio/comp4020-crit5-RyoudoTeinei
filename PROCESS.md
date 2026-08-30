# Process overview

## What I built

Bloomshift is a five-minute browser survival game where a flower survives an increasingly crowded field. It fires automatically; defeated enemies leave growth seeds, and levels offer mutations. Defeating the final bloom wins; losing every heart or failing to defeat it ends the run. Bursting Seed makes defeated enemies trigger chain explosions. Its cream, coral, cyan and lime art and procedural sound were created for this prototype.

## The moments that mattered

### 1. Removing the tutorial without hiding the game

An instruction panel would violate the brief and delay play. Instead, one oversized play symbol starts the game, pointer or touch input moves the flower, and firing is automatic. The HUD shows only time, hearts, growth and level. I tested desktop and 390-pixel mobile layouts so play and movement remain visible without explanatory copy. This direction began in [`ab5ce29`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-RyoudoTeinei/commit/ab5ce29) and playing the built game exposed a blank opening second, so I placed one deliberately slow enemy at the edge to make the loop readable immediately in [`0ac6379`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-RyoudoTeinei/commit/0ac6379).

### 2. Letting the harness reject a plausible feature

I made contact fairness, input coverage and a single terminating run acceptance rules in `CLAUDE.md`. I separated contact damage from rendering and tested final-heart defeat plus the 900 ms invulnerability window ([`0ba9671`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-RyoudoTeinei/commit/0ba9671)). I then asked the agent to deepen the final stretch. It extended the run, added chain explosions and strengthened Web Audio, but also added endless continuation ([`b578349`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-RyoudoTeinei/commit/b578349)). That attractive feature violated the harness ban on postponed endings and second modes. Re-reading the rules exposed the drift, so I removed the continuation UI and state, restoring one forced ending ([`b326642`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-RyoudoTeinei/commit/b326642)). Typecheck, build and all 19 tests stayed green. The citations give the reading order: initial loop, playtest correction, rule under test, harness boundary, rollback.
