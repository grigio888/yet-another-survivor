import type { ItemDefinition } from '../types.js';

import spearIcon from '$lib/assets/items/active/throwing_spear.png';
import spearSprite from '$lib/assets/items/active/throwing_spear.png';

export const THROWING_SPEAR_ITEM = {
    id: 'throwing_spear',
    name: 'Throwing Spear',
    description: 'Hurls a spear at the nearest foe within range.',
    kind: 'active',
    passives: [],
    visuals: {
        icon: { src: spearIcon, size: 28 },
        world: {
            kind: 'projectile',
            sprite: spearSprite,
            size: 28,
            rotateWithTravel: true,
        },
    },
    active: {
        kind: 'projectile',
        damage: 18,
        speed: 140,
        range: 180,
        cooldownMs: 550,
        projectileColor: '#94a3b8',
        projectileType: 'throwing_spear',
    },
} as const satisfies ItemDefinition;
