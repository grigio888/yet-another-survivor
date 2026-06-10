import type { ItemDefinition } from '../types.js';

import novaIcon from '$lib/assets/items/active/arcane_nova.png';
import novaSprite from '$lib/assets/items/active/arcane_nova.png';

export const ARCANE_NOVA_ITEM = {
    id: 'arcane_nova',
    name: 'Arcane Nova',
    description: 'Detonates a burst of arcane energy on the target.',
    kind: 'active',
    passives: [],
    visuals: {
        icon: { src: novaIcon, size: 28 },
        world: {
            kind: 'area',
            sprite: novaSprite,
            size: 96,
            radius: 56,
            durationMs: 450,
        },
    },
    active: {
        kind: 'area',
        damage: 22,
        range: 130,
        radius: 56,
        cooldownMs: 900,
        durationMs: 450,
    },
} as const satisfies ItemDefinition;
