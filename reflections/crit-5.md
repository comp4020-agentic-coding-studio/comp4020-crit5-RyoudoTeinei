# Crit 5 reflection

## What breakthrough moved the work forward?

The breakthrough was treating “no gameplay instructions” as a design constraint rather than missing copy. Once firing became automatic, the opening screen only needed one unmistakable play control and movement could be learned by touching or pointing into the field. That decision simplified the interface and made the first encounter carry the explanation. The browser playtest still revealed a short blank opening, so I placed one slow enemy at the edge. Seeing the flower fire, the enemy burst and a growth seed appear communicates the whole loop more effectively than a paragraph could.

## How did this change my sense of myself as a developer?

I was reminded that a polished visual language does not compensate for an unclear first action. I often think of interface work as arranging information, but this prototype required me to choreograph understanding through timing, motion and consequence. I also became more deliberate about separating a game rule from its presentation. Moving contact damage into a small pure function made it possible to test the loss condition and invulnerability window directly, while canvas rendering remained free to change. The result feels less like a page containing a game and more like a coherent toy: the art, input, pacing, sound and automated check all reinforce the same small interaction.
