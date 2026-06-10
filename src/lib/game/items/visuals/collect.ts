import { getSpriteFrameSrc } from '../../animation/spriteFrame.js';
import type { EntitySpriteConfig } from '../../animation/spriteConfig.js';
import { ANIMATION_STATES, FACINGS } from '../../animation/types.js';
import type { ItemDefinition } from '../types.js';
import {
    getItemWorldVisual,
    isActiveItemVisuals,
    type ItemWorldVisual,
} from './types.js';

function urlsFromSpriteFrame(frame: string | { src: string }): string[] {
    return [getSpriteFrameSrc(frame)];
}

function urlsFromEntitySpriteConfig(config: EntitySpriteConfig): string[] {
    const urls = new Set<string>();

    for (const facing of FACINGS) {
        urls.add(getSpriteFrameSrc(config.idle[facing]));
    }

    if (config.animations) {
        for (const state of ANIMATION_STATES) {
            const clip = config.animations[state];
            if (!clip) continue;
            for (const facing of FACINGS) {
                for (const frame of clip.frames[facing]) {
                    urls.add(getSpriteFrameSrc(frame));
                }
            }
        }
    }

    return [...urls];
}

function urlsFromWorldVisual(visual: ItemWorldVisual): string[] {
    switch (visual.kind) {
        case 'projectile':
            return urlsFromSpriteFrame(visual.sprite);
        case 'melee':
        case 'area':
            return typeof visual.sprite === 'string' || 'src' in visual.sprite
                ? urlsFromSpriteFrame(visual.sprite)
                : urlsFromEntitySpriteConfig(visual.sprite);
    }
}

/** Collect every image URL referenced by an item's visual bundle. */
export function collectItemVisualUrls(item: ItemDefinition): string[] {
    const urls = new Set<string>();
    const visuals = item.visuals;

    if (!visuals) return [];

    urls.add(visuals.icon.src);

    if (isActiveItemVisuals(visuals)) {
        for (const url of urlsFromWorldVisual(visuals.world)) {
            urls.add(url);
        }
    }

    return [...urls];
}

/** Collect unique image URLs across all registered items. */
export function collectAllItemVisualUrls(items: readonly ItemDefinition[]): string[] {
    const urls = new Set<string>();

    for (const item of items) {
        for (const url of collectItemVisualUrls(item)) {
            urls.add(url);
        }
    }

    return [...urls];
}

/** Projectile-only URLs — used by the legacy projectile loader. */
export function collectProjectileVisualUrls(items: readonly ItemDefinition[]): string[] {
    const urls = new Set<string>();

    for (const item of items) {
        const world = getItemWorldVisual(item.visuals);
        if (world?.kind !== 'projectile') continue;
        urls.add(getSpriteFrameSrc(world.sprite));
    }

    return [...urls];
}
