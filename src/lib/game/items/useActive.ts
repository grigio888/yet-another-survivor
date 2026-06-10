import type { Projectile } from '../systems/collision.js';
import type { ItemId } from './registry.js';
import { ITEMS } from './registry.js';
import type { ItemDefinition, CharacterBaseStats } from './types.js';
import { createProjectileFromAttack, isInAttackRange } from './types.js';
import type { AreaZoneEffect, MeleeSwingEffect } from './effects/types.js';
import { resolveProjectileVisual } from './visuals/resolve.js';
import { getSpriteFrameSrc } from '../animation/spriteFrame.js';
import { resolveActiveStats, type ResolvedActiveStats } from './resolveActive.js';

export type ItemUseResult =
    | { kind: 'projectile'; itemId: ItemId; projectile: Projectile }
    | { kind: 'melee'; itemId: ItemId; effect: MeleeSwingEffect }
    | { kind: 'area'; itemId: ItemId; effect: AreaZoneEffect };

function facingToward(
    origin: { x: number; y: number },
    target: { x: number; y: number },
): { dx: number; dy: number } {
    const dx = target.x - origin.x;
    const dy = target.y - origin.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= 0) return { dx: 0, dy: 1 };
    return { dx: dx / dist, dy: dy / dist };
}

function projectileAttackFromResolved(
    itemId: ItemId,
    stats: ResolvedActiveStats & { kind: 'projectile' },
): Parameters<typeof createProjectileFromAttack>[0]['attack'] {
    const item = ITEMS[itemId];
    const visual = resolveProjectileVisual(item);

    return {
        range: stats.range,
        cooldownMs: stats.cooldownMs,
        projectileDamage: stats.damage,
        projectileSpeed: stats.speed,
        projectileColor: stats.projectileColor,
        projectileType: stats.projectileType,
        sprite: visual ? getSpriteFrameSrc(visual.sprite) : undefined,
        spriteSize: visual?.size,
    };
}

export function useActiveItem(
    itemId: ItemId,
    base: CharacterBaseStats,
    origin: { x: number; y: number },
    target: { x: number; y: number },
    passiveItems: ItemDefinition[] = [],
): ItemUseResult | null {
    const item = ITEMS[itemId];
    const active = item.active;
    if (!active) return null;

    const stats = resolveActiveStats(base, item, passiveItems);
    if (!isInAttackRange(origin, target, stats.range)) return null;

    switch (stats.kind) {
        case 'projectile': {
            const projectile = createProjectileFromAttack({
                origin,
                target,
                attack: projectileAttackFromResolved(itemId, stats),
            });
            return projectile ? { kind: 'projectile', itemId, projectile } : null;
        }
        case 'melee': {
            return {
                kind: 'melee',
                itemId,
                effect: {
                    kind: 'melee',
                    itemId,
                    x: origin.x,
                    y: origin.y,
                    facing: facingToward(origin, target),
                    damage: stats.damage,
                    reach: stats.reach,
                    arcDegrees: stats.arcDegrees,
                    elapsedMs: 0,
                    durationMs: stats.durationMs,
                    damageApplied: false,
                },
            };
        }
        case 'area': {
            return {
                kind: 'area',
                itemId,
                effect: {
                    kind: 'area',
                    itemId,
                    x: target.x,
                    y: target.y,
                    radius: stats.radius,
                    damage: stats.damage,
                    elapsedMs: 0,
                    durationMs: stats.durationMs,
                    damageApplied: false,
                },
            };
        }
    }
}

export { resolveActiveStats, type ResolvedActiveStats } from './resolveActive.js';
