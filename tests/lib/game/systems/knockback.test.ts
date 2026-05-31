import { describe, it, expect, beforeEach } from 'vitest';
import { HitKnockback } from '$lib/game/systems/knockback.js';
import { Enemy } from '$lib/game/entities/enemies/Enemy.js';
import { TEST_ENEMY_SPRITE } from '../../../helpers/enemyTestSprite.js';
import { KNOCKBACK } from '$lib/game/config/index.js';
import type { Projectile } from '$lib/game/systems/collision.js';

const FRAME_DT = 1 / 60;

describe('HitKnockback', () => {
    let knockback: HitKnockback;

    beforeEach(() => {
        knockback = new HitKnockback();
    });

    it('is inactive until triggered', () => {
        expect(knockback.active).toBe(false);
    });

    it('pushes enemies within range away from the origin', () => {
        const enemy = new Enemy({
            x: 450,
            y: 300,
            type: 'grunt',
            hp: 30,
            speed: 80,
            damage: 1,
            size: 24,
            color: '#4ade8f',
            sprite: TEST_ENEMY_SPRITE,
        });

        knockback.trigger(400, 300, 100, [enemy]);
        expect(knockback.active).toBe(true);

        knockback.apply([enemy], FRAME_DT, 800, 600);

        expect(enemy.x).toBeGreaterThan(450);
        expect(enemy.y).toBeCloseTo(300, 5);
    });

    it('does not push enemies outside range', () => {
        const enemy = new Enemy({
            x: 600,
            y: 300,
            type: 'grunt',
            hp: 30,
            speed: 80,
            damage: 1,
            size: 24,
            color: '#4ade8f',
            sprite: TEST_ENEMY_SPRITE,
        });

        knockback.trigger(400, 300, 100, [enemy]);
        knockback.apply([enemy], FRAME_DT, 800, 600);

        expect(enemy.x).toBe(600);
        expect(enemy.y).toBe(300);
    });

    it('does not push enemy projectiles', () => {
        const projectile: Projectile = {
            x: 430,
            y: 300,
            direction: { dx: -1, dy: 0 },
            speed: 200,
            damage: 10,
        };

        knockback.trigger(400, 300, 100, []);

        expect(projectile.x).toBe(430);
        expect(projectile.y).toBe(300);
    });

    it('eases displacement over the full duration', () => {
        const enemy = new Enemy({
            x: 450,
            y: 300,
            type: 'grunt',
            hp: 30,
            speed: 80,
            damage: 1,
            size: 24,
            color: '#4ade8f',
            sprite: TEST_ENEMY_SPRITE,
        });

        knockback.trigger(400, 300, 100, [enemy]);

        const startX = enemy.x;
        const steps = Math.ceil(KNOCKBACK.durationMs / (FRAME_DT * 1000));

        for (let i = 0; i < steps; i++) {
            knockback.apply([enemy], FRAME_DT, 800, 600);
        }

        expect(enemy.x - startX).toBeCloseTo(KNOCKBACK.maxDistance, 0);
        expect(knockback.active).toBe(false);
    });

    it('skips dead enemies', () => {
        const enemy = new Enemy({
            x: 450,
            y: 300,
            type: 'grunt',
            hp: 0,
            speed: 80,
            damage: 1,
            size: 24,
            color: '#4ade8f',
            sprite: TEST_ENEMY_SPRITE,
        });

        knockback.trigger(400, 300, 100, [enemy]);
        knockback.apply([enemy], FRAME_DT, 800, 600);

        expect(enemy.x).toBe(450);
    });
});
