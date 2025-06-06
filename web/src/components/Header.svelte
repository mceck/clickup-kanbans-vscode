<script lang="ts">
  import moment from 'moment';
  import type { Interval, PageFilters } from '../interfaces/clickup';
  import clickupService from '../services/clickup-service';
  import Icon from './commons/Icon.svelte';
  import EditTracking from './commons/EditTracking.svelte';
  import { toHours } from './utils/formatters';
  import { outsideClickable } from './utils/clickOutside';
  import { t } from '../store/i18n';

  interface Props {
    filters: PageFilters;
    configFilters: PageFilters[];
    viewMode: boolean;
    ganttMode: boolean;
    trackings: Interval[];
    mode: 'kanban' | 'timesheet';
    onSearch?: () => void;
    onUpdateTrack?: (detail: { track: Interval; time: number }) => void;
    onDeleteTrack?: (track: Interval) => void;
    onSaveFilters?: (isNew: boolean) => void;
  }

  let {
    filters = $bindable(),
    configFilters = $bindable(),
    viewMode = $bindable(),
    ganttMode = $bindable(),
    trackings,
    mode,
    onSearch,
    onUpdateTrack,
    onDeleteTrack,
    onSaveFilters,
  }: Props = $props();

  let showConfigurations = $state(false);
  let showTodayTrackEdit = $state(false);
  let showSaveOptions = $state(false);

  let trackingToday = $derived(
    trackings.filter(
      (t) =>
        +t.start >= moment().startOf('day').valueOf() &&
        +t.start <= moment().endOf('day').valueOf()
    )
  );

  let trackedToday = $derived(
    toHours(trackingToday.reduce((a, t) => a + +t.duration, 0))
  );

  let configName = $derived(mode === 'timesheet' ? 'ts-config' : 'vs-config');

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
    onSearch?.();
  }

  function updateTrack(track: Interval, time: number) {
    showTodayTrackEdit = false;
    onUpdateTrack?.({ track, time });
  }

  function deleteTrack(track: Interval) {
    showTodayTrackEdit = false;
    onDeleteTrack?.(track);
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
      JSON.parse(JSON.stringify({ filters: configFilters, ganttMode })),
      configName
    );
  }

  function deleteFilter(f: PageFilters) {
    showConfigurations = false;
    configFilters = configFilters.filter((e) => e !== f);
    filters = configFilters.find((e) => e.default)!;
    if (!filters) {
      filters = configFilters[0] ?? { ...f, name: '' };
      filters.default = true;
    }
    clickupService.saveConfig(
      JSON.parse(JSON.stringify({ filters: configFilters, ganttMode })),
      configName
    );
    viewMode = !!filters.selectedView;
    search();
  }

  async function saveFilters(isNew: boolean = false) {
    onSaveFilters?.(isNew);
  }
</script>

<svelte:window
  onkeydown={(e) =>
    e.key === 'Escape' &&
    (showSaveOptions = showConfigurations = showTodayTrackEdit = false)}
/>
<div>
  <div class="flex justify-between w-full">
    <div aria-label="configuration">
      <small
        class="cursor-pointer"
        use:outsideClickable={'[aria-label="configuration"]'}
        onclickOutside={() => (showConfigurations = false)}
        onclick={() => {
          showConfigurations = !showConfigurations;
        }}>{filters.name}</small
      >
      {#if showConfigurations}
        <div class="absolute p-2 bg-screen border rounded border-gray-600 z-10">
          {#each configFilters as f}
            <div class="flex items-center py-1">
              <span class="w-24 cursor-pointer" onclick={() => selectFilter(f)}
                >{f.name}</span
              >
              <span
                class="h-4 cursor-pointer {f.default && 'text-green-500'}"
                onclick={() => defaultFilter(f)}
                ><Icon class="h-4 w-4" name="check" /></span
              >
              <span
                class="ml-1 h-4 cursor-pointer"
                onclick={() => deleteFilter(f)}
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
        onclickOutside={() => (showTodayTrackEdit = false)}
        onclick={() => {
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
          onUpdate={(event) => updateTrack(event.track, event.time)}
          onDelete={(track) => deleteTrack(track)}
        />
      {/if}
      {#if mode === 'kanban'}
        <div
          class="w-9 px-2 text-xs flex-none flex items-center cursor-pointer text-[#cccccc] hover:text-white"
          title={ganttMode ? $t('switch-kanban') : $t('switch-gantt')}
          onclick={toggleChartMode}
        >
          {#if ganttMode}
            <Icon name="gantt" class="w-full" />
          {:else}
            <Icon name="board" class="w-full" />
          {/if}
        </div>
      {/if}
      <div
        class="w-5 flex-none ml-4 flex items-center cursor-pointer text-[#cccccc] hover:text-white"
        title={$t('global.save-filters')}
        onclick={() => saveFilters()}
      >
        <Icon name="save" />
      </div>
      <div
        class="w-4 flex-none ml-1 flex items-center relative cursor-pointer text-[#cccccc] hover:text-white"
        use:outsideClickable={'[aria-label="actions"]'}
        onclickOutside={() => (showSaveOptions = false)}
        onclick={() => {
          showSaveOptions = !showSaveOptions;
          showTodayTrackEdit = false;
        }}
      >
        <Icon name="ellipsis" class="flex-none" />
        {#if showSaveOptions}
          <ul
            class="absolute p-2 w-24 top-6 right-full bg-screen rounded-lg border border-gray-600 shadow overflow-hidden z-10"
          >
            <!-- svelte-ignore node_invalid_placement_ssr -->
            <button onclick={() => saveFilters(true)}
              >{$t('global.save-as')}</button
            >
          </ul>
        {/if}
      </div>
      <div
        class="w-9 px-2 flex-none ml-2 flex items-center cursor-pointer text-[#cccccc] hover:text-white"
        onclick={() => search()}
      >
        <Icon name="refresh" class="w-full" title={$t('global.reload')} />
      </div>
    </div>
  </div>
  {#if mode === 'kanban'}
    <div class="flex">
      <div
        class="flex-1 text-center cursor-pointer text-[#cccccc] hover:text-white rounded {!viewMode &&
          'bg-gray-500 bg-opacity-10'}"
        onclick={() => setViewMode(false)}
      >
        Tasks
      </div>
      <div
        class="flex-1 text-center cursor-pointer text-[#cccccc] hover:text-white rounded {viewMode &&
          'bg-gray-500 bg-opacity-10'}"
        onclick={() => setViewMode(true)}
      >
        View
      </div>
    </div>
  {/if}
</div>
