export {
    type ActivePerk,
    type ActivePerkKind,
    type AreaActivePerk,
    type AttackStats,
    type CharacterBaseStats,
    type FireProjectileContext,
    type ItemDefinition,
    type ItemKind,
    type MeleeActivePerk,
    type ModifiableStat,
    type PassivePerk,
    type ProjectileActivePerk,
    MAX_ACTIVE_ITEMS,
    MAX_PASSIVE_ITEMS,
    createProjectileFromAttack,
    isInAttackRange,
} from './types.js';
export {
    type ActiveItemVisuals,
    type AreaItemVisual,
    type ItemIconVisual,
    type ItemVisuals,
    type ItemWorldVisual,
    type MeleeItemVisual,
    type PassiveItemVisuals,
    type ProjectileItemVisual,
    collectAllItemVisualUrls,
    collectItemVisualUrls,
    collectProjectileVisualUrls,
    getItemIconVisual,
    getItemWorldVisual,
    isActiveItemVisuals,
    resolveAreaVisual,
    resolveMeleeVisual,
    resolveProjectileVisual,
    worldVisualMatchesAttack,
} from './visuals/index.js';
export {
    type AreaZoneEffect,
    type ItemEffect,
    type MeleeSwingEffect,
    isItemEffectActive,
    tickItemEffect,
} from './effects/types.js';
export { FIREBALL_ITEM } from './active/Fireball.js';
export { THROWING_SPEAR_ITEM } from './active/ThrowingSpear.js';
export { IRON_SWORD_ITEM } from './active/IronSword.js';
export { ARCANE_NOVA_ITEM } from './active/ArcaneNova.js';
export { SWIFT_BOOTS_ITEM } from './passive/SwiftBoots.js';
export { ItemInventory, splitItemUseResults } from './Inventory.js';
export { getActiveDamage, resolveActiveStats, type ResolvedActiveStats } from './resolveActive.js';
export { useActiveItem, type ItemUseResult } from './useActive.js';
export {
    ACTIVE_ITEM_CATALOG,
    DEFAULT_STARTING_ITEMS,
    ITEMS,
    PASSIVE_ITEM_CATALOG,
    getItemVisualUrls,
    getProjectileSpriteUrls,
    type ItemId,
} from './registry.js';
