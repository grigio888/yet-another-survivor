<script lang="ts">
    import {
        GAME_OVER_SCREEN,
        buildGameOverLines,
        type GameOverSummary,
    } from '$lib/game/screens';
    import { RoButton, RoWindow } from '$lib/components/ui';

    interface Props {
        summary: GameOverSummary;
        onRestart: () => void;
        onMenu: () => void;
    }

    let { summary, onRestart, onMenu }: Props = $props();

    const lines = $derived(buildGameOverLines(summary));
</script>

<div class="pointer-events-auto absolute inset-0 flex items-center justify-center bg-[#0a1628]/40 p-4">
    <RoWindow title={GAME_OVER_SCREEN.title} class="w-full max-w-md">
        <div class="flex flex-col gap-4">
            <dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {#each lines as line (line.label)}
                    <dt class="ro-muted">{line.label}</dt>
                    <dd class="text-right ro-strong">{line.value}</dd>
                {/each}
            </dl>
            <div class="flex flex-col gap-2 sm:flex-row">
                <RoButton class="flex-1" onclick={onRestart}>{GAME_OVER_SCREEN.restartLabel}</RoButton>
                <RoButton class="flex-1" onclick={onMenu}>{GAME_OVER_SCREEN.menuLabel}</RoButton>
            </div>
        </div>
    </RoWindow>
</div>
