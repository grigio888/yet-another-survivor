<script lang="ts">
    import { MENU_SCREEN } from '$lib/game/screens';
    import { RoButton, RoWindow } from '$lib/components/ui';

    interface Props {
        onStart: () => void;
    }

    let { onStart }: Props = $props();
</script>

<div class="pointer-events-auto absolute inset-0 flex items-center justify-center bg-[#0a1628]/40 p-4">
    <RoWindow title={MENU_SCREEN.title} class="w-full max-w-md">
        <div class="flex flex-col gap-4">
            <p class="text-center text-sm ro-muted">{MENU_SCREEN.subtitle}</p>
            <ul class="ro-panel space-y-1.5 p-3 text-sm ro-muted">
                {#each MENU_SCREEN.instructions as line}
                    <li>{line}</li>
                {/each}
            </ul>
            <RoButton class="w-full" onclick={onStart}>{MENU_SCREEN.startLabel}</RoButton>
        </div>
    </RoWindow>
</div>
