<script lang="ts">
    import { CANVAS } from '$lib/game/config';
    import type { Snippet } from 'svelte';

    interface Props {
        width?: number;
        height?: number;
        children: Snippet;
    }

    let { width = CANVAS.width, height = CANVAS.height, children }: Props = $props();
</script>

<div
    class="game-canvas-frame"
    style:--game-canvas-width="{width}px"
    style:--game-canvas-height="{height}px"
    style:--game-canvas-aspect="{width} / {height}"
>
    {@render children()}
</div>
