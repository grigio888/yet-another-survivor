import { mage } from './mage.js';

export type { CharacterConfig } from './types.js';
export { mage } from './mage.js';

export const CHARACTERS = {
    mage,
} as const;

export type CharacterId = keyof typeof CHARACTERS;
