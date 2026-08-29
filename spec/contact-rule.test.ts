import { describe, expect, it } from "vitest";
import {
  CONTACT_INVULNERABILITY_MS,
  resolveEnemyContact,
} from "../src/game-rules";

describe("rule: enemy contact costs one heart", () => {
  it("ends the run when contact removes the final heart", () => {
    const result = resolveEnemyContact(
      { health: 1, lastHitAt: -CONTACT_INVULNERABILITY_MS },
      0,
    );

    expect(result).toMatchObject({
      health: 0,
      didDamage: true,
      ended: true,
    });
  });

  it("does not drain several hearts during the same collision", () => {
    const first = resolveEnemyContact(
      { health: 5, lastHitAt: -CONTACT_INVULNERABILITY_MS },
      0,
    );
    const overlap = resolveEnemyContact(first, CONTACT_INVULNERABILITY_MS - 1);

    expect(overlap).toMatchObject({
      health: 4,
      didDamage: false,
      ended: false,
    });
  });
});
