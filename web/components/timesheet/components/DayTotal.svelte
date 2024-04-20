<script lang="ts">
  import EditTracking from '../../commons/EditTracking.svelte';
  import { outsideClickable } from '../../utils/clickOutside';

  export let hasAtLeastEightHours: boolean;
  export let onlyFilteredTasks: boolean;
  export let hours: string;
  export let intervals: any;
  let edit: boolean = false;
</script>

<p
  class="w-1/12 relative {hasAtLeastEightHours
    ? 'text-green-500'
    : 'text-red-400'} {!onlyFilteredTasks && 'cursor-pointer'}"
  use:outsideClickable
  on:clickOutside={() => (edit = false)}
  on:click={() => (edit = !edit)}
>
  {hours}
  {#if edit}
    <EditTracking
      class="w-[450px] right-1/2 max-h-56 text-white"
      showTask={true}
      {intervals}
      on:update
      on:delete
    />
  {/if}
</p>
