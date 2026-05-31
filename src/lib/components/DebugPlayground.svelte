<script lang="ts">
    import type { Snippet } from 'svelte';
    import { RoWindow } from '$lib/components/ui';

    interface Props {
        children: Snippet;
        left?: Snippet;
        right?: Snippet;
        overlays?: Snippet;
        leftTitle?: string;
        rightTitle?: string;
    }

    let { children, left, right, overlays, leftTitle, rightTitle }: Props = $props();

    const columnClass =
        'flex h-full w-72 max-w-[min(18rem,40vw)] shrink-0 flex-col min-h-0 sm:w-80';
</script>

<div class="relative h-full min-h-0 w-full overflow-hidden">
    <!-- Arena: full playground — native resolution tracks this layer -->
    <div class="absolute inset-0 z-0">
        {@render children()}
    </div>

    <!-- Side columns (snippet slots); center stays open for the canvas -->
    <div class="pointer-events-none absolute inset-0 z-20 flex h-full gap-3 p-3">
        {#if left}
            <aside class="{columnClass} pointer-events-auto">
                <RoWindow title={leftTitle} class="min-h-0 flex-1 overflow-hidden">
                    <div class="flex flex-col gap-3">
                        {@render left()}
                    </div>
                </RoWindow>
            </aside>
        {/if}

        <div class="min-h-0 min-w-0 flex-1" aria-hidden="true"></div>

        {#if right}
            <aside class="{columnClass} pointer-events-auto">
                <RoWindow title={rightTitle} class="min-h-0 flex-1 overflow-hidden">
                    <div class="flex flex-col gap-3">
                        {@render right()}
                    </div>
                </RoWindow>
            </aside>
        {/if}
    </div>

    {#if overlays}
        <div class="pointer-events-none absolute inset-0 z-30">
            {@render overlays()}
        </div>
    {/if}
</div>
