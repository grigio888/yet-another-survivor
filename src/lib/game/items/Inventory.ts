import type { Projectile } from '../systems/collision.js';
import { ITEMS, type ItemId } from './registry.js';
import { resolveActiveStats, getActiveDamage } from './resolveActive.js';
import type { CharacterBaseStats, ItemDefinition } from './types.js';
import { isInAttackRange } from './types.js';
import { MAX_ACTIVE_ITEMS, MAX_PASSIVE_ITEMS } from './types.js';
import type { ItemEffect } from './effects/types.js';
import { useActiveItem, type ItemUseResult } from './useActive.js';

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

    getActiveSlots(): (ItemDefinition | null)[] {
        return this.activeItems.map((id) => (id ? ITEMS[id] : null));
    }

    getPassiveSlots(): (ItemDefinition | null)[] {
        return this.passiveItems.map((id) => (id ? ITEMS[id] : null));
    }

    getResolvedActiveStats(base: CharacterBaseStats, itemId: ItemId) {
        return resolveActiveStats(base, ITEMS[itemId], this.getPassiveItems());
    }

    /** Summary stats from the longest-range active item (after passives). */
    getAttackStats(base: CharacterBaseStats) {
        const actives = this.getActiveItems();
        if (actives.length === 0) {
            throw new Error('Character must equip at least one active item.');
        }

        let best = this.getResolvedActiveStats(base, actives[0].id as ItemId);
        for (const item of actives.slice(1)) {
            const stats = this.getResolvedActiveStats(base, item.id as ItemId);
            if (stats.range > best.range) {
                best = stats;
            }
        }
        return best;
    }

    getMaxRange(base: CharacterBaseStats): number {
        if (this.getActiveItems().length === 0) return 0;
        return Math.max(
            ...this.getActiveItemIds().map((id) => this.getResolvedActiveStats(base, id).range),
        );
    }

    getMaxDamage(base: CharacterBaseStats): number {
        if (this.getActiveItems().length === 0) return 0;
        return Math.max(
            ...this.getActiveItemIds().map((id) => getActiveDamage(this.getResolvedActiveStats(base, id))),
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

            const stats = this.getResolvedActiveStats(base, itemId);
            if (this.activeCooldownMs[i] >= stats.cooldownMs) {
                return true;
            }
        }
        return false;
    }

    useAllActives(
        base: CharacterBaseStats,
        origin: { x: number; y: number },
        target: { x: number; y: number },
    ): ItemUseResult[] {
        const results: ItemUseResult[] = [];

        for (let i = 0; i < MAX_ACTIVE_ITEMS; i++) {
            const itemId = this.activeItems[i];
            if (!itemId) continue;

            const stats = this.getResolvedActiveStats(base, itemId);
            if (this.activeCooldownMs[i] < stats.cooldownMs) continue;
            if (!isInAttackRange(origin, target, stats.range)) continue;

            const result = useActiveItem(itemId, base, origin, target, this.getPassiveItems());
            if (!result) continue;

            results.push(result);
            this.activeCooldownMs[i] = 0;
        }

        return results;
    }

    /** Projectile-only convenience wrapper. */
    fireAll(
        base: CharacterBaseStats,
        origin: { x: number; y: number },
        target: { x: number; y: number },
    ): Projectile[] {
        return this.useAllActives(base, origin, target)
            .filter((result): result is ItemUseResult & { kind: 'projectile' } => result.kind === 'projectile')
            .map((result) => result.projectile);
    }
}

export function splitItemUseResults(results: readonly ItemUseResult[]): {
    projectiles: Projectile[];
    effects: ItemEffect[];
} {
    const projectiles: Projectile[] = [];
    const effects: ItemEffect[] = [];

    for (const result of results) {
        if (result.kind === 'projectile') {
            projectiles.push(result.projectile);
        } else {
            effects.push(result.effect);
        }
    }

    return { projectiles, effects };
}
