// Combat system
// Handles damage calculation, health updates, kill detection, scoring,
// and player life loss.

import { SCORING } from '../config/index.js';
import type { Projectile, CollisionPair, CharacterHit, MeleeHit } from './collision.js';
import { findCollisions, findCharacterHits, findMeleeHits } from './collision.js';
import type { ItemEffect } from '../items/effects/types.js';
import { spawnItemEffects, tickItemEffects } from './itemEffects.js';
import { Enemy } from '../entities/enemies/Enemy.js';
import { Character } from '../entities/characters/Character.js';
import { getEntityAnchorPoint } from '../rendering/shadow.js';
import type { DamagePopup } from '../polish/damageNumbers.js';
import { enemyDamagePopup, playerDamagePopup } from '../polish/damagePopups.js';

export interface KillRecord {
    enemyIndex: number;
    enemyType: string;
    scoreValue: number;
}

export interface CombatResult {
    kills: KillRecord[];
    scoreGained: number;
    projectilesToRemove: Set<number>;
    enemyProjectilesToRemove: Set<number>;
}

export interface BattleResult {
    combat: CombatResult;
    characterHit: boolean;
    characterDamaged: boolean;
    characterDamage: number;
    damagePopups: DamagePopup[];
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
    enemy.takeDamage(damage);
    return prevHp - enemy.hp;
}

function resolveProjectileDamage(
    projectiles: Projectile[],
    enemies: Enemy[],
    collisionPairs: CollisionPair[],
    characterX: number,
): { kills: KillRecord[]; projectilesToRemove: Set<number>; damagePopups: DamagePopup[] } {
    const kills: KillRecord[] = [];
    const projectilesToRemove = new Set<number>();
    const damagePopups: DamagePopup[] = [];

    for (const pair of collisionPairs) {
        const {pIndex, eIndex} = pair;
        const projectile = projectiles[pIndex];
        const enemy = enemies[eIndex];

        if (!projectile || !enemy) continue;

        const wasAlive = enemy.isAlive();
        const damageDealt = applyDamageToEnemy(enemy, projectile.damage);

        projectilesToRemove.add(pIndex);

        if (damageDealt > 0) {
            damagePopups.push(enemyDamagePopup(enemy, damageDealt, characterX));
        }

        if (wasAlive && !enemy.isAlive() && damageDealt > 0) {
            kills.push({
                enemyIndex: eIndex,
                enemyType: enemy.type,
                scoreValue: enemy.scoreValue,
            });
        }
    }

    return {
        kills,
        projectilesToRemove,
        damagePopups,
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

    if (kills.length > 0) {
        stats.lastKillTime = now();
    }

    stats.kills += kills.length;
    stats.timeSurvived += dt;

    const timeBonus = Math.floor(dt * SCORING.timeBonusPerSec);
    scoreGained += timeBonus;
    stats.score += scoreGained;

    return scoreGained;
}

function playerHitSourceX(
    projectileCharCollisions: CharacterHit[],
    charEnemyCollisions: MeleeHit[],
    enemies: Enemy[],
    enemyProjectiles: Projectile[],
    characterX: number,
): number {
    if (charEnemyCollisions.length > 0) {
        const enemy = enemies[charEnemyCollisions[0].eIndex];
        if (enemy) return getEntityAnchorPoint(enemy).x;
    }

    if (projectileCharCollisions.length > 0) {
        const projectile = enemyProjectiles[projectileCharCollisions[0].pIndex];
        if (projectile) return projectile.x;
    }

    return characterX;
}

export function applyCombatKills(stats: CombatStats, kills: KillRecord[], dt: number): number {
    return updateCombatStats(stats, kills, dt);
}

export function processCombat(
    playerProjectiles: Projectile[],
    enemyProjectiles: Projectile[],
    enemies: Enemy[],
    character: Character,
    stats: CombatStats,
    dt: number,
    itemEffects: ItemEffect[] = [],
): BattleResult & { itemEffects: ItemEffect[] } {
    const {
        projectileEnEnemyCollisions,
        projectileCharCollisions,
        charEnemyCollisions,
    } = collisionDetection(playerProjectiles, enemyProjectiles, enemies, character);

    const characterAnchor = getEntityAnchorPoint(character);

    const {
        kills: playerKills,
        projectilesToRemove: playerProjectilesToRemove,
        damagePopups: projectileDamagePopups,
    } = resolveProjectileDamage(
        playerProjectiles,
        enemies,
        projectileEnEnemyCollisions,
        characterAnchor.x,
    );

    const itemTick = tickItemEffects(itemEffects, enemies, dt * 1000, characterAnchor.x);
    const allPlayerKills = [...playerKills, ...itemTick.kills];
    const damagePopups: DamagePopup[] = [...projectileDamagePopups, ...itemTick.damagePopups];

    const characterHit = projectileCharCollisions.length > 0 || charEnemyCollisions.length > 0;
    let characterDamage = 0;
    let characterDamaged = false;
    const enemyProjectilesToRemove = new Set<number>();

    if (characterHit) {
        for (const hit of projectileCharCollisions) {
            characterDamage += hit.damage;
            enemyProjectilesToRemove.add(hit.pIndex);
        }
        for (const hit of charEnemyCollisions) {
            characterDamage += hit.damage;
        }

        if (characterDamage > 0 && !character.isInvincible()) {
            character.takeDamage(characterDamage);
            characterDamaged = true;
            damagePopups.push(
                playerDamagePopup(
                    character,
                    characterDamage,
                    playerHitSourceX(
                        projectileCharCollisions,
                        charEnemyCollisions,
                        enemies,
                        enemyProjectiles,
                        characterAnchor.x,
                    ),
                ),
            );
        }
    }

    const scoreGained = updateCombatStats(stats, allPlayerKills, dt);

    return {
        combat: {
            kills: allPlayerKills,
            scoreGained,
            projectilesToRemove: playerProjectilesToRemove,
            enemyProjectilesToRemove,
        },
        characterHit,
        characterDamaged,
        characterDamage,
        damagePopups,
        itemEffects: itemTick.effects,
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
