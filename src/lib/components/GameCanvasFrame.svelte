<script lang="ts">
    import { CANVAS } from '$lib/game/config';

    interface Props {
        /** Expand to fill the parent; native resolution tracks container size */
        fill?: boolean;
        width?: number;
        height?: number;
        canvas?: HTMLCanvasElement | null;
        onGameClick?: (event: MouseEvent) => void;
    }

    let {
        fill = false,
        width = $bindable(CANVAS.width),
        height = $bindable(CANVAS.height),
        canvas = $bindable<HTMLCanvasElement | null>(null),
        onGameClick,
    }: Props = $props();

    let frameEl = $state<HTMLDivElement | null>(null);

    function syncCanvasResolution(w: number, h: number) {
        if (w <= 0 || h <= 0) return;
        if (w === width && h === height && canvas?.width === w && canvas?.height === h) {
            return;
        }

        width = w;
        height = h;

        if (canvas) {
            canvas.width = w;
            canvas.height = h;
        }
    }

    $effect(() => {
        if (fill) {
            if (!frameEl) return;

            const measure = () => {
                syncCanvasResolution(
                    Math.floor(frameEl!.clientWidth),
                    Math.floor(frameEl!.clientHeight),
                );
            };

            measure();
            const observer = new ResizeObserver(measure);
            observer.observe(frameEl);

            return () => observer.disconnect();
        }

        syncCanvasResolution(width, height);
    });
</script>

{#if fill}
    <div bind:this={frameEl} class="relative h-full w-full bg-(--bg-color-900)">
        <canvas
            class="absolute inset-0 block h-full w-full [image-rendering:pixelated]"
            bind:this={canvas}
            onclick={onGameClick}
        ></canvas>
    </div>
{:else}
    <div
        class="game-canvas-frame"
        style:--game-canvas-width="{width}px"
        style:--game-canvas-height="{height}px"
        style:--game-canvas-aspect="{width} / {height}"
    >
        <div class="game-canvas-stack" style:aspect-ratio="{width} / {height}">
            <canvas
                class="game-canvas-layer game-canvas-layer--game"
                bind:this={canvas}
                onclick={onGameClick}
            ></canvas>
        </div>
    </div>
{/if}
