<script lang="ts">
  import Icon from '../../shared/Icon.svelte';

  interface Props {
    color: string;
    status: string;
    tasksCount: number;
    open: boolean;
    onToggleCallback?: () => void;
  }

  let { color, status, tasksCount, open, onToggleCallback }: Props = $props();

  function onToggle() {
    onToggleCallback?.();
  }
</script>

<div
  class="uppercase text-lg px-2 py-1 flex justify-between items-center"
  style={`color: ${color}; border-color: ${color};`}
>
  <div class="flex items-center gap-2">
    <span>{status}</span>
    <span class="text-sm">({tasksCount})</span>
  </div>
  <button
    class="w-6 h-6 !p-0 cursor-pointer float-right transition-transform transform {open &&
      'rotate-180'}"
    onclick={onToggle}
  >
    <Icon name="chevron" />
  </button>
</div>
