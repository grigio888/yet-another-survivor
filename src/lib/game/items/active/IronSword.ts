import type { ItemDefinition } from '../types.js';

import swordIcon from '$lib/assets/items/active/iron_sword.png';
import slashSprite from '$lib/assets/items/active/sword_slash.png';

export const IRON_SWORD_ITEM = {
    id: 'iron_sword',
    name: 'Iron Sword',
    description: 'A quick slash at nearby enemies.',
    kind: 'active',
    passives: [],
    visuals: {
        icon: { src: swordIcon, size: 28 },
        world: {
            kind: 'melee',
            sprite: slashSprite,
            size: 56,
            arcDegrees: 100,
            durationMs: 180,
        },
    },
    active: {
        kind: 'melee',
        damage: 32,
        range: 70,
        reach: 65,
        arcDegrees: 100,
        cooldownMs: 650,
    },
} as const satisfies ItemDefinition;
