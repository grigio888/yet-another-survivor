<script lang="ts">
    import type { Snippet } from 'svelte';

    interface Props {
        children: Snippet;
        left?: Snippet;
        right?: Snippet;
    }

    let { children, left, right }: Props = $props();

    const panelClass =
        'pointer-events-auto absolute top-3 bottom-3 z-20 flex w-72 max-w-[min(18rem,calc(100vw-1.5rem))] flex-col gap-3 overflow-y-auto rounded-md border border-(--border-color)/65 bg-(--background-color)/88 p-4 shadow-lg backdrop-blur-sm sm:w-80';
</script>

<div class="relative h-full min-h-0 w-full overflow-hidden">
    <div class="absolute inset-0">
        {@render children()}
    </div>

    {#if left}
        <aside class="{panelClass} left-3">
            {@render left()}
        </aside>
    {/if}

    {#if right}
        <aside class="{panelClass} right-3">
            {@render right()}
        </aside>
    {/if}
</div>
