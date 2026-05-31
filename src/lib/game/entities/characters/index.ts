import { MAGE_STATS, MAGE_SPRITE } from './Mage.js';
import { PEASANT_STATS, PEASANT_SPRITE } from './Peasant.js';
import { Mage } from './Mage.js';
import { Peasant } from './Peasant.js';
import type { Character } from './Character.js';
import type { EntitySpriteConfig } from '../../animation/spriteConfig.js';

export { Character, type CharacterStats, type CharacterSpriteConfig, type CharacterSpriteLayout, type CharacterSpriteUrls, type SpriteFacing } from './Character.js';
export { Mage, MAGE_STATS, MAGE_SPRITE } from './Mage.js';
export { Peasant, PEASANT_STATS, PEASANT_SPRITE } from './Peasant.js';

export const CHARACTER_STATS = {
    mage: MAGE_STATS,
    peasant: PEASANT_STATS,
} as const;

export type CharacterId = keyof typeof CHARACTER_STATS;

export function getCharacterSpriteConfig(type: CharacterId): EntitySpriteConfig {
    return CHARACTER_STATS[type].sprite;
}

export function characterHasSpriteArt(_type: CharacterId): boolean {
    return true;
}

export function createCharacter(type: CharacterId, x?: number, y?: number): Character {
    switch (type) {
        case 'mage':
            return new Mage(x, y);
        case 'peasant':
            return new Peasant(x, y);
    }
}
