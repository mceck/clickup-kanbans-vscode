<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Icon from '../../commons/Icon.svelte';

  export let color: string;
  export let status: string;
  export let tasksCount: number;
  export let open: boolean;
  const dispatch = createEventDispatcher();

  function onToggle() {
    dispatch('toggle');
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
    class="w-5 cursor-pointer float-right transform {open && 'rotate-180'}"
    on:click={onToggle}
  >
    <Icon name="chevron" />
  </button>
</div>
