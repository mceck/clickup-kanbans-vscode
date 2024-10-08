<script lang="ts">
  import moment from 'moment';
  import { createEventDispatcher } from 'svelte';
  import type { Interval, PageFilters } from '../interfaces/clickup';
  import clickupService from '../services/clickup-service';
  import Icon from './commons/Icon.svelte';
  import EditTracking from './commons/EditTracking.svelte';
  import { toHours } from './utils/formatters';
  import { outsideClickable } from './utils/clickOutside';
  import { t } from '../store/i18n';

  export let filters: PageFilters;
  export let configFilters: PageFilters[];
  export let viewMode: boolean;
  export let ganttMode: boolean;
  export let trackings: Interval[];
  export let mode: 'kanban' | 'timesheet';

  let showConfigurations = false;
  let showTodayTrackEdit = false;
  let showSaveOptions = false;

  const dispatch = createEventDispatcher();

  $: trackingToday = trackings.filter(
    (t) =>
      +t.start >= moment().startOf('day').valueOf() &&
      +t.start <= moment().endOf('day').valueOf()
  );

  $: trackedToday = toHours(trackingToday.reduce((a, t) => a + +t.duration, 0));

  $: configName = mode === 'timesheet' ? 'ts-config' : 'vs-config';

  function setViewMode(mode: boolean) {
    if (mode === viewMode) {
      return;
    }
    viewMode = mode;
    search();
  }

  function toggleChartMode() {
    ganttMode = !ganttMode;
  }

  function search() {
    dispatch('search');
  }

  function updateTrack(track: Interval, time: number) {
    showTodayTrackEdit = false;
    dispatch('updateTrack', { track, time });
  }

  function deleteTrack(track: Interval) {
    showTodayTrackEdit = false;
    dispatch('deleteTrack', track);
  }

  function selectFilter(f: PageFilters) {
    showConfigurations = false;
    filters = f ?? filters;
    viewMode = !!filters.selectedView;
    search();
  }

  async function defaultFilter(f: PageFilters) {
    showConfigurations = false;
    configFilters = configFilters.map((e) => ({ ...e, default: e === f }));
    await clickupService.saveConfig(
      { filters: configFilters, ganttMode },
      configName
    );
  }

  function deleteFilter(f: PageFilters) {
    showConfigurations = false;
    configFilters = configFilters.filter((e) => e !== f);
    filters = configFilters.find((e) => e.default);
    if (!filters) {
      filters = configFilters[0] ?? { ...f, name: '' };
      filters.default = true;
    }
    clickupService.saveConfig(
      { filters: configFilters, ganttMode },
      configName
    );
    viewMode = !!filters.selectedView;
    search();
  }

  async function saveFilters(isNew: boolean = false) {
    dispatch('saveFilters', isNew);
  }
</script>

<svelte:window
  on:keydown={(e) =>
    e.key === 'Escape' &&
    (showSaveOptions = showConfigurations = showTodayTrackEdit = false)}
/>
<div>
  <div class="flex justify-between w-full">
    <div aria-label="configuration">
      <small
        class="cursor-pointer"
        use:outsideClickable={'[aria-label="configuration"]'}
        on:clickOutside={() => (showConfigurations = false)}
        on:click={() => {
          showConfigurations = !showConfigurations;
        }}>{filters.name}</small
      >
      {#if showConfigurations}
        <div class="absolute p-2 bg-screen border rounded border-gray-600 z-10">
          {#each configFilters as f}
            <div class="flex items-center py-1">
              <span class="w-24 cursor-pointer" on:click={() => selectFilter(f)}
                >{f.name}</span
              >
              <span
                class="h-4 cursor-pointer {f.default && 'text-green-500'}"
                on:click={() => defaultFilter(f)}
                ><Icon class="h-4 w-4" name="check" /></span
              >
              <span
                class="ml-1 h-4 cursor-pointer"
                on:click={() => deleteFilter(f)}
                ><Icon class="h-4 w-4" name="trash" /></span
              >
            </div>
          {/each}
        </div>
      {/if}
    </div>
    <div class="flex justify-end items-center w-full mb-2" aria-label="actions">
      <div
        class="flex w-10 items-center text-xs text-green-400 mr-3 cursor-pointer"
        title={$t('time-tracked-today')}
        use:outsideClickable={'[aria-label="actions"]'}
        on:clickOutside={() => (showTodayTrackEdit = false)}
        on:click={() => {
          showTodayTrackEdit = !showTodayTrackEdit;
          showSaveOptions = false;
        }}
      >
        <Icon name="clock" class="w-3 mr-1 flex-none stroke-current" />
        <span>{trackedToday}</span>
      </div>
      {#if showTodayTrackEdit}
        <EditTracking
          showTask={true}
          intervals={trackingToday}
          on:update={({ detail }) => updateTrack(detail.track, detail.time)}
          on:delete={({ detail }) => deleteTrack(detail)}
        />
      {/if}
      {#if mode === 'kanban'}
        <button
          class="w-9 px-2 text-xs flex-none flex items-center"
          title={ganttMode ? $t('switch-kanban') : $t('switch-gantt')}
          on:click={toggleChartMode}
        >
          {#if ganttMode}
            <Icon name="gantt" class="w-full" />
          {:else}
            <Icon name="board" class="w-full" />
          {/if}
        </button>
      {/if}
      <button
        class="w-5 flex-none ml-4 flex items-center"
        title={$t('global.save-filters')}
        on:click={() => saveFilters()}
      >
        <Icon name="save" />
      </button>
      <button
        class="w-4 flex-none ml-1 flex items-center relative"
        use:outsideClickable={'[aria-label="actions"]'}
        on:clickOutside={() => (showSaveOptions = false)}
        on:click={() => {
          showSaveOptions = !showSaveOptions;
          showTodayTrackEdit = false;
        }}
      >
        <Icon name="ellipsis" class="flex-none" />
        {#if showSaveOptions}
          <ul
            class="absolute p-2 w-24 top-6 right-full bg-screen rounded-lg border border-gray-600 shadow overflow-hidden z-10"
          >
            <button on:click={() => saveFilters(true)}
              >{$t('global.save-as')}</button
            >
          </ul>
        {/if}
      </button>
      <button
        class="w-9 px-2 flex-none ml-2 flex items-center"
        on:click={() => search()}
      >
        <Icon name="refresh" class="w-full" title={$t('global.reload')} />
      </button>
    </div>
  </div>
  {#if mode === 'kanban'}
    <div class="flex">
      <div
        class="flex-1 text-center cursor-pointer hover:bg-gray-400 hover:bg-opacity-5 rounded {!viewMode &&
          'bg-gray-500 bg-opacity-10'}"
        on:click={() => setViewMode(false)}
      >
        Tasks
      </div>
      <div
        class="flex-1 text-center cursor-pointer hover:bg-gray-400 hover:bg-opacity-5 rounded {viewMode &&
          'bg-gray-500 bg-opacity-10'}"
        on:click={() => setViewMode(true)}
      >
        View
      </div>
    </div>
  {/if}
</div>
