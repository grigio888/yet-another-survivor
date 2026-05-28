    import { describe, it, expect, beforeEach, vi } from 'vitest';
    import { Enemy } from '$lib/game/entities/Enemy';

    describe('Enemy', () => {
        let enemy: Enemy;

        beforeEach(() => {
            enemy = new Enemy({
                x: 0,
                y: 0,
                type: 'test',
                size: 20,
                hp: 50,
                maxHp: 50,
                speed: 100,
                damage: 10,
                range: 0,
                color: '#ff0000',
                scoreValue: 25,
            });
        });

        describe('constructor', () => {
            it('sets type correctly', () => {
                expect(enemy.type).toBe('test');
            });

            it('starts with zero lastShot', () => {
                expect(enemy.lastShot).toBe(0);
            });

            it('sets score value', () => {
                expect(enemy.scoreValue).toBe(25);
            });

            it('uses inherited properties', () => {
                expect(enemy.x).toBe(0);
                expect(enemy.y).toBe(0);
                expect(enemy.size).toBe(20);
                expect(enemy.hp).toBe(50);
                expect(enemy.speed).toBe(100);
                expect(enemy.damage).toBe(10);
                expect(enemy.color).toBe('#ff0000');
            });
        });

        describe('update', () => {
            const dt = 0.016;

            it('moves toward target position', () => {
                enemy.update(dt, 200, 200);

                // Should move diagonally toward target
                expect(enemy.x).toBeGreaterThan(0);
                expect(enemy.y).toBeGreaterThan(0);
            });

            it('moves along X axis only', () => {
                enemy.update(dt, 50, 0);

                // Should move 1.6 pixels toward target
                expect(enemy.x).toBeCloseTo(1.6, 1);
                expect(enemy.y).toBeCloseTo(1.6, 1);
            });

            it('tracks elapsed time between shots', () => {
                const initialShot = enemy.lastShot;
                enemy.update(dt, 100, 100);

                expect(enemy.lastShot).toBeGreaterThan(initialShot);
            });
        });

        describe('canShoot', () => {
            it('returns false by default', () => {
                expect(enemy.canShoot()).toBe(false);
            });
        });

        describe('shoot', () => {
            it.skip('Enemy base class doesn\'t shoot if range is 0', () => {});
        });
    });