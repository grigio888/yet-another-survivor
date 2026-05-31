import { describe, expect, it } from 'vitest';
import {
    createCharacter,
    CHARACTER_STATS,
    Mage,
    Peasant,
} from '$lib/game/entities/characters';

describe('createCharacter', () => {
    it('creates a mage', () => {
        const character = createCharacter('mage', 10, 20);

        expect(character).toBeInstanceOf(Mage);
        expect(character.type).toBe('mage');
        expect(character.x).toBe(10);
        expect(character.y).toBe(20);
    });

    it('creates a peasant', () => {
        const character = createCharacter('peasant', 30, 40);

        expect(character).toBeInstanceOf(Peasant);
        expect(character.type).toBe('peasant');
        expect(character.lives).toBe(CHARACTER_STATS.peasant.maxLives);
    });
});
