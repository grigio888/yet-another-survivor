import { describe, expect, it } from 'vitest';
import { Chief } from '$lib/game/entities/enemies/Chief';
import { ENEMIES } from '$lib/game/config';

describe('Chief', () => {
    it('uses chief config stats', () => {
        const chief = new Chief(300, 400);

        expect(chief.type).toBe('chief');
        expect(chief.hp).toBe(ENEMIES.chief.hp);
        expect(chief.speed).toBe(ENEMIES.chief.speed);
        expect(chief.damage).toBe(ENEMIES.chief.damage);
        expect(chief.size).toBe(ENEMIES.chief.size);
        expect(chief.scoreValue).toBe(ENEMIES.chief.scoreValue);
    });

    it('pursues the target relentlessly', () => {
        const chief = new Chief(0, 0);
        const prevX = chief.x;

        const projectile = chief.update(1, 200, 0);

        expect(projectile).toBeNull();
        expect(chief.x).toBeGreaterThan(prevX);
    });
});
