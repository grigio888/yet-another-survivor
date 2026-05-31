import { describe, expect, it } from 'vitest';
import { Grunt, GRUNT_STATS } from '$lib/game/entities/enemies/Grunt';

describe('Grunt', () => {
    it('uses grunt config stats', () => {
        const grunt = new Grunt(100, 200);

        expect(grunt.type).toBe('grunt');
        expect(grunt.hp).toBe(GRUNT_STATS.hp);
        expect(grunt.speed).toBe(GRUNT_STATS.speed);
        expect(grunt.damage).toBe(GRUNT_STATS.damage);
        expect(grunt.size).toBe(GRUNT_STATS.size);
        expect(grunt.scoreValue).toBe(GRUNT_STATS.scoreValue);
    });

    it('moves toward the target each frame', () => {
        const grunt = new Grunt(0, 0);
        const prevX = grunt.x;

        const projectile = grunt.update(1, 100, 0);

        expect(projectile).toBeNull();
        expect(grunt.x).toBeGreaterThan(prevX);
        expect(grunt.y).toBeCloseTo(0);
    });

    it('does not move when already on the target', () => {
        const grunt = new Grunt(50, 50);

        grunt.update(1, 50, 50);

        expect(grunt.x).toBe(50);
        expect(grunt.y).toBe(50);
    });
});
