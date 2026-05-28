// Keyboard input manager
// Tracks key states and provides movement vector

export interface InputState {
    keys: Set<string>;
    modifiers: {
        shift: boolean;
        control: boolean;
    };
}

// Movement directions mapped from key codes
const MOVEMENT_KEYS = {
    up: ['KeyW', 'ArrowUp'],
    down: ['KeyS', 'ArrowDown'],
    left: ['KeyA', 'ArrowLeft'],
    right: ['KeyD', 'ArrowRight'],
};

// Sprint modifier
const SPRINT_KEYS = ['ShiftLeft', 'ShiftRight'];

export class InputManager {
    private state: InputState;

    constructor() {
        this.state = {
            keys: new Set(),
            modifiers: { shift: false, control: false },
        };

        this.bindListeners();
    }

    private bindListeners() {
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }

    private handleKeyDown = (e: KeyboardEvent) => {
        this.state.keys.add(e.code);

        if (SPRINT_KEYS.includes(e.code)) {
            this.state.modifiers.shift = true;
        }

        if (e.code === 'ControlLeft' || e.code === 'ControlRight') {
            this.state.modifiers.control = true;
        }
    }

    private handleKeyUp = (e: KeyboardEvent) => {
        this.state.keys.delete(e.code);

        if (SPRINT_KEYS.includes(e.code)) {
            this.state.modifiers.shift = false;
        }

        if (e.code === 'ControlLeft' || e.code === 'ControlRight') {
            this.state.modifiers.control = false;
        }
    }

    // Get normalized movement vector based on pressed keys
    getMovementVector() {
        let dx = 0, dy = 0;

        for (const code of this.state.keys) {
            if (MOVEMENT_KEYS.up.includes(code)) dy -= 1;
            if (MOVEMENT_KEYS.down.includes(code)) dy += 1;
            if (MOVEMENT_KEYS.left.includes(code)) dx -= 1;
            if (MOVEMENT_KEYS.right.includes(code)) dx += 1;
        }

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
        }

        return { dx, dy, sprint: this.state.modifiers.shift };
    }

    // Check if specific key is pressed
    isPressed(code: string) {
        return this.state.keys.has(code);
    }

    // Pause toggle
    isPausePressed() {
        return this.state.keys.has('Escape');
    }

    // Restart trigger
    isRestartPressed() {
        return this.state.keys.has('KeyR');
    }

    // Cleanup
    destroy() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        this.state.keys.clear();
        this.state.modifiers = { shift: false, control: false };
    }
}