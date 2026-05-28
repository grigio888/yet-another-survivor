import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InputManager } from '$lib/game/input/manager';

describe('InputManager', () => {
    let manager: InputManager;

    beforeEach(() => {
        manager = new InputManager();
    });

    describe('key tracking', () => {
        it('adds key on keydown event', () => {
            const event = { code: 'KeyW' } as KeyboardEvent;
            window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));

            expect(manager.isPressed('KeyW')).toBe(true);
        });

        it('removes key on keyup event', () => {
            window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));

            expect(manager.isPressed('KeyW')).toBe(false);
        });
    });

    describe('movement vector', () => {
        it('returns zero vector when no keys pressed', () => {
            const { dx, dy } = manager.getMovementVector();
            expect(dx).toBe(0);
            expect(dy).toBe(0);
        });

        it('returns correct vector for single key', () => {
            window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
            const { dx, dy } = manager.getMovementVector();

            expect(dx).toBe(0);
            expect(dy).toBe(-1);

            window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));
        });

        it('returns correct vector for arrow keys', () => {
            window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown' }));
            const { dx, dy } = manager.getMovementVector();

            expect(dy).toBe(1);

            window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowDown' }));
        });

        it('normalizes diagonal movement', () => {
            window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
            window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD' }));
            const { dx, dy } = manager.getMovementVector();

            expect(dx).toBeCloseTo(0.707);
            expect(dy).toBeCloseTo(-0.707);

            window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyD' }));
        });
    });

    describe('modifers', () => {
        it('detects sprint when shift pressed', () => {
            expect(manager.isRestartPressed()).toBe(false);
            window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ShiftLeft' }));

            const { sprint } = manager.getMovementVector();
            expect(sprint).toBe(true);

            window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ShiftLeft' }));
        });

        it('pause detection works', () => {
            expect(manager.isPausePressed()).toBe(false);
            window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }));
            expect(manager.isPausePressed()).toBe(true);
            window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Escape' }));
            expect(manager.isPausePressed()).toBe(false);
        });

        it('restart detection works', () => {
            expect(manager.isRestartPressed()).toBe(false);
            window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyR' }));
            expect(manager.isRestartPressed()).toBe(true);
            window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyR' }));
            expect(manager.isRestartPressed()).toBe(false);
        });
    });

    describe('destroy', () => {
        it('clears state after destroy', () => {
            window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
            manager.destroy();

            expect(manager.isPressed('KeyW')).toBe(false);

            const { dx, dy } = manager.getMovementVector();
            expect(dx).toBe(0);
            expect(dy).toBe(0);
        });

        it('removes event listeners', () => {
            const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
            const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

            manager.destroy();

            expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
            expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
        });
    });
});