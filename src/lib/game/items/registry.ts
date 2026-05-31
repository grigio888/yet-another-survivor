import { FIREBALL_ITEM } from './active/Fireball.js';
import { SWIFT_BOOTS_ITEM } from './passive/SwiftBoots.js';

export const ITEMS = {
    fireball: FIREBALL_ITEM,
    swift_boots: SWIFT_BOOTS_ITEM,
} as const;

export type ItemId = keyof typeof ITEMS;

/** Default loadout — fireball in the first active slot. */
export const DEFAULT_STARTING_ITEMS = ['fireball'] as const satisfies readonly ItemId[];

export function getProjectileSpriteUrls(): string[] {
    return Object.values(ITEMS)
        .map((item) => item.active?.sprite)
        .filter((url): url is string => Boolean(url));
}
