import { MAGE_STATS } from './Mage.js';
import { PEASANT_STATS } from './Peasant.js';
import { Mage } from './Mage.js';
import { Peasant } from './Peasant.js';
import type { Character } from './Character.js';

export { Character, type CharacterStats, type CharacterSpriteConfig, type CharacterSpriteLayout, type CharacterSpriteUrls, type SpriteFacing } from './Character.js';
export { Mage, MAGE_STATS } from './Mage.js';
export { Peasant, PEASANT_STATS } from './Peasant.js';

export const CHARACTER_STATS = {
    mage: MAGE_STATS,
    peasant: PEASANT_STATS,
} as const;

export type CharacterId = keyof typeof CHARACTER_STATS;

export function createCharacter(type: CharacterId, x?: number, y?: number): Character {
    switch (type) {
        case 'mage':
            return new Mage(x, y);
        case 'peasant':
            return new Peasant(x, y);
    }
}
