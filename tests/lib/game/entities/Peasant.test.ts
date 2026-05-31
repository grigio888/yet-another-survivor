import { describe, expect, it } from 'vitest';
import { Peasant, PEASANT_STATS } from '$lib/game/entities/characters';

describe('Peasant', () => {
    it('uses peasant config stats', () => {
        const peasant = new Peasant(200, 300);

        expect(peasant.type).toBe('peasant');
        expect(peasant.lives).toBe(PEASANT_STATS.maxLives);
        expect(peasant.hp).toBe(PEASANT_STATS.maxHp);
        expect(peasant.speed).toBe(PEASANT_STATS.speed);
        expect(peasant.range).toBe(PEASANT_STATS.range);
        expect(peasant.color).toBe(PEASANT_STATS.color);
        expect(peasant.sprite.layout.heightScale).toBe(PEASANT_STATS.sprite.layout.heightScale);
        expect(Object.keys(peasant.sprite.idle).sort()).toEqual(['ne', 'nw', 'se', 'sw']);
    });

    it('fires within short range', () => {
        const peasant = new Peasant(400, 300);
        const inRange = peasant.shoot({ x: 460, y: 300 });
        const outOfRange = peasant.shoot({ x: 400 + PEASANT_STATS.range + 20, y: 300 });

        expect(inRange).not.toBeNull();
        expect(inRange?.damage).toBe(PEASANT_STATS.projectileDamage);
        expect(outOfRange).toBeNull();
    });
});
