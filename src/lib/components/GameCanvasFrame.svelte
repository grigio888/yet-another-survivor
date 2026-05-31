<script lang="ts">
    import { CANVAS } from '$lib/game/config';

    interface Props {
        width?: number;
        height?: number;
        /** Gameplay layer — world, entities, projectiles */
        canvas?: HTMLCanvasElement | null;
        /** Overlay layer — HUD, menus (optional; stacked on top when bound) */
        guiCanvas?: HTMLCanvasElement | null;
        onGameClick?: (event: MouseEvent) => void;
    }

    let {
        width = CANVAS.width,
        height = CANVAS.height,
        canvas = $bindable<HTMLCanvasElement | null>(null),
        guiCanvas = $bindable<HTMLCanvasElement | null>(null),
        onGameClick,
    }: Props = $props();

    $effect(() => {
        if (canvas) {
            canvas.width = width;
            canvas.height = height;
        }
        if (guiCanvas) {
            guiCanvas.width = width;
            guiCanvas.height = height;
        }
    });
</script>

<div
    class="game-canvas-frame"
    style:--game-canvas-width="{width}px"
    style:--game-canvas-height="{height}px"
    style:--game-canvas-aspect="{width} / {height}"
>
    <div class="game-canvas-stack">
        <canvas
            class="game-canvas-layer game-canvas-layer--game"
            bind:this={canvas}
            onclick={onGameClick}
        ></canvas>
        <canvas
            class="game-canvas-layer game-canvas-layer--gui"
            bind:this={guiCanvas}
            aria-hidden="true"
        ></canvas>
    </div>
</div>
