import { getEntityAnchorPoint } from '../rendering/shadow.js';
import type { DamagePopup } from './damageNumbers.js';

export type { DamagePopup, DamagePopupTarget } from './damageNumbers.js';

type AnchorEntity = {
    x: number;
    y: number;
    shadow: { anchor: { x: number; y: number }; size: { x: number; y: number } };
};

const SIDE_EPSILON = 2;

/** Enemy/source left of the character drifts left; right drifts right. */
export function horizontalDriftDirection(sourceX: number, characterX: number): -1 | 1 {
    if (sourceX < characterX - SIDE_EPSILON) return -1;
    if (sourceX > characterX + SIDE_EPSILON) return 1;
    return Math.random() < 0.5 ? -1 : 1;
}

export function enemyDamagePopup(
    enemy: AnchorEntity,
    amount: number,
    characterX: number,
): DamagePopup {
    const anchor = getEntityAnchorPoint(enemy);
    return {
        x: anchor.x,
        y: anchor.y - 12,
        amount,
        target: 'enemy',
        driftDirection: horizontalDriftDirection(anchor.x, characterX),
    };
}

export function playerDamagePopup(
    character: AnchorEntity,
    amount: number,
    sourceX: number,
): DamagePopup {
    const anchor = getEntityAnchorPoint(character);
    return {
        x: anchor.x,
        y: anchor.y - 18,
        amount,
        target: 'player',
        driftDirection: horizontalDriftDirection(sourceX, anchor.x),
    };
}
