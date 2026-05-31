import {
    ANIMATION_STATES,
    DEFAULT_ANIMATION_FPS,
    type AnimationState,
} from '$lib/game/animation';
import type { CharacterId } from '$lib/game/entities/characters';
import type { SpriteFacing } from '$lib/game/animation/spriteConfig';

export const CHARACTER_INSPECTOR_STORAGE_KEY = 'debug:character-inspector:v1';

export type CharacterInspectorSettings = {
    selectedType: CharacterId;
    selectedAnimation: AnimationState;
    facing: SpriteFacing;
    showMovement: boolean;
    autoPlayFrames: boolean;
    manualFrameIndex: number;
    previewFrameIndex: number;
    overrideFps: boolean;
    previewFps: number;
};

const CHARACTER_TYPES = new Set<CharacterId>(['mage', 'peasant']);
const FACINGS = new Set<SpriteFacing>(['ne', 'nw', 'se', 'sw']);

export const DEFAULT_CHARACTER_INSPECTOR_SETTINGS: CharacterInspectorSettings = {
    selectedType: 'mage',
    selectedAnimation: 'idle',
    facing: 'sw',
    showMovement: true,
    autoPlayFrames: true,
    manualFrameIndex: 0,
    previewFrameIndex: 0,
    overrideFps: false,
    previewFps: DEFAULT_ANIMATION_FPS.idle,
};

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
    return typeof value === 'boolean' ? value : fallback;
}

function readNumber(value: unknown, fallback: number, min = 0, max = Number.POSITIVE_INFINITY): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
    return Math.min(max, Math.max(min, value));
}

export function parseCharacterInspectorSettings(raw: unknown): CharacterInspectorSettings {
    if (!isRecord(raw)) return { ...DEFAULT_CHARACTER_INSPECTOR_SETTINGS };

    const selectedType = CHARACTER_TYPES.has(raw.selectedType as CharacterId)
        ? (raw.selectedType as CharacterId)
        : DEFAULT_CHARACTER_INSPECTOR_SETTINGS.selectedType;

    const selectedAnimation = ANIMATION_STATES.includes(raw.selectedAnimation as AnimationState)
        ? (raw.selectedAnimation as AnimationState)
        : DEFAULT_CHARACTER_INSPECTOR_SETTINGS.selectedAnimation;

    const facing = FACINGS.has(raw.facing as SpriteFacing)
        ? (raw.facing as SpriteFacing)
        : DEFAULT_CHARACTER_INSPECTOR_SETTINGS.facing;

    return {
        selectedType,
        selectedAnimation,
        facing,
        showMovement: readBoolean(raw.showMovement, DEFAULT_CHARACTER_INSPECTOR_SETTINGS.showMovement),
        autoPlayFrames: readBoolean(raw.autoPlayFrames, DEFAULT_CHARACTER_INSPECTOR_SETTINGS.autoPlayFrames),
        manualFrameIndex: readNumber(
            raw.manualFrameIndex,
            DEFAULT_CHARACTER_INSPECTOR_SETTINGS.manualFrameIndex,
            0,
            999,
        ),
        previewFrameIndex: readNumber(
            raw.previewFrameIndex,
            DEFAULT_CHARACTER_INSPECTOR_SETTINGS.previewFrameIndex,
            0,
            999,
        ),
        overrideFps: readBoolean(raw.overrideFps, DEFAULT_CHARACTER_INSPECTOR_SETTINGS.overrideFps),
        previewFps: readNumber(
            raw.previewFps,
            DEFAULT_CHARACTER_INSPECTOR_SETTINGS.previewFps,
            0.5,
            60,
        ),
    };
}

export function loadCharacterInspectorSettings(
    storage: Pick<Storage, 'getItem'> = localStorage,
): CharacterInspectorSettings {
    try {
        const raw = storage.getItem(CHARACTER_INSPECTOR_STORAGE_KEY);
        if (!raw) return { ...DEFAULT_CHARACTER_INSPECTOR_SETTINGS };
        return parseCharacterInspectorSettings(JSON.parse(raw));
    } catch {
        return { ...DEFAULT_CHARACTER_INSPECTOR_SETTINGS };
    }
}

export function saveCharacterInspectorSettings(
    settings: CharacterInspectorSettings,
    storage: Pick<Storage, 'setItem'> = localStorage,
): void {
    try {
        storage.setItem(CHARACTER_INSPECTOR_STORAGE_KEY, JSON.stringify(settings));
    } catch {
        // Ignore quota / private-mode failures in debug tooling.
    }
}

export function facingFromKey(facing: SpriteFacing): { dx: number; dy: number } {
    switch (facing) {
        case 'ne':
            return { dx: 1, dy: -1 };
        case 'nw':
            return { dx: -1, dy: -1 };
        case 'se':
            return { dx: 1, dy: 1 };
        default:
            return { dx: -1, dy: 1 };
    }
}
