import type { ItemDefinition } from '../types.js';

import fireballSprite from '$lib/assets/items/active/fireball.png';

export const FIREBALL_ITEM = {
    id: 'fireball',
    name: 'Fireball',
    description: 'Launches a blazing bolt at the nearest foe.',
    kind: 'active',
    passives: [],
    active: {
        kind: 'projectile',
        damage: 25,
        speed: 100,
        range: 150,
        cooldownMs: 400,
        projectileColor: '#f97316',
        projectileType: 'fireball',
        sprite: fireballSprite,
        spriteSize: 20,
    },
} as const satisfies ItemDefinition;
