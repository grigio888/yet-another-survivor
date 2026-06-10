import type { Enemy } from '../entities/enemies/Enemy.js';
import type { AreaZoneEffect, ItemEffect, MeleeSwingEffect } from '../items/effects/types.js';
import { tickItemEffect } from '../items/effects/types.js';
import type { KillRecord } from './combat.js';
import { findAreaCircleHits, findMeleeArcHits } from './itemCombat.js';
import type { DamagePopup } from '../polish/damageNumbers.js';
import { enemyDamagePopup } from '../polish/damagePopups.js';

function applyDamageToEnemy(enemy: Enemy, damage: number): number {
    const prevHp = enemy.hp;
    enemy.takeDamage(damage);
    return prevHp - enemy.hp;
}

function resolveMeleeEffect(
    effect: MeleeSwingEffect,
    enemies: Enemy[],
    characterX: number,
): { effect: MeleeSwingEffect; kills: KillRecord[]; damagePopups: DamagePopup[] } {
    if (effect.damageApplied) {
        return { effect, kills: [], damagePopups: [] };
    }

    const hitIndices = findMeleeArcHits(effect, enemies);
    const kills: KillRecord[] = [];
    const damagePopups: DamagePopup[] = [];

    for (const index of hitIndices) {
        const enemy = enemies[index];
        if (!enemy?.isAlive()) continue;

        const wasAlive = enemy.isAlive();
        const damageDealt = applyDamageToEnemy(enemy, effect.damage);
        if (damageDealt > 0) {
            damagePopups.push(enemyDamagePopup(enemy, damageDealt, characterX));
        }
        if (wasAlive && !enemy.isAlive() && damageDealt > 0) {
            kills.push({
                enemyIndex: index,
                enemyType: enemy.type,
                scoreValue: enemy.scoreValue,
            });
        }
    }

    return {
        effect: { ...effect, damageApplied: true },
        kills,
        damagePopups,
    };
}

function resolveAreaEffect(
    effect: AreaZoneEffect,
    enemies: Enemy[],
    characterX: number,
): { effect: AreaZoneEffect; kills: KillRecord[]; damagePopups: DamagePopup[] } {
    if (effect.damageApplied) {
        return { effect, kills: [], damagePopups: [] };
    }

    const hitIndices = findAreaCircleHits(effect, enemies);
    const kills: KillRecord[] = [];
    const damagePopups: DamagePopup[] = [];

    for (const index of hitIndices) {
        const enemy = enemies[index];
        if (!enemy?.isAlive()) continue;

        const wasAlive = enemy.isAlive();
        const damageDealt = applyDamageToEnemy(enemy, effect.damage);
        if (damageDealt > 0) {
            damagePopups.push(enemyDamagePopup(enemy, damageDealt, characterX));
        }
        if (wasAlive && !enemy.isAlive() && damageDealt > 0) {
            kills.push({
                enemyIndex: index,
                enemyType: enemy.type,
                scoreValue: enemy.scoreValue,
            });
        }
    }

    return {
        effect: { ...effect, damageApplied: true },
        kills,
        damagePopups,
    };
}

/** Apply one-shot damage for newly spawned effects and advance timers. */
export function tickItemEffects(
    effects: readonly ItemEffect[],
    enemies: Enemy[],
    dtMs: number,
    characterX: number,
): { effects: ItemEffect[]; kills: KillRecord[]; damagePopups: DamagePopup[] } {
    const nextEffects: ItemEffect[] = [];
    const kills: KillRecord[] = [];
    const damagePopups: DamagePopup[] = [];

    for (const effect of effects) {
        let current = effect;

        if (effect.kind === 'melee') {
            const resolved = resolveMeleeEffect(effect, enemies, characterX);
            current = resolved.effect;
            kills.push(...resolved.kills);
            damagePopups.push(...resolved.damagePopups);
        } else {
            const resolved = resolveAreaEffect(effect, enemies, characterX);
            current = resolved.effect;
            kills.push(...resolved.kills);
            damagePopups.push(...resolved.damagePopups);
        }

        const ticked = tickItemEffect(current, dtMs);
        if (ticked) nextEffects.push(ticked);
    }

    return { effects: nextEffects, kills, damagePopups };
}

/** Resolve damage immediately when effects are first spawned. */
export function spawnItemEffects(
    effects: readonly ItemEffect[],
    enemies: Enemy[],
    characterX: number,
): { effects: ItemEffect[]; kills: KillRecord[]; damagePopups: DamagePopup[] } {
    return tickItemEffects(effects, enemies, 0, characterX);
}
