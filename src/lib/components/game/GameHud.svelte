<script lang="ts">
    import { RoWindow } from '$lib/components/ui';

    interface Props {
        wave: number;
        score: number;
        kills: number;
        lives: number;
        timeAlive: number;
    }

    let { wave, score, kills, lives, timeAlive }: Props = $props();
</script>

<RoWindow title="Status" class="absolute top-3 right-3 w-44" bodyClass="p-2">
    <dl class="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <dt class="ro-muted">Wave</dt>
        <dd class="text-right ro-strong">{wave}</dd>
        <dt class="ro-muted">Score</dt>
        <dd class="text-right ro-strong">{score}</dd>
        <dt class="ro-muted">Kills</dt>
        <dd class="text-right ro-strong">{kills}</dd>
        <dt class="ro-muted">Lives</dt>
        <dd class="text-right ro-strong">{lives}</dd>
        <dt class="ro-muted">Time</dt>
        <dd class="text-right ro-strong">{timeAlive.toFixed(1)}s</dd>
    </dl>
</RoWindow>
