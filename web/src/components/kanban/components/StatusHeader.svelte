<script lang="ts">
  import Icon from '../../commons/Icon.svelte';

  interface Props {
    color: string;
    status: string;
    tasksCount: number;
    open: boolean;
    onToggleCallback?: () => void;
  }

  let {
    color,
    status,
    tasksCount,
    open,
    onToggleCallback
  }: Props = $props();
  // const dispatch = createEventDispatcher();

  function onToggle() {
    onToggleCallback?.();
  }
</script>

<div
  class="rounded-t-lg border uppercase text-lg px-2 py-1"
  style={`color: ${color}; border-color: ${color};`}
>
  {status}
  {#if open}
    <span>({tasksCount})</span>
  {/if}
  <button
    class="w-5 h-5 cursor-pointer float-right transform {open && 'rotate-180'}"
    onclick={onToggle}
  >
    <Icon name="chevron" />
  </button>
</div>
