<script lang="ts">
    import { RoButton, RoWindow } from '$lib/components/ui';

    interface Props {
        onResume: () => void;
        onMenu: () => void;
    }

    let { onResume, onMenu }: Props = $props();
</script>

<div class="pointer-events-auto absolute inset-0 flex items-center justify-center bg-[#0a1628]/40 p-4">
    <RoWindow title="Paused" class="w-full max-w-xs">
        <div class="flex flex-col gap-2">
            <RoButton onclick={onResume}>Resume</RoButton>
            <RoButton onclick={onMenu}>Main Menu</RoButton>
        </div>
    </RoWindow>
</div>
