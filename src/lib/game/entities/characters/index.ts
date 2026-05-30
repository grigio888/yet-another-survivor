import { MAGE_STATS } from './Mage.js';

export { Character, type CharacterStats } from './Character.js';
export { Mage, MAGE_STATS } from './Mage.js';

export const CHARACTER_STATS = {
    mage: MAGE_STATS,
} as const;

export type CharacterId = keyof typeof CHARACTER_STATS;
