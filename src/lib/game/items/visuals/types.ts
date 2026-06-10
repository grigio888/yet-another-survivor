import type { EntitySpriteConfig } from '../../animation/spriteConfig.js';
import type { SpriteFrame } from '../../animation/spriteFrame.js';
import type { ActivePerkKind } from '../types.js';

/** HUD / loadout icon — always static. */
export type ItemIconVisual = {
    src: string;
    size: number;
};

/** In-flight bolt — sprite authored facing north unless rotateWithTravel is false. */
export type ProjectileItemVisual = {
    kind: 'projectile';
    sprite: SpriteFrame;
    size: number;
    rotateWithTravel?: boolean;
};

/**
 * Short-range swing at the wielder's anchor + facing.
 * Use a single frame for now; pass animated for multi-frame slashes later.
 */
export type MeleeItemVisual = {
    kind: 'melee';
    sprite: SpriteFrame | EntitySpriteConfig;
    size: number;
    /** Visible arc in degrees — matches future hitbox debug overlay. */
    arcDegrees?: number;
    durationMs?: number;
};

/** Ground disk / aura centered on a world point. */
export type AreaItemVisual = {
    kind: 'area';
    sprite: SpriteFrame | EntitySpriteConfig;
    size: number;
    /** Visual radius in pixels — should match active perk radius. */
    radius: number;
    durationMs?: number;
};

export type ItemWorldVisual = ProjectileItemVisual | MeleeItemVisual | AreaItemVisual;

/** Visual bundle for an active item — world art kind matches active.perk.kind. */
export type ActiveItemVisuals = {
    icon: ItemIconVisual;
    world: ItemWorldVisual;
};

/** Passive items only need an icon. */
export type PassiveItemVisuals = {
    icon: ItemIconVisual;
};

export type ItemVisuals = ActiveItemVisuals | PassiveItemVisuals;

export function isActiveItemVisuals(visuals: ItemVisuals): visuals is ActiveItemVisuals {
    return 'world' in visuals;
}

export function worldVisualMatchesAttack(
    visuals: ActiveItemVisuals,
    attackKind: ActivePerkKind,
): boolean {
    return visuals.world.kind === attackKind;
}

export function getItemIconVisual(visuals: ItemVisuals | null | undefined): ItemIconVisual | null {
    return visuals?.icon ?? null;
}

export function getItemWorldVisual(
    visuals: ItemVisuals | null | undefined,
): ItemWorldVisual | null {
    if (!visuals || !isActiveItemVisuals(visuals)) return null;
    return visuals.world;
}
