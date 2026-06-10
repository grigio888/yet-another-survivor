import type {
    AreaActivePerk,
    CharacterBaseStats,
    ItemDefinition,
    MeleeActivePerk,
    PassivePerk,
    ProjectileActivePerk,
} from './types.js';

export type ResolvedProjectileStats = {
    kind: 'projectile';
    range: number;
    cooldownMs: number;
    damage: number;
    speed: number;
    projectileColor?: string;
    projectileType?: string;
    sprite?: string;
    spriteSize?: number;
};

export type ResolvedMeleeStats = {
    kind: 'melee';
    range: number;
    cooldownMs: number;
    damage: number;
    reach: number;
    arcDegrees: number;
    durationMs: number;
};

export type ResolvedAreaStats = {
    kind: 'area';
    range: number;
    cooldownMs: number;
    damage: number;
    radius: number;
    durationMs: number;
};

export type ResolvedActiveStats =
    | ResolvedProjectileStats
    | ResolvedMeleeStats
    | ResolvedAreaStats;

function applyModifier(value: number, op: 'add' | 'mul', amount: number): number {
    return op === 'add' ? value + amount : value * amount;
}

function applyPassivesToNumbers(
    base: Record<string, number>,
    passives: PassivePerk[],
    keys: string[],
): Record<string, number> {
    const result = { ...base };

    for (const perk of passives) {
        if (!keys.includes(perk.stat)) continue;
        result[perk.stat] = applyModifier(result[perk.stat], perk.op, perk.value);
    }

    return result;
}

export function resolveActiveStats(
    base: CharacterBaseStats,
    item: ItemDefinition,
    passiveItems: ItemDefinition[],
): ResolvedActiveStats {
    const active = item.active;
    if (!active) {
        throw new Error(`Item "${item.id}" has no active perk.`);
    }

    const passives = passiveItems.flatMap((entry) => entry.passives);
    const commonKeys = ['range', 'cooldownMs'];
    const common = applyPassivesToNumbers(
        { range: active.range, cooldownMs: active.cooldownMs },
        passives,
        commonKeys,
    );

    switch (active.kind) {
        case 'projectile': {
            const resolved = applyPassivesToNumbers(
                {
                    ...common,
                    projectileDamage: active.damage,
                    projectileSpeed: active.speed,
                },
                passives,
                [...commonKeys, 'projectileDamage', 'projectileSpeed'],
            );

            return {
                kind: 'projectile',
                range: resolved.range,
                cooldownMs: resolved.cooldownMs,
                damage: resolved.projectileDamage,
                speed: resolved.projectileSpeed,
                projectileColor: active.projectileColor,
                projectileType: active.projectileType,
            };
        }
        case 'melee': {
            const resolved = applyPassivesToNumbers(
                { ...common, projectileDamage: active.damage },
                passives,
                [...commonKeys, 'projectileDamage'],
            );

            return {
                kind: 'melee',
                range: resolved.range,
                cooldownMs: resolved.cooldownMs,
                damage: resolved.projectileDamage,
                reach: active.reach,
                arcDegrees: active.arcDegrees ?? 90,
                durationMs: item.visuals && 'world' in item.visuals && item.visuals.world.kind === 'melee'
                    ? item.visuals.world.durationMs ?? 200
                    : 200,
            };
        }
        case 'area': {
            const resolved = applyPassivesToNumbers(
                { ...common, projectileDamage: active.damage },
                passives,
                [...commonKeys, 'projectileDamage'],
            );

            return {
                kind: 'area',
                range: resolved.range,
                cooldownMs: resolved.cooldownMs,
                damage: resolved.projectileDamage,
                radius: active.radius,
                durationMs: active.durationMs
                    ?? (item.visuals && 'world' in item.visuals && item.visuals.world.kind === 'area'
                        ? item.visuals.world.durationMs
                        : undefined)
                    ?? 500,
            };
        }
    }
}

export function getActiveDamage(stats: ResolvedActiveStats): number {
    return stats.damage;
}

export function perkSummary(active: ProjectileActivePerk | MeleeActivePerk | AreaActivePerk) {
    return active;
}
