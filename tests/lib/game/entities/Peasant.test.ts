import { describe, expect, it } from 'vitest';
import { Peasant, PEASANT_STATS } from '$lib/game/entities/characters';
import { FIREBALL_ITEM } from '$lib/game/items';

describe('Peasant', () => {
    it('uses peasant config stats', () => {
        const peasant = new Peasant(200, 300);

        expect(peasant.type).toBe('peasant');
        expect(peasant.lives).toBe(PEASANT_STATS.maxLives);
        expect(peasant.hp).toBe(PEASANT_STATS.maxHp);
        expect(peasant.speed).toBe(PEASANT_STATS.speed);
        expect(peasant.range).toBe(FIREBALL_ITEM.active!.range);
        expect(peasant.color).toBe(PEASANT_STATS.color);
        expect(peasant.sprite.layout.heightScale).toBe(PEASANT_STATS.sprite.layout.heightScale);
        expect(Object.keys(peasant.sprite.idle).sort()).toEqual(['ne', 'nw', 'se', 'sw']);
        expect(peasant.inventory.getActiveItemIds()).toEqual(['fireball']);
    });

    it('fires fireball within range', () => {
        const peasant = new Peasant(400, 300);
        const inRange = peasant.shoot({ x: 460, y: 300 });
        const outOfRange = peasant.shoot({ x: 400 + FIREBALL_ITEM.active!.range + 20, y: 300 });

        expect(inRange).toHaveLength(1);
        expect(inRange[0]?.damage).toBe(FIREBALL_ITEM.active!.damage);
        expect(inRange[0]?.type).toBe('fireball');
        expect(outOfRange).toHaveLength(0);
    });
});
