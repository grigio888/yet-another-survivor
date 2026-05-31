<script lang="ts">
    interface Props {
        lines: readonly string[];
        class?: string;
    }

    let { lines, class: className = '' }: Props = $props();
</script>

<div
    class="space-y-0.5 text-right font-mono text-xs text-[var(--ro-text-strong,#17365a)] {className}"
    aria-live="polite"
>
    {#each lines as line (line)}
        <div>{line}</div>
    {/each}
</div>
