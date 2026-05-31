export type DebugHudOptions = {
    width: number;
    height: number;
    lines: readonly string[];
    font?: string;
    color?: string;
    align?: 'left' | 'right';
    margin?: number;
    origin?: { x: number; y: number };
    lineHeight?: number;
};

export function drawDebugHud(canvas: HTMLCanvasElement | null, options: DebugHudOptions) {
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const {
        width,
        height,
        lines,
        font = '12px monospace',
        color = '#000',
        align = 'right',
        margin = 5,
        origin,
        lineHeight = 15,
    } = options;

    const x = origin?.x ?? (align === 'right' ? width - margin : margin);
    const y = origin?.y ?? 15;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.textAlign = align;

    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], x, y + i * lineHeight);
    }

    ctx.textAlign = 'left';
}
