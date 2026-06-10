export type DamagePopupTarget = 'enemy' | 'player';

export type DamagePopup = {
    x: number;
    y: number;
    amount: number;
    target: DamagePopupTarget;
    /** -1 drifts left, +1 drifts right — relative to the character. */
    driftDirection: -1 | 1;
};

type FloatingDamageNumber = DamagePopup & {
    spawnX: number;
    spawnY: number;
    elapsed: number;
    maxLife: number;
    driftDistance: number;
};

const TEXT_FILL = '#ffffff';
const TEXT_STROKE = '#0c4a6e';
const PEAK_AT = 0.7;
const ARC_HEIGHT = 30;
/** How much of the peak height remains when the popup expires (less = less descent). */
const DESCENT_RETAIN = 0.72;
const DRIFT_DISTANCE = 24;
const DEFAULT_LIFE = 0.85;
const FONT_SIZE = 14;

/** Smooth vertical arc: rises until 70% progress, then eases down partway only. */
export function damageNumberArcOffset(progress: number, peakHeight = ARC_HEIGHT): number {
    const clamped = Math.min(1, Math.max(0, progress));

    if (clamped <= PEAK_AT) {
        const t = clamped / PEAK_AT;
        return -peakHeight * Math.sin(t * (Math.PI / 2));
    }

    const t = (clamped - PEAK_AT) / (1 - PEAK_AT);
    const fallBlend = Math.cos(t * (Math.PI / 2));
    return -peakHeight * (DESCENT_RETAIN + (1 - DESCENT_RETAIN) * fallBlend);
}

/** Fade in at spawn, hold, then fade out near the end. */
export function damageNumberAlpha(progress: number): number {
    const clamped = Math.min(1, Math.max(0, progress));

    if (clamped < 0.12) {
        const t = clamped / 0.12;
        return t * t * (3 - 2 * t);
    }

    if (clamped > 0.82) {
        const t = (1 - clamped) / 0.18;
        return t * t * (3 - 2 * t);
    }

    return 1;
}

/** Horizontal drift that eases in and out with the arc. */
export function damageNumberDriftOffset(progress: number, drift: number): number {
    const clamped = Math.min(1, Math.max(0, progress));
    const eased = clamped * clamped * (3 - 2 * clamped);
    return drift * eased;
}

function motionProgress(number: FloatingDamageNumber): number {
    return Math.min(1, number.elapsed / number.maxLife);
}

export class DamageNumberManager {
    private numbers: FloatingDamageNumber[] = [];

    get count(): number {
        return this.numbers.length;
    }

    spawn(popups: readonly DamagePopup[]) {
        for (const popup of popups) {
            if (popup.amount <= 0) continue;

            const spawnX = popup.x + (Math.random() - 0.5) * 6;
            const spawnY = popup.y + (Math.random() - 0.5) * 4;

            this.numbers.push({
                ...popup,
                x: spawnX,
                y: spawnY,
                spawnX,
                spawnY,
                elapsed: 0,
                maxLife: DEFAULT_LIFE,
                driftDistance: popup.driftDirection * DRIFT_DISTANCE,
            });
        }
    }

    update(dt: number) {
        for (const number of this.numbers) {
            number.elapsed += dt;
            const progress = motionProgress(number);
            const arcY = damageNumberArcOffset(progress);
            const driftX = damageNumberDriftOffset(progress, number.driftDistance);

            number.x = number.spawnX + driftX;
            number.y = number.spawnY + arcY;
        }

        this.numbers = this.numbers.filter((number) => number.elapsed < number.maxLife);
    }

    draw(ctx: CanvasRenderingContext2D) {
        for (const number of this.numbers) {
            const progress = motionProgress(number);
            const alpha = damageNumberAlpha(progress);
            if (alpha <= 0) continue;

            const text = String(Math.round(number.amount));
            const pop = 0.92 + damageNumberAlpha(Math.min(progress / 0.12, 1)) * 0.1;
            const fontSize = Math.round(FONT_SIZE * pop);

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = `bold ${fontSize}px ui-monospace, monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.lineWidth = 3;
            ctx.lineJoin = 'round';
            ctx.strokeStyle = TEXT_STROKE;
            ctx.strokeText(text, number.x, number.y);
            ctx.fillStyle = TEXT_FILL;
            ctx.fillText(text, number.x, number.y);
            ctx.restore();
        }
    }

    clear() {
        this.numbers = [];
    }
}
