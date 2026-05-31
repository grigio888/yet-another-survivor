import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WAVES } from '$lib/game/config';
import { isOutsideCanvasView } from '$lib/game/systems/arenaBounds';
import { SpawningSystem } from '$lib/game/systems/spawning';

describe('SpawningSystem', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2020-01-01T00:00:00Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('startGame initializes wave 1 state', () => {
        const system = new SpawningSystem();
        system.startGame({ x: 400, y: 300 });

        expect(system.getWave()).toBe(1);
        expect(system.getWaveQuota()).toBe(WAVES.initialEnemies);
        expect(system.getSpawnedThisWave()).toBe(0);
        expect(system.getAliveCount()).toBe(0);
    });

    it('spawns an enemy after the wave spawn interval', () => {
        const system = new SpawningSystem();
        system.startGame({ x: 400, y: 300 });

        system.update(2.1);

        expect(system.getSpawnedThisWave()).toBe(1);
        expect(system.getAliveCount()).toBe(1);
        expect(system.getEnemyList()[0].isAlive()).toBe(true);
    });

    it('spawnManualEnemy adds an off-screen enemy to the live list', () => {
        const system = new SpawningSystem();
        system.startGame({ x: 400, y: 300 });

        const enemy = system.spawnManualEnemy('chief');

        expect(enemy.type).toBe('chief');
        expect(system.getAliveCount()).toBe(1);
        expect(isOutsideCanvasView(enemy.x, enemy.y, enemy.hitbox.x, enemy.hitbox.y)).toBe(true);
        expect(system.getEnemyList()).toContain(enemy);
    });

    it('pruneDeadEnemies removes defeated enemies', () => {
        const system = new SpawningSystem();
        system.startGame({ x: 400, y: 300 });
        const enemy = system.spawnManualEnemy('grunt');
        enemy.hp = 0;

        system.pruneDeadEnemies();

        expect(system.getAliveCount()).toBe(0);
        expect(system.getEnemyList()).toHaveLength(0);
    });

    it('updateAllEnemies returns shooter projectiles and moves grunts', () => {
        const system = new SpawningSystem();
        system.startGame({ x: 400, y: 300 });
        const grunt = system.spawnManualEnemy('grunt');
        grunt.x = 100;
        grunt.y = 300;

        const shooter = system.spawnManualEnemy('shooter');
        shooter.x = 420;
        shooter.y = 300;
        shooter.lastShot = 9999;

        const { projectiles } = system.updateAllEnemies(1, 400, 300);

        expect(grunt.x).toBeGreaterThan(100);
        expect(projectiles.length).toBe(1);
        expect(projectiles[0].damage).toBeGreaterThan(0);
    });

    it('endGame stops spawning and clears wave state', () => {
        const system = new SpawningSystem();
        system.startGame({ x: 400, y: 300 });
        system.spawnManualEnemy('grunt');

        system.endGame();

        expect(system.getWave()).toBe(0);
        expect(system.getAliveCount()).toBe(0);
        expect(system.update(2).spawned).toEqual([]);
    });

    it('reset restarts wave 1 with a clean enemy list', () => {
        const system = new SpawningSystem();
        system.startGame({ x: 400, y: 300 });
        system.spawnManualEnemy('grunt');
        system.update(20);

        system.reset();

        expect(system.getWave()).toBe(1);
        expect(system.getAliveCount()).toBe(0);
        expect(system.getSpawnedThisWave()).toBe(0);
        expect(system.getWaveQuota()).toBe(WAVES.initialEnemies);
    });
});
