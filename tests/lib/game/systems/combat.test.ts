import { describe, it, expect, beforeEach } from 'vitest';
import { processCombat, type CombatStats } from '$lib/game/systems/combat.js';
import { Mage, type Character } from '$lib/game/entities/characters/index.js';
import { Enemy } from '$lib/game/entities/enemies/Enemy.js';
import { ENEMIES, SCORING } from '$lib/game/config/index.js';
import type { Projectile } from '$lib/game/systems/collision.js';

function createMockStats(): CombatStats {
    return {
        score: 0,
        kills: 0,
        wave: 1,
        combo: 0,
        lastKillTime: Date.now(),
        timeSurvived: 0,
    };
}

describe('Combat System', () => {
    describe('processCombat', () => {
        let stats: CombatStats;
        let character: Character;
        let enemies: Enemy[];
        let playerProjectiles: Projectile[];
        let enemyProjectiles: Projectile[];

        beforeEach(() => {
            stats = createMockStats();
            character = new Mage(400, 300);
            enemies = [];
            playerProjectiles = [];
            enemyProjectiles = [];
        });

        it('applies player projectile damage to enemies', () => {
            // Create an enemy in range of player projectile
            const enemy = new Enemy({
                x: 500,
                y: 300,
                type: 'grunt',
                hp: 50,
                speed: 80,
                damage: 1,
                size: 24,
                color: '#4ade8f',
            });
            enemies.push(enemy);

            // Create a player projectile that will hit the enemy
            playerProjectiles.push({
                x: 496, // Close enough to enemy (size 24) to hit
                y: 300,
                direction: { dx: 1, dy: 0 },
                speed: 400,
                damage: 25,
            });

            const result = processCombat(playerProjectiles, enemyProjectiles, enemies, character, stats, 0.1);

            // Enemy should take 25 damage
            expect(enemy.hp).toBe(25);
            expect(result.combat.kills).toHaveLength(0); // Not dead yet
        });

        it('detects enemy kills and calculates score', () => {
            // Create an enemy with low HP
            const enemy = new Enemy({
                x: 500,
                y: 300,
                type: 'grunt',
                hp: 20, // Less than projectile damage
                speed: 80,
                damage: 1,
                size: 24,
                color: '#4ade8f',
            });
            enemies.push(enemy);

            // Create a player projectile that will kill the enemy
            playerProjectiles.push({
                x: 496,
                y: 300,
                direction: { dx: 1, dy: 0 },
                speed: 400,
                damage: 25,
            });

            const result = processCombat(playerProjectiles, enemyProjectiles, enemies, character, stats, 0.1);

            // Enemy should be dead
            expect(enemy.hp).toBeLessThanOrEqual(0);
            
            // Should have one kill
            expect(result.combat.kills).toHaveLength(1);
            expect(result.combat.kills[0].enemyType).toBe('grunt');
            expect(result.combat.kills[0].scoreValue).toBe(ENEMIES.grunt.scoreValue);
        });

        it('applies combo multiplier to score', () => {
            // Set up combo
            stats.combo = 2;
            stats.lastKillTime = Date.now();

            // Create two enemies
            for (let i = 0; i < 2; i++) {
                enemies.push(new Enemy({
                    x: 500 + i * 50,
                    y: 300,
                    type: 'grunt',
                    hp: 10,
                    speed: 80,
                    damage: 1,
                    size: 24,
                    color: '#4ade8f',
                }));

                playerProjectiles.push({
                    x: 496 + i * 50,
                    y: 300,
                    direction: { dx: 1, dy: 0 },
                    speed: 400,
                    damage: 25,
                });
            }

            const result = processCombat(playerProjectiles, enemyProjectiles, enemies, character, stats, 0.1);

            // Should have two kills with combo bonus
            expect(result.combat.kills).toHaveLength(2);
            
            // Score should reflect combo multiplier
            const baseScore = result.combat.kills.reduce((sum, k) => sum + k.scoreValue, 0);
            expect(result.combat.scoreGained).toBeGreaterThan(baseScore);
        });

        it('applies enemy projectile damage to player', () => {
            // Create enemy projectile that hits player
            enemyProjectiles.push({
                x: 398, // Close to player (size 20)
                y: 300,
                direction: { dx: -1, dy: 0 },
                speed: 300,
                damage: 15,
            });

            const prevLives = character.lives;
            const result = processCombat(playerProjectiles, enemyProjectiles, enemies, character, stats, 0.1);

            // Player should take damage (lose a life since damage is >= 1)
            expect(result.characterHit).toBe(true);
            expect(result.characterDamage).toBe(15);
            expect(character.lives).toBeLessThan(prevLives);
        });

        it('does not damage player if invincible', () => {
            character.invincibleUntil = Date.now() + 5000;

            enemyProjectiles.push({
                x: 398,
                y: 300,
                direction: { dx: -1, dy: 0 },
                speed: 300,
                damage: 15,
            });

            const prevLives = character.lives;
            const result = processCombat(playerProjectiles, enemyProjectiles, enemies, character, stats, 0.1);

            expect(result.characterHit).toBe(true);
            expect(character.lives).toBe(prevLives);
            expect(result.combat.enemyProjectilesToRemove.has(0)).toBe(true);
        });

        it('applies melee damage from enemies touching player', () => {
            enemies.push(new Enemy({
                x: 410,
                y: 300,
                type: 'grunt',
                hp: 30,
                speed: 80,
                damage: 1,
                size: 24,
                color: '#4ade8f',
            }));

            const prevLives = character.lives;
            const result = processCombat(playerProjectiles, enemyProjectiles, enemies, character, stats, 0.1);

            expect(result.characterHit).toBe(true);
            expect(result.characterDamage).toBe(1);
            expect(character.lives).toBe(prevLives - 1);
        });

        it('registers only one kill when multiple projectiles hit the same enemy', () => {
            const enemy = new Enemy({
                x: 500,
                y: 300,
                type: 'grunt',
                hp: 20,
                speed: 80,
                damage: 1,
                size: 24,
                color: '#4ade8f',
            });
            enemies.push(enemy);

            playerProjectiles.push(
                {
                    x: 496,
                    y: 300,
                    direction: { dx: 1, dy: 0 },
                    speed: 400,
                    damage: 25,
                },
                {
                    x: 498,
                    y: 300,
                    direction: { dx: 1, dy: 0 },
                    speed: 400,
                    damage: 25,
                },
            );

            const result = processCombat(playerProjectiles, enemyProjectiles, enemies, character, stats, 0.1);

            expect(result.combat.kills).toHaveLength(1);
            expect(stats.kills).toBe(1);
        });

        it('resets combo after decay window without kills', () => {
            stats.combo = 4;
            stats.lastKillTime = Date.now() - SCORING.comboDecayTime - 1;

            processCombat(playerProjectiles, enemyProjectiles, enemies, character, stats, 0.1);

            expect(stats.combo).toBe(0);
        });

        it('does not reset combo timer when there are no kills', () => {
            stats.combo = 2;
            const lastKillTime = Date.now() - 500;
            stats.lastKillTime = lastKillTime;

            processCombat(playerProjectiles, enemyProjectiles, enemies, character, stats, 0.1);

            expect(stats.combo).toBe(2);
            expect(stats.lastKillTime).toBe(lastKillTime);
        });

        it('updates time survived in stats', () => {
            const prevTime = stats.timeSurvived;
            processCombat(playerProjectiles, enemyProjectiles, enemies, character, stats, 1.0);

            expect(stats.timeSurvived).toBeGreaterThan(prevTime);
        });

        it('adds time-based score bonus', () => {
            const result = processCombat(playerProjectiles, enemyProjectiles, enemies, character, stats, 2.0);

            const expectedBonus = Math.floor(2.0 * SCORING.timeBonusPerSec);
            expect(result.combat.scoreGained).toBe(expectedBonus);
            expect(stats.score).toBe(expectedBonus);
        });
    });
});
