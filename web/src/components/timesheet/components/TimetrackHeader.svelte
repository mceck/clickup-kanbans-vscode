<script lang="ts">
  import moment from 'moment';
  import Icon from '../../shared/Icon.svelte';
  import Switch from '../../shared/Switch.svelte';
  import type { Interval } from '../../../interfaces/clickup';
  import { toHours } from '../../utils/formatters';
  import DayTotal from './DayTotal.svelte';
  import { FERIAL_DAYS } from '../tracking-utils';
  import { dateFormat, locale, t } from '../../../store/i18n';

  interface Props {
    trackedWeek: string;
    trackings?: Interval[];
    onlyFilteredTasks?: boolean;
    taskIds?: string[];
    filterMode?: string;
    onUpdateOnlyFiltered?: (value: boolean) => void;
    onToggleFilterMode?: () => void;
    onUpdate?: (event: { track: Interval; time: number }) => void;
    onDelete?: (track: Interval) => void;
  }

  let {
    trackedWeek,
    trackings = [],
    onlyFilteredTasks = false,
    taskIds = [],
    filterMode = 'task',
    onUpdateOnlyFiltered,
    onToggleFilterMode,
    onUpdate,
    onDelete,
  }: Props = $props();

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
    onUpdateOnlyFiltered?.(value);
  }

  function toggleFilterMode() {
    onToggleFilterMode?.();
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
    <p class="w-1/12"><Icon class="w-6 h-6" name="star" /></p>
    <div
      class="w-6/12 cursor-pointer text-left bg-transparent border-none p-0 font-inherit text-inherit"
      onclick={toggleFilterMode}
    >
      Task
      <span class="text-gray-500 text-sm font-normal italic ml-4"
        >{filterMode === 'usage' ? $t('timesheet.task-by-usage') : ''}</span
      >
      <span class="font-normal text-sm italic float-right pt-1 mr-8"
        >{moment(trackedWeek).format($dateFormat)} - {moment(trackedWeek)
          .add(4, 'days')
          .format($dateFormat)}</span
      >
    </div>
    {#each FERIAL_DAYS as day}
      <p class="w-1/12">
        {$t('days.' + moment(trackedWeek).add(day, 'days').day())}
        <span class="text-gray-500 text-sm font-normal italic ml-1"
          >{moment(trackedWeek).add(day, 'days').format('DD')}</span
        >
      </p>
    {/each}
  </div>
  <div class="flex w-full items-center pb-3 border-b-4 border-neutral-800">
    <p class="w-1/12"></p>
    <p class="w-6/12">
      <span
        class="mr-8 float-right"
        title={$t('timesheet.total-time-filtered')}
      >
        <span class="mr-2 text-neutral-400"
          >{$t('timesheet.totals-filtered')}:
        </span>
        <Switch value={onlyFilteredTasks} onChange={updateOnlyFiltered} />
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
        {onUpdate}
        {onDelete}
      />
    {/each}
  </div>
</div>
