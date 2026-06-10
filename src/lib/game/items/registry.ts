import { FIREBALL_ITEM } from './active/Fireball.js';
import { THROWING_SPEAR_ITEM } from './active/ThrowingSpear.js';
import { IRON_SWORD_ITEM } from './active/IronSword.js';
import { ARCANE_NOVA_ITEM } from './active/ArcaneNova.js';
import { SWIFT_BOOTS_ITEM } from './passive/SwiftBoots.js';
import { collectAllItemVisualUrls, collectProjectileVisualUrls } from './visuals/collect.js';

export const ITEMS = {
    fireball: FIREBALL_ITEM,
    throwing_spear: THROWING_SPEAR_ITEM,
    iron_sword: IRON_SWORD_ITEM,
    arcane_nova: ARCANE_NOVA_ITEM,
    swift_boots: SWIFT_BOOTS_ITEM,
} as const;

export type ItemId = keyof typeof ITEMS;

/** Default loadout — one of each weapon type in active slots. */
export const DEFAULT_STARTING_ITEMS = [
    'fireball',
    'throwing_spear',
    'iron_sword',
    'arcane_nova',
] as const satisfies readonly ItemId[];

const ALL_ITEMS = Object.values(ITEMS);

/** Every image URL referenced by item visuals (icons + world art). */
export function getItemVisualUrls(): string[] {
    return collectAllItemVisualUrls(ALL_ITEMS);
}

/** Projectile travel sprites only — compatible with legacy projectile loader. */
export function getProjectileSpriteUrls(): string[] {
    return collectProjectileVisualUrls(ALL_ITEMS);
}

export const ACTIVE_ITEM_CATALOG = [
    { label: 'Fireball', id: 'fireball' as const },
    { label: 'Throwing Spear', id: 'throwing_spear' as const },
    { label: 'Iron Sword', id: 'iron_sword' as const },
    { label: 'Arcane Nova', id: 'arcane_nova' as const },
] as const;

export const PASSIVE_ITEM_CATALOG = [
    { label: 'Swift Boots', id: 'swift_boots' as const },
] as const;
