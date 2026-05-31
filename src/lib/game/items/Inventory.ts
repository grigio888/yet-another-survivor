import type { Projectile } from '../systems/collision.js';
import { ITEMS, type ItemId } from './registry.js';
import type {
    AttackStats,
    CharacterBaseStats,
    ItemDefinition,
    ModifiableStat,
} from './types.js';
import {
    MAX_ACTIVE_ITEMS,
    MAX_PASSIVE_ITEMS,
    createProjectileFromAttack,
    isInAttackRange,
} from './types.js';

function applyModifier(value: number, op: 'add' | 'mul', amount: number): number {
    return op === 'add' ? value + amount : value * amount;
}

function applyPassives<T extends Record<string, number>>(
    base: T,
    items: ItemDefinition[],
    statKeys: (keyof T)[],
): T {
    const result = { ...base };

    for (const item of items) {
        for (const perk of item.passives) {
            if (!statKeys.includes(perk.stat as keyof T)) continue;
            const key = perk.stat as keyof T;
            result[key] = applyModifier(result[key], perk.op, perk.value) as T[keyof T];
        }
    }

    return result;
}

function attackStatsFromItem(
    base: CharacterBaseStats,
    item: ItemDefinition,
    passiveItems: ItemDefinition[],
): AttackStats {
    const active = item.active;
    if (!active || active.kind !== 'projectile') {
        throw new Error(`Active item "${item.id}" has no projectile attack.`);
    }

    const attackBase: AttackStats = {
        range: active.range,
        cooldownMs: active.cooldownMs,
        projectileDamage: active.damage,
        projectileSpeed: active.speed,
        projectileColor: active.projectileColor,
        projectileType: active.projectileType,
        sprite: active.sprite,
        spriteSize: active.spriteSize,
    };

    const resolved = applyPassives(
        { ...base, ...attackBase },
        passiveItems,
        ['speed', 'maxLives', 'maxHp', 'range', 'cooldownMs', 'projectileDamage', 'projectileSpeed'],
    );

    return {
        range: resolved.range,
        cooldownMs: resolved.cooldownMs,
        projectileDamage: resolved.projectileDamage,
        projectileSpeed: resolved.projectileSpeed,
        projectileColor: resolved.projectileColor,
        projectileType: resolved.projectileType,
        sprite: attackBase.sprite,
        spriteSize: attackBase.spriteSize,
    };
}

export class ItemInventory {
    private readonly activeItems: (ItemId | null)[] = Array(MAX_ACTIVE_ITEMS).fill(null);
    private readonly passiveItems: (ItemId | null)[] = Array(MAX_PASSIVE_ITEMS).fill(null);
    private readonly activeCooldownMs: number[] = Array(MAX_ACTIVE_ITEMS).fill(0);

    equip(itemId: ItemId): boolean {
        const item = ITEMS[itemId];

        if (item.kind === 'active') {
            const slot = this.activeItems.findIndex((id) => id === null);
            if (slot === -1) return false;
            this.activeItems[slot] = itemId;
            this.activeCooldownMs[slot] = item.active?.cooldownMs ?? 0;
            return true;
        }

        const slot = this.passiveItems.findIndex((id) => id === null);
        if (slot === -1) return false;
        this.passiveItems[slot] = itemId;
        return true;
    }

    equipAll(itemIds: readonly ItemId[]): void {
        for (const itemId of itemIds) {
            this.equip(itemId);
        }
    }

    getActiveItemIds(): ItemId[] {
        return this.activeItems.filter((id): id is ItemId => id !== null);
    }

    getPassiveItemIds(): ItemId[] {
        return this.passiveItems.filter((id): id is ItemId => id !== null);
    }

    getActiveItems(): ItemDefinition[] {
        return this.getActiveItemIds().map((id) => ITEMS[id]);
    }

    getPassiveItems(): ItemDefinition[] {
        return this.getPassiveItemIds().map((id) => ITEMS[id]);
    }

    getActiveCount(): number {
        return this.getActiveItemIds().length;
    }

    getPassiveCount(): number {
        return this.getPassiveItemIds().length;
    }

    getAttackStatsForItem(base: CharacterBaseStats, itemId: ItemId): AttackStats {
        return attackStatsFromItem(base, ITEMS[itemId], this.getPassiveItems());
    }

    /** Summary stats from the longest-range active item (after passives). */
    getAttackStats(base: CharacterBaseStats): AttackStats {
        const actives = this.getActiveItems();
        if (actives.length === 0) {
            throw new Error('Character must equip at least one active item.');
        }

        let best = this.getAttackStatsForItem(base, actives[0].id as ItemId);
        for (const item of actives.slice(1)) {
            const stats = this.getAttackStatsForItem(base, item.id as ItemId);
            if (stats.range > best.range) {
                best = stats;
            }
        }
        return best;
    }

    getMaxRange(base: CharacterBaseStats): number {
        if (this.getActiveItems().length === 0) return 0;
        return Math.max(
            ...this.getActiveItemIds().map((id) => this.getAttackStatsForItem(base, id).range),
        );
    }

    getMaxDamage(base: CharacterBaseStats): number {
        if (this.getActiveItems().length === 0) return 0;
        return Math.max(
            ...this.getActiveItemIds().map((id) => this.getAttackStatsForItem(base, id).projectileDamage),
        );
    }

    tick(dt: number): void {
        const deltaMs = dt * 1000;
        for (let i = 0; i < MAX_ACTIVE_ITEMS; i++) {
            if (this.activeItems[i]) {
                this.activeCooldownMs[i] += deltaMs;
            }
        }
    }

    canFireAny(base: CharacterBaseStats): boolean {
        for (let i = 0; i < MAX_ACTIVE_ITEMS; i++) {
            const itemId = this.activeItems[i];
            if (!itemId) continue;

            const stats = this.getAttackStatsForItem(base, itemId);
            if (this.activeCooldownMs[i] >= stats.cooldownMs) {
                return true;
            }
        }
        return false;
    }

    fireAll(
        base: CharacterBaseStats,
        origin: { x: number; y: number },
        target: { x: number; y: number },
    ): Projectile[] {
        const projectiles: Projectile[] = [];

        for (let i = 0; i < MAX_ACTIVE_ITEMS; i++) {
            const itemId = this.activeItems[i];
            if (!itemId) continue;

            const stats = this.getAttackStatsForItem(base, itemId);
            if (this.activeCooldownMs[i] < stats.cooldownMs) continue;
            if (!isInAttackRange(origin, target, stats.range)) continue;

            const projectile = createProjectileFromAttack({ origin, target, attack: stats });
            if (!projectile) continue;

            projectiles.push(projectile);
            this.activeCooldownMs[i] = 0;
        }

        return projectiles;
    }
}
