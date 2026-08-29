export const CONTACT_INVULNERABILITY_MS = 900;

export interface ContactState {
  health: number;
  lastHitAt: number;
}

export interface ContactResult extends ContactState {
  didDamage: boolean;
  ended: boolean;
}

export function resolveEnemyContact(
  state: ContactState,
  now: number,
  damage = 1,
): ContactResult {
  if (now - state.lastHitAt < CONTACT_INVULNERABILITY_MS) {
    return { ...state, didDamage: false, ended: state.health <= 0 };
  }

  const health = Math.max(0, state.health - damage);
  return {
    health,
    lastHitAt: now,
    didDamage: true,
    ended: health === 0,
  };
}

export function experienceNeeded(level: number): number {
  return 5 + level * 4;
}
