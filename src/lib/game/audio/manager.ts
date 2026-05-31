export type SfxId = 'shoot' | 'hit' | 'enemy_death' | 'game_over';

type OscillatorShape = OscillatorType;

interface ToneStep {
    frequency: number;
    duration: number;
    type?: OscillatorShape;
    gain?: number;
}

const SFX: Record<SfxId, ToneStep[]> = {
    shoot: [{ frequency: 880, duration: 0.04, type: 'square', gain: 0.04 }],
    hit: [{ frequency: 140, duration: 0.08, type: 'sawtooth', gain: 0.08 }],
    enemy_death: [
        { frequency: 320, duration: 0.05, type: 'square', gain: 0.06 },
        { frequency: 180, duration: 0.1, type: 'sawtooth', gain: 0.05 },
    ],
    game_over: [
        { frequency: 220, duration: 0.15, type: 'triangle', gain: 0.07 },
        { frequency: 165, duration: 0.2, type: 'triangle', gain: 0.06 },
        { frequency: 110, duration: 0.35, type: 'triangle', gain: 0.05 },
    ],
};

export class AudioManager {
    private context: AudioContext | null = null;
    enabled = true;

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    play(id: SfxId) {
        if (!this.enabled || typeof window === 'undefined') return;

        const context = this.getContext();
        if (!context) return;

        if (context.state === 'suspended') {
            void context.resume();
        }

        const steps = SFX[id];
        let startAt = context.currentTime;

        for (const step of steps) {
            this.playTone(context, step, startAt);
            startAt += step.duration;
        }
    }

    destroy() {
        if (this.context) {
            void this.context.close();
            this.context = null;
        }
    }

    private getContext(): AudioContext | null {
        if (this.context) return this.context;
        if (typeof window === 'undefined') return null;

        const AudioContextClass =
            window.AudioContext ??
            (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

        if (!AudioContextClass) return null;

        this.context = new AudioContextClass();
        return this.context;
    }

    private playTone(context: AudioContext, step: ToneStep, startAt: number) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.type = step.type ?? 'square';
        oscillator.frequency.setValueAtTime(step.frequency, startAt);

        const peak = step.gain ?? 0.05;
        gain.gain.setValueAtTime(peak, startAt);
        gain.gain.exponentialRampToValueAtTime(0.001, startAt + step.duration);

        oscillator.connect(gain);
        gain.connect(context.destination);

        oscillator.start(startAt);
        oscillator.stop(startAt + step.duration + 0.01);
    }
}
