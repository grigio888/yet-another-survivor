import { describe, expect, it } from 'vitest';
import { Chief, CHIEF_STATS } from '$lib/game/entities/enemies/Chief';

describe('Chief', () => {
    it('uses chief config stats', () => {
        const chief = new Chief(300, 400);

        expect(chief.type).toBe('chief');
        expect(chief.hp).toBe(CHIEF_STATS.hp);
        expect(chief.speed).toBe(CHIEF_STATS.speed);
        expect(chief.damage).toBe(CHIEF_STATS.damage);
        expect(chief.size).toBe(CHIEF_STATS.size);
        expect(chief.scoreValue).toBe(CHIEF_STATS.scoreValue);
    });

    it('pursues the target relentlessly', () => {
        const chief = new Chief(0, 0);
        const prevX = chief.x;

        const projectile = chief.update(1, 200, 0);

        expect(projectile).toBeNull();
        expect(chief.x).toBeGreaterThan(prevX);
    });
});
