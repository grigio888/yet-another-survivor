/** Runtime VFX / hitbox instances spawned when an active item fires. */

export type MeleeSwingEffect = {
    kind: 'melee';
    itemId: string;
    x: number;
    y: number;
    facing: { dx: number; dy: number };
    damage: number;
    reach: number;
    arcDegrees: number;
    elapsedMs: number;
    durationMs: number;
    damageApplied: boolean;
};

export type AreaZoneEffect = {
    kind: 'area';
    itemId: string;
    x: number;
    y: number;
    radius: number;
    damage: number;
    elapsedMs: number;
    durationMs: number;
    damageApplied: boolean;
};

export type ItemEffect = MeleeSwingEffect | AreaZoneEffect;

export function tickItemEffect(effect: ItemEffect, dtMs: number): ItemEffect | null {
    const elapsedMs = effect.elapsedMs + dtMs;
    if (elapsedMs >= effect.durationMs) return null;
    return { ...effect, elapsedMs };
}

export function isItemEffectActive(effect: ItemEffect): boolean {
    return effect.elapsedMs < effect.durationMs;
}
