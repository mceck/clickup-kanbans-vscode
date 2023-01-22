<script lang="ts">
  import moment from 'moment';
  import { createEventDispatcher } from 'svelte';
  import type {
    Interval,
    PageFilters,
    WorkspaceConfig,
  } from '../interfaces/clickup';
  import clickupService from '../services/clickup-service';
  import Icon from './commons/Icon.svelte';
  import EditTracking from './kanban/task/EditTracking.svelte';
  import { toHours } from './utils/formatters';

  export let filters: PageFilters;
  export let configFilters: PageFilters[];
  export let viewMode: boolean;
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

  function toggleViewMode() {
    viewMode = !viewMode;
    search();
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
    filters = f ?? filters;
    viewMode = !!filters.selectedView;
    search();
    showConfigurations = false;
  }

  async function defaultFilter(f: PageFilters) {
    configFilters = configFilters.map((e) => ({ ...e, default: e === f }));
    await clickupService.saveConfig({ filters: configFilters }, configName);
    showConfigurations = false;
  }

  function deleteFilter(f: PageFilters) {
    configFilters = configFilters.filter((e) => e !== f);
    filters = configFilters.find((e) => e.default);
    if (!filters) {
      filters = configFilters[0] ?? { ...f, name: '' };
      filters.default = true;
    }
    clickupService.saveConfig({ filters: configFilters }, configName);
    showConfigurations = false;
    viewMode = !!filters.selectedView;
    search();
  }

  async function saveFilters(isNew: boolean = false) {
    if (!filters.name) {
      isNew = true;
    }
    if (isNew) {
      const filterToSave = { ...filters, default: true };
      const { data } = await clickupService.showInput({
        placeHolder: 'Configuration name',
        prompt: 'Choose a name',
        value: '',
      });
      filterToSave.name = data.trim();
      if (!filterToSave.name || configFilters.find((f) => f.name === data)) {
        clickupService.showToast('error', 'Invalid name');
        return;
      }
      if (!viewMode) {
        filterToSave.selectedView = undefined;
      } else {
        filterToSave.selectedLists = [];
      }
      const config: WorkspaceConfig = {
        filters: [
          ...configFilters.map((f) => ({ ...f, default: false })),
          filterToSave,
        ],
      };
      const res = await clickupService.saveConfig(config, configName);
      if (res.ok) {
        filters = filterToSave;
        configFilters = config.filters;
        clickupService.showToast('info', 'Configuration saved');
      }
    } else {
      const idx = configFilters.findIndex((e) => e.name === filters.name);
      if (idx >= 0) {
        configFilters[idx] = { ...filters };
        const res = await clickupService.saveConfig(
          { filters: configFilters },
          configName
        );
        if (res.ok) {
          clickupService.showToast('info', 'Configuration saved');
        }
      }
    }
  }
</script>

<svelte:window
  on:click={() =>
    (showSaveOptions = showConfigurations = showTodayTrackEdit = false)}
  on:keydown={(e) =>
    e.key === 'Escape' &&
    (showSaveOptions = showConfigurations = showTodayTrackEdit = false)}
/>
<div class="flex justify-between w-full">
  <div>
    <small
      class="cursor-pointer"
      on:click|stopPropagation={() => {
        showConfigurations = !showConfigurations;
        showTodayTrackEdit = showSaveOptions = false;
      }}>{filters.name}</small
    >
    {#if showConfigurations}
      <div
        class="absolute p-2 bg-screen border rounded border-gray-600 z-10"
        on:click|stopPropagation
      >
        {#each configFilters as f}
          <div class="flex items-center py-1">
            <span class="w-24 cursor-pointer" on:click={() => selectFilter(f)}
              >{f.name}</span
            >
            <span
              class="h-4 cursor-pointer {f.default && 'text-green-500'}"
              on:click={() => defaultFilter(f)}><Icon name="check" /></span
            >
            <span class="h-4 cursor-pointer" on:click={() => deleteFilter(f)}
              ><Icon name="trash" /></span
            >
          </div>
        {/each}
      </div>
    {/if}
  </div>
  <div class="flex justify-end items-center w-full mb-2">
    <div
      class="flex w-6 items-center text-xs text-green-400 mr-3"
      title="Time tracked today"
      on:click|stopPropagation={() => {
        showTodayTrackEdit = !showTodayTrackEdit;
        showConfigurations = showSaveOptions = false;
      }}
    >
      <Icon name="clock" class="w-3 mr-1 flex-none stroke-current" />
      <span>{trackedToday}</span>
    </div>
    {#if showTodayTrackEdit}
      <EditTracking
        intervals={trackingToday}
        on:update={({ detail }) => updateTrack(detail.track, detail.time)}
        on:delete={({ detail }) => deleteTrack(detail)}
      />
    {/if}
    {#if mode === 'kanban'}
      <button
        class="w-9 px-2 text-xs flex-none flex items-center"
        title={viewMode ? 'Switch to filter mode' : 'Switch to view mode'}
        on:click={toggleViewMode}
      >
        {#if viewMode}
          <Icon name="board" class="w-full" />
        {:else}
          <Icon name="filter" class="w-full" />
        {/if}
      </button>
    {/if}
    <button
      class="w-5 flex-none ml-4 flex items-center"
      title="Save filters"
      on:click={() => saveFilters()}
    >
      <Icon name="save" />
    </button>
    <button
      class="w-4 flex-none ml-1 flex items-center relative"
      on:click|stopPropagation={() => {
        showSaveOptions = !showSaveOptions;
        showConfigurations = showTodayTrackEdit = false;
      }}
    >
      <Icon name="ellipsis" class="flex-none" />
      {#if showSaveOptions}
        <ul
          class="absolute p-2 w-24 top-6 right-full bg-screen rounded-lg border border-gray-600 shadow overflow-hidden z-10"
        >
          <button on:click={() => saveFilters(true)}>Save as...</button>
        </ul>
      {/if}
    </button>
    <button
      class="w-9 px-2 flex-none ml-2 flex items-center"
      on:click={() => search()}
    >
      <Icon name="refresh" class="w-full" title="Reload" />
    </button>
  </div>
</div>
