export {
    type ActivePerk,
    type AttackStats,
    type CharacterBaseStats,
    type FireProjectileContext,
    type ItemDefinition,
    type ItemKind,
    type ItemSprite,
    type ModifiableStat,
    type PassivePerk,
    type ProjectileActivePerk,
    MAX_ACTIVE_ITEMS,
    MAX_PASSIVE_ITEMS,
    createProjectileFromAttack,
    isInAttackRange,
} from './types.js';
export { FIREBALL_ITEM } from './active/Fireball.js';
export { SWIFT_BOOTS_ITEM } from './passive/SwiftBoots.js';
export { ItemInventory } from './Inventory.js';
export { DEFAULT_STARTING_ITEMS, ITEMS, getProjectileSpriteUrls, type ItemId } from './registry.js';
