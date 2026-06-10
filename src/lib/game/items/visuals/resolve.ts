import { getSpriteFrameSrc } from '../../animation/spriteFrame.js';
import type { EntitySpriteConfig } from '../../animation/spriteConfig.js';
import type { ItemDefinition } from '../types.js';
import {
    getItemWorldVisual,
    type AreaItemVisual,
    type MeleeItemVisual,
    type ProjectileItemVisual,
} from './types.js';

export function resolveProjectileVisual(
    item: ItemDefinition,
): ProjectileItemVisual | null {
    const world = getItemWorldVisual(item.visuals);
    return world?.kind === 'projectile' ? world : null;
}

export function resolveMeleeVisual(item: ItemDefinition): MeleeItemVisual | null {
    const world = getItemWorldVisual(item.visuals);
    return world?.kind === 'melee' ? world : null;
}

export function resolveAreaVisual(item: ItemDefinition): AreaItemVisual | null {
    const world = getItemWorldVisual(item.visuals);
    return world?.kind === 'area' ? world : null;
}

export function resolveStaticSpriteSrc(sprite: string | { src: string } | EntitySpriteConfig): string {
    if (typeof sprite === 'string' || 'src' in sprite) {
        return getSpriteFrameSrc(sprite);
    }
    return getSpriteFrameSrc(sprite.idle.sw);
}
