<script lang="ts">
    interface Props {
        lines: readonly string[];
        class?: string;
    }

    let { lines, class: className = '' }: Props = $props();
</script>

<div
    class="pointer-events-none space-y-0.5 text-right font-mono text-xs text-(--text-color) {className}"
    aria-live="polite"
>
    {#each lines as line (line)}
        <div>{line}</div>
    {/each}
</div>
