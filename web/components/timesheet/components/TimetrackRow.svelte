<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Icon from '../../commons/Icon.svelte';
  import type { Interval, Task } from '../../../interfaces/clickup';
  import TimetrackCell from './TimetrackCell.svelte';
  import { FERIAL_DAYS, totalForTaskDay } from '../tracking-utils';

  export let trackedWeek: string;
  export let task: Task;
  export let starred: string[];
  export let trackings: Interval[];

  const dispatch = createEventDispatcher();
</script>

<div class="flex w-full items-center py-4 border-b border-neutral-800">
  <p class="w-1/12" on:click={() => dispatch('star')}>
    <Icon
      name={starred.includes(task.id) ? 'star' : 'star-empty'}
      class="w-6"
    />
  </p>
  <a class="w-6/12" href={task.url}>{task.name}</a>
  {#each FERIAL_DAYS as day}
    <TimetrackCell
      totalForDay={totalForTaskDay(trackings, task.id, day, trackedWeek)}
      on:updateTrack={(e) =>
        dispatch('updateTrack', { task, day, time: e.detail })}
      on:deleteTrack
    />
  {/each}
</div>
