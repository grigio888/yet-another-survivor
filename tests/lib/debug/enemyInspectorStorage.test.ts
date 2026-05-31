import { describe, expect, it } from 'vitest';
import {
    DEFAULT_ENEMY_INSPECTOR_SETTINGS,
    loadEnemyInspectorSettings,
    parseEnemyInspectorSettings,
    saveEnemyInspectorSettings,
} from '$lib/debug/enemyInspectorStorage';

describe('enemyInspectorStorage', () => {
    it('returns defaults for invalid payloads', () => {
        expect(parseEnemyInspectorSettings(null)).toEqual(DEFAULT_ENEMY_INSPECTOR_SETTINGS);
        expect(parseEnemyInspectorSettings({ selectedType: 'dragon' })).toEqual(
            DEFAULT_ENEMY_INSPECTOR_SETTINGS,
        );
    });

    it('parses valid settings and clamps numbers', () => {
        expect(
            parseEnemyInspectorSettings({
                selectedType: 'chief',
                selectedAnimation: 'walking',
                facing: 'ne',
                showMovement: false,
                autoPlayFrames: false,
                manualFrameIndex: 12,
                previewFrameIndex: 3,
                overrideFps: true,
                previewFps: 18,
            }),
        ).toEqual({
            selectedType: 'chief',
            selectedAnimation: 'walking',
            facing: 'ne',
            showMovement: false,
            autoPlayFrames: false,
            manualFrameIndex: 12,
            previewFrameIndex: 3,
            overrideFps: true,
            previewFps: 18,
        });
    });

    it('loads and saves through storage', () => {
        const storage = new Map<string, string>();

        saveEnemyInspectorSettings(
            {
                ...DEFAULT_ENEMY_INSPECTOR_SETTINGS,
                selectedType: 'shooter',
                facing: 'se',
            },
            {
                setItem(key, value) {
                    storage.set(key, value);
                },
            },
        );

        expect(loadEnemyInspectorSettings({
            getItem(key) {
                return storage.get(key) ?? null;
            },
        }).selectedType).toBe('shooter');
    });
});
