import { describe, expect, it } from 'vitest';
import { CANVAS, ENEMIES, WAVES } from '../../../../src/lib/game/config';
import {
    createEnemy,
    isOutsideCanvasView,
    pickSpawnPosition,
    spawnEnemy,
    type EnemyType,
} from '../../../../src/lib/game/systems/spawning';

const ENEMY_TYPES: EnemyType[] = ['grunt', 'shooter', 'chief'];

describe('pickSpawnPosition', () => {
    it('always places the full enemy visual outside the canvas', () => {
        for (const type of ENEMY_TYPES) {
            const size = ENEMIES[type].size;

            for (let i = 0; i < 100; i++) {
                const { x, y } = pickSpawnPosition(
                    CANVAS.width,
                    CANVAS.height,
                    WAVES.spawnMargin,
                    size,
                );

                expect(isOutsideCanvasView(x, y, size)).toBe(true);
            }
        }
    });

    it('varies spawn locations across the outside margin', () => {
        const size = ENEMIES.grunt.size;
        const positions = new Set<string>();

        for (let i = 0; i < 80; i++) {
            const { x, y } = pickSpawnPosition(
                CANVAS.width,
                CANVAS.height,
                WAVES.spawnMargin,
                size,
            );
            positions.add(`${Math.round(x / 20)},${Math.round(y / 20)}`);
        }

        expect(positions.size).toBeGreaterThan(10);
    });
});

describe('spawnEnemy', () => {
    it('creates each enemy type fully outside the canvas view', () => {
        for (const type of ENEMY_TYPES) {
            const enemy = spawnEnemy(type);

            expect(isOutsideCanvasView(enemy.x, enemy.y, enemy.size)).toBe(true);
            expect(enemy.type).toBe(type);
        }
    });
});

describe('createEnemy', () => {
    it('instantiates the requested enemy class at the given position', () => {
        const grunt = createEnemy('grunt', 10, 20);
        const shooter = createEnemy('shooter', 30, 40);
        const chief = createEnemy('chief', 50, 60);

        expect(grunt.type).toBe('grunt');
        expect(grunt.x).toBe(10);
        expect(grunt.y).toBe(20);

        expect(shooter.type).toBe('shooter');
        expect(shooter.x).toBe(30);

        expect(chief.type).toBe('chief');
        expect(chief.y).toBe(60);
    });
});
