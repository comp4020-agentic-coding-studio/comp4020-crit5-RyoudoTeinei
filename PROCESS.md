# Process overview

## What I built

Bloomshift is a three-minute browser survival game about steering a flower through an increasingly crowded field. It fires automatically, defeated enemies leave growth seeds, and levels offer mutations. A final bloom arrives near the end: defeating it completes the run, while losing every heart or leaving the boss alive ends it. Its cream, coral, cyan and lime art direction was developed specifically for this prototype.

## The moments that mattered

### 1. Removing the tutorial without hiding the game

The obvious solution was an instruction panel explaining movement, firing and upgrades. That would have violated the brief and delayed action. I instead used one oversized play symbol, pointer or touch movement, and automatic firing. The HUD only names changing state: time, hearts, growth and level. I checked desktop and 390-pixel mobile widths to confirm that play and movement remained visible without explanatory copy. This direction is captured in [`ab5ce29`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-RyoudoTeinei/commit/ab5ce29).

### 2. Turning a playtest hesitation into a rule and a pacing change

Contact damage is the run's central loss rule, so I separated it from the renderer and added a focused test for both the final-heart ending and the 900 ms invulnerability window ([`0ba9671`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-RyoudoTeinei/commit/0ba9671)). A mobile playtest then exposed a different problem: the first second looked empty, making the auto-fire mechanic harder to discover. I added one deliberately slow opening enemy at the nearest edge and delayed the random wave behind it. The next browser playtest showed the first shot, defeat and seed drop immediately, while the full typecheck, build and 19-test suite stayed green ([`0ac6379`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit5-RyoudoTeinei/commit/0ac6379)).
