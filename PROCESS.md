# Process overview

## What I built

Bloomshift is a five-minute browser survival game about steering a flower through an increasingly crowded field. It fires automatically; defeated enemies leave growth seeds, and levels offer mutations. A final bloom arrives near the end: defeating it offers a restart or an endless continuation with the completed build. Bursting Seed lets defeated enemies trigger chain explosions. Its cream, coral, cyan and lime art and layered procedural sound were created for this prototype.

## The moments that mattered

### 1. Removing the tutorial without hiding the game

An instruction panel could explain movement, firing and upgrades, but it would violate the brief and delay play. Instead, one oversized play symbol starts the game, pointer or touch input moves the flower, and firing is automatic. The HUD only names changing state: time, hearts, growth and level. I tested desktop and 390-pixel mobile layouts so play and movement remain visible without explanatory copy. This direction began in [`ab5ce29`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-RyoudoTeinei/commit/ab5ce29) and the deliberately slow first enemy made the loop immediately readable in [`0ac6379`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-RyoudoTeinei/commit/0ac6379).

### 2. Turning playtest problems into rules and pacing

Contact damage is the central loss rule, so I separated it from rendering and tested both the final-heart ending and the 900 ms invulnerability window ([`0ba9671`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-RyoudoTeinei/commit/0ba9671)). Later play showed that defeating the boss felt too final. I extended the run to five minutes, added replay and endless choices, and introduced chain explosions as the seventh upgrade. I also strengthened the Web Audio mix so attacks, impacts, pickups and the boss remain distinct. These changes are recorded in [`b578349`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-RyoudoTeinei/commit/b578349). The typecheck, build and 19-test suite remained green.
