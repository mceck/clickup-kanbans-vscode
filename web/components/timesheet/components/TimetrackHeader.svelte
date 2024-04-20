<script lang="ts">
  import moment from 'moment';
  import { createEventDispatcher } from 'svelte';
  import Icon from '../../commons/Icon.svelte';
  import Switch from '../../commons/Switch.svelte';
  import type { Interval } from '../../../interfaces/clickup';
  import { toHours } from '../../utils/formatters';
  import DayTotal from './DayTotal.svelte';
  import { FERIAL_DAYS } from '../tracking-utils';

  export let trackedWeek: string;
  export let trackings: Interval[] = [];
  export let onlyFilteredTasks = false;
  export let taskIds: string[] = [];
  export let filterMode = 'task';

  const dispatch = createEventDispatcher();

  function trackingsForDay(trackings: Interval[], day: number) {
    return trackings.filter((t) => {
      const d = moment(trackedWeek).add(day, 'days');
      const start = d.startOf('day').valueOf();
      const end = d.endOf('day').valueOf();
      return (
        t.start >= start &&
        t.start <= end &&
        (!onlyFilteredTasks || taskIds.includes(t.task.id))
      );
    });
  }

  function totalForDay(trackings: Interval[], day: number, _?: boolean) {
    return trackingsForDay(trackings, day).reduce(
      (acc, t) => acc + t.duration,
      0
    );
  }

  function updateOnlyFiltered(value: boolean) {
    dispatch('updateOnlyFiltered', value);
  }

  function toggleFilterMode() {
    dispatch('toggleFilterMode');
  }

  function hasAtLeastEightHours(
    trackings: Interval[],
    day: number,
    onlyFilteredTasks: boolean
  ) {
    return totalForDay(trackings, day, onlyFilteredTasks) >= 3600000 * 8;
  }
</script>

<div class="flex flex-wrap w-full">
  <div class="flex w-full items-center mb-3 text-lg font-bold">
    <p class="w-1/12"><Icon class="w-6" name="star" /></p>
    <p class="w-6/12 cursor-pointer" on:click={toggleFilterMode}>
      Task
      <span class="text-gray-500 text-sm font-normal italic ml-4"
        >{filterMode === 'usage' ? 'by usage' : ''}</span
      >
      <span class="font-normal text-sm italic float-right pt-1 mr-8"
        >{moment(trackedWeek).format('DD/MM/yyyy')} - {moment(trackedWeek)
          .add(4, 'days')
          .format('DD/MM/yyyy')}</span
      >
    </p>
    {#each FERIAL_DAYS as day}
      <p class="w-1/12">
        {moment(trackedWeek).add(day, 'days').format('ddd')}
      </p>
    {/each}
  </div>
  <div class="flex w-full items-center pb-3 border-b-4 border-neutral-800">
    <p class="w-1/12" />
    <p class="w-6/12">
      <span
        class="mr-8 float-right"
        title="Show total tracked time only for filtered tasks"
      >
        <span class="mr-2 text-neutral-400">Totals filtered: </span>
        <Switch
          value={onlyFilteredTasks}
          on:change={(e) => updateOnlyFiltered(e.detail)}
        />
      </span>
    </p>
    {#each FERIAL_DAYS as day}
      <DayTotal
        hasAtLeastEightHours={hasAtLeastEightHours(
          trackings,
          day,
          onlyFilteredTasks
        )}
        {onlyFilteredTasks}
        hours={toHours(totalForDay(trackings, day, onlyFilteredTasks))}
        intervals={trackingsForDay(trackings, day)}
        on:update
        on:delete
      />
    {/each}
  </div>
</div>
