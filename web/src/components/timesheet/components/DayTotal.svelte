<script lang="ts">
  import EditTracking from '../../commons/EditTracking.svelte';
  import { outsideClickable } from '../../utils/clickOutside';

  interface Props {
    hasAtLeastEightHours: boolean;
    onlyFilteredTasks: boolean;
    hours: string;
    intervals: any;
  }

  let { hasAtLeastEightHours, onlyFilteredTasks, hours, intervals }: Props =
    $props();
  let edit: boolean = $state(false);
</script>

<p
  class="w-1/12 relative {hasAtLeastEightHours
    ? 'text-green-500'
    : 'text-red-400'} {!onlyFilteredTasks && 'cursor-pointer'}"
  use:outsideClickable
  onclickOutside={() => (edit = false)}
  onclick={() => (edit = !edit)}
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
