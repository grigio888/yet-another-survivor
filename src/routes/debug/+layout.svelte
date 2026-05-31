<script lang="ts">
    import DebugHeader from '$lib/components/DebugHeader.svelte';

    let { children } = $props();
</script>

<div class="flex h-dvh min-h-0 flex-col bg-(--bg-color-900)">
    <DebugHeader />
    <div class="min-h-0 flex-1 overflow-hidden">
        {@render children()}
    </div>
</div>
