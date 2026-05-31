import { describe, it, expect, beforeEach } from 'vitest';
import { Enemy } from '$lib/game/entities/enemies/Enemy.js';
import { Grunt, GRUNT_STATS } from '$lib/game/entities/enemies/Grunt.js';
import { TEST_ENEMY_SPRITE } from '../../../helpers/enemyTestSprite.js';

const FRAME_DT = 1 / 60;

describe('Enemy animation', () => {
    describe('with sprite config', () => {
        let enemy: Enemy;

        beforeEach(() => {
            enemy = new Enemy({
                x: 100,
                y: 100,
                type: 'grunt',
                size: 24,
                hp: 30,
                speed: 80,
                damage: 1,
                color: '#4ade8f',
                sprite: TEST_ENEMY_SPRITE,
            });
        });

        it('plays hit when damaged below stagger threshold', () => {
            enemy.takeDamage(5);
            expect(enemy.animator?.getState()).toBe('hit');
            expect(enemy.isStaggered()).toBe(false);
        });

        it('staggers when damage meets stagger threshold', () => {
            enemy = new Enemy({
                x: 100,
                y: 100,
                type: 'grunt',
                size: 24,
                hp: 30,
                speed: 80,
                damage: 1,
                stagger: 10,
                staggerTime: 400,
                color: '#4ade8f',
                sprite: TEST_ENEMY_SPRITE,
            });

            enemy.takeDamage(10);
            expect(enemy.isStaggered()).toBe(true);
            expect(enemy.animator?.getState()).toBe('hit');
        });

        it('clears stagger after staggerTime elapses', () => {
            enemy = new Enemy({
                x: 100,
                y: 100,
                type: 'grunt',
                size: 24,
                hp: 30,
                speed: 80,
                damage: 1,
                stagger: 10,
                staggerTime: 400,
                color: '#4ade8f',
                sprite: TEST_ENEMY_SPRITE,
            });

            enemy.takeDamage(10);
            enemy.update(0.5, 100, 100);
            expect(enemy.isStaggered()).toBe(false);
        });

        it('enters dying when killed', () => {
            enemy.takeDamage(enemy.hp);
            expect(enemy.animator?.getState()).toBe('dying');
        });
    });

    describe('without sprite config', () => {
        it('uses square fallback entities with no animator', () => {
            const grunt = new Grunt(100, 100);
            expect(grunt.animator).toBeNull();
            grunt.takeDamage(grunt.hp);
            expect(grunt.isReadyToRemove()).toBe(true);
        });

        it('still updates movement for grunts', () => {
            const grunt = new Grunt(100, 100);
            grunt.update(FRAME_DT, 200, 100);
            expect(grunt.x).toBeGreaterThan(100);
            expect(grunt.facing.dx).toBeGreaterThan(0);
        });

        it('blocks movement while staggered', () => {
            const grunt = new Grunt(100, 100);
            grunt.takeDamage(GRUNT_STATS.stagger);
            const prevX = grunt.x;
            grunt.update(FRAME_DT, 200, 100);
            expect(grunt.x).toBe(prevX);
            expect(grunt.isStaggered()).toBe(true);
        });
    });
});
