import type { ItemDefinition } from '../types.js';

import fireballSprite from '$lib/assets/items/active/fireball.png';

export const FIREBALL_ITEM = {
    id: 'fireball',
    name: 'Fireball',
    description: 'Launches a blazing bolt at the nearest foe.',
    kind: 'active',
    passives: [],
    visuals: {
        icon: { src: fireballSprite, size: 28 },
        world: {
            kind: 'projectile',
            sprite: fireballSprite,
            size: 20,
            rotateWithTravel: true,
        },
    },
    active: {
        kind: 'projectile',
        damage: 25,
        speed: 100,
        range: 150,
        cooldownMs: 400,
        projectileColor: '#f97316',
        projectileType: 'fireball',
    },
} as const satisfies ItemDefinition;
