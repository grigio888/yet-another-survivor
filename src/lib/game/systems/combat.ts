// Combat system
// Handles damage calculation, health updates, kill detection, scoring,
// and player life loss.

import { ENEMIES, SCORING } from '../config/index.js';
import type { Projectile, CollisionPair, CharacterHit, MeleeHit } from './collision.js';
import { findCollisions, findCharacterHits, findMeleeHits } from './collision.js';
import { Enemy } from '../entities/Enemy.js';
import { Character } from '../entities/Character.js';

export interface KillRecord {
    enemyIndex: number;
    enemyType: string;
    scoreValue: number;
}

export interface CombatResult {
    kills: KillRecord[];
    scoreGained: number;
    projectilesToRemove: Set<number>;
}

export interface BattleResult {
    combat: CombatResult;
    characterHit: boolean;
    characterDamage: number;
}

export interface CombatStats {
    score: number;
    kills: number;
    wave: number;
    combo: number;
    lastKillTime: number;
    timeSurvived: number;
}

function now(): number {
    return Date.now();
}

function applyDamageToEnemy(
    enemy: Enemy,
    damage: number
): number {
    const prevHp = enemy.hp;
    enemy.hp -= damage;
    return prevHp - enemy.hp;
}

function resolveProjectileDamage(
    projectiles: Projectile[],
    enemies: Enemy[],
    collisionPairs: CollisionPair[]
): { kills: KillRecord[]; projectilesToRemove: Set<number> } {
    const kills: KillRecord[] = [];
    const projectilesToRemove = new Set<number>();

    for (const pair of collisionPairs) {
        const {pIndex, eIndex} = pair;
        const projectile = projectiles[pIndex];
        const enemy = enemies[eIndex];

        if (!projectile || !enemy) continue;

        const damageDealt = applyDamageToEnemy(enemy, projectile.damage);

        projectilesToRemove.add(pIndex);

        if (!enemy.isAlive() && damageDealt > 0) {
            const enemyType = enemy.type;
            const enemyConfig = ENEMIES[enemyType as keyof typeof ENEMIES];
            const scoreValue = enemyConfig?.scoreValue || 10;
            kills.push({
                enemyIndex: eIndex,
                enemyType,
                scoreValue,
            });
        }
    }

    return {
        kills,
        projectilesToRemove,
    };
}

function updateCombatStats(
    stats: CombatStats,
    kills: KillRecord[],
    dt: number
): number {
    let scoreGained = 0;

    if (now() - stats.lastKillTime > SCORING.comboDecayTime) {
        stats.combo = 0;
    }

    for (const kill of kills) {
        const multiplier = 1 + stats.combo * (SCORING.comboMultiplier - 1);
        const killScore = Math.floor(kill.scoreValue * multiplier);
        scoreGained += killScore;
        stats.combo++;
    }

    stats.lastKillTime = now();
    stats.score += scoreGained;
    stats.kills += kills.length;
    stats.timeSurvived += dt;

    const timeBonus = Math.floor(dt * SCORING.timeBonusPerSec);
    scoreGained += timeBonus;

    return scoreGained;
}

export function processCombat(
    playerProjectiles: Projectile[],
    enemyProjectiles: Projectile[],
    enemies: Enemy[],
    character: Character,
    stats: CombatStats,
    dt: number
): BattleResult {
    const {
        projectileEnEnemyCollisions,
        projectileCharCollisions,
        charEnemyCollisions,
    } = collisionDetection(playerProjectiles, enemyProjectiles, enemies, character);

    const {
        kills: playerKills,
        projectilesToRemove: playerProjectilesToRemove,
    } = resolveProjectileDamage(
        playerProjectiles,
        enemies,
        projectileEnEnemyCollisions
    );

    const characterHit = projectileCharCollisions.length > 0 || charEnemyCollisions.length > 0;
    let characterDamage = 0;

    if (characterHit) {
        for (const hit of projectileCharCollisions) {
            characterDamage += hit.damage;
        }
        for (const hit of charEnemyCollisions) {
            characterDamage += hit.damage;
        }

        character.takeDamage(characterDamage);
    }

    const scoreGained = updateCombatStats(stats, playerKills, dt);

    return {
        combat: {
            kills: playerKills,
            scoreGained,
            projectilesToRemove: playerProjectilesToRemove,
        },
        characterHit,
        characterDamage,
    };
}

function collisionDetection(
    playerProjectiles: Projectile[],
    enemyProjectiles: Projectile[],
    enemies: Enemy[],
    character: Character
): {
    projectileEnEnemyCollisions: CollisionPair[];
    projectileCharCollisions: CharacterHit[];
    charEnemyCollisions: MeleeHit[];
} {
    const projectileEnEnemyCollisions = findCollisions(
        playerProjectiles,
        enemies
    );

    const projectileCharCollisions = findCharacterHits(
        enemyProjectiles,
        character
    );

    const charEnemyCollisions = findMeleeHits(
        enemies,
        character
    );

    return {
        projectileEnEnemyCollisions,
        projectileCharCollisions,
        charEnemyCollisions,
    };
}
