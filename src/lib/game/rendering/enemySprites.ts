import {
    ENEMY_SPRITES,
    getEnemySpriteTypes,
    type EnemySpriteType,
} from '../entities/enemies/catalog.js';
import { loadEntitySprites, type EntitySpriteLibrary } from './entitySprites.js';

export type { EnemySpriteType } from '../entities/enemies/catalog.js';
export type EnemySpriteLibrary = EntitySpriteLibrary;

export async function loadEnemySprites(type: EnemySpriteType): Promise<EnemySpriteLibrary | null> {
    const config = ENEMY_SPRITES[type];
    if (!config) return null;
    return loadEntitySprites(config);
}

export async function loadAllEnemySprites(): Promise<Partial<Record<EnemySpriteType, EnemySpriteLibrary>>> {
    const entries = await Promise.all(
        getEnemySpriteTypes().map(async (type) => {
            const library = await loadEnemySprites(type);
            return library ? ([type, library] as const) : null;
        }),
    );
    return Object.fromEntries(entries.filter((entry) => entry !== null)) as Partial<
        Record<EnemySpriteType, EnemySpriteLibrary>
    >;
}
