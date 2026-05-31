import type { ItemDefinition } from '../types.js';

/** Example passive item — boosts projectile speed on all active attacks. */
export const SWIFT_BOOTS_ITEM = {
    id: 'swift_boots',
    name: 'Swift Boots',
    description: 'Light footwear that hurries every shot.',
    kind: 'passive',
    passives: [{ stat: 'projectileSpeed', op: 'add', value: 10 }],
    active: null,
} as const satisfies ItemDefinition;
