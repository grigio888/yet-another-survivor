import type { Enemy } from '../entities/enemies/Enemy.js';
import { getEntityAnchorPoint } from '../rendering/shadow.js';
import { circleHitsHitbox } from './hitbox.js';
import type { AreaZoneEffect, MeleeSwingEffect } from '../items/effects/types.js';

function normalizeAngle(angle: number): number {
    let value = angle;
    while (value > Math.PI) value -= Math.PI * 2;
    while (value < -Math.PI) value += Math.PI * 2;
    return value;
}

/** Enemies whose anchor falls inside a melee swing arc. */
export function findMeleeArcHits(
    effect: MeleeSwingEffect,
    enemies: readonly Enemy[],
): number[] {
    const hits: number[] = [];
    const faceAngle = Math.atan2(effect.facing.dy, effect.facing.dx);
    const halfArc = (effect.arcDegrees * Math.PI) / 360;

    for (let index = 0; index < enemies.length; index++) {
        const enemy = enemies[index];
        if (!enemy.isAlive()) continue;

        const point = getEntityAnchorPoint(enemy);
        const dx = point.x - effect.x;
        const dy = point.y - effect.y;
        const dist = Math.hypot(dx, dy);
        if (dist > effect.reach) continue;

        const targetAngle = Math.atan2(dy, dx);
        if (Math.abs(normalizeAngle(targetAngle - faceAngle)) <= halfArc) {
            hits.push(index);
        }
    }

    return hits;
}

/** Enemies whose hitbox overlaps an area circle. */
export function findAreaCircleHits(
    effect: AreaZoneEffect,
    enemies: readonly Enemy[],
): number[] {
    const hits: number[] = [];

    for (let index = 0; index < enemies.length; index++) {
        const enemy = enemies[index];
        if (!enemy.isAlive()) continue;
        if (circleHitsHitbox(effect.x, effect.y, effect.radius, enemy)) {
            hits.push(index);
        }
    }

    return hits;
}
