<script lang="ts">
  import { onMount } from 'svelte';

  import clickupService from '../services/clickup-service';
  import Board from './kanban/Board.svelte';
  import moment from 'moment';
  import Login from './Login.svelte';
  import Filters from './shared/filters/Filters.svelte';
  import Header from './Header.svelte';
  import Timesheet from './timesheet/Timesheet.svelte';
  import { suspend } from '../store/suspender';
  import Table from './table/Table.svelte';
  import { loadLocalization, t } from '../store/i18n';
  import { loggedIn, login } from '../store/auth';
  import {
    cacheExpiration,
    initErrors,
    loadWorkspaceFromCache,
    refreshWorkspaceData,
    userList,
  } from '../store/workspace';
  import {
    activeFilters,
    tableMode,
    initializeFilters,
    mode,
    saveActiveFilter,
    savedFilters,
    term,
    viewMode,
  } from '../store/filters';
  import {
    addTaskTag,
    deleteTaskTag,
    filteredTasks,
    loadTasksFromCache,
    refreshTasks,
    tasks,
    updateTask,
  } from '../store/tasks';
  import {
    addTrack,
    deleteTrack,
    refreshTimeTracked,
    trackedWeek,
    trackings,
    updateTrack,
  } from '../store/timetracking';

  onMount(() => {
    loadLocalization();
    loadPage();
  });

  $effect(() => {
    // Refresh time tracked data when the week changes and we are in timesheet mode.
    if ($loggedIn && $trackedWeek && $mode === 'timesheet') {
      refreshTimeTracked();
    }
  });

  async function loadPage() {
    const loginResult = await login();
    if (!loginResult) {
      return;
    }
    if (!$loggedIn) {
      return;
    }

    await initializeFilters();
    await loadWorkspaceFromCache();
    await loadTasksFromCache();
    search(!$tasks.length || $mode === 'timesheet');

    if ($cacheExpiration > moment().valueOf()) {
      return;
    }
    await refreshWorkspaceData();
  }

  async function search(load = true) {
    await Promise.all([
      load ? suspend(refreshTasks()) : refreshTasks(),
      refreshTimeTracked(),
    ]);
  }

  function handleForceRefresh(e: KeyboardEvent) {
    if (e.ctrlKey && e.shiftKey && e.key === 'R') {
      search();
      refreshWorkspaceData();
      clickupService.setCache('starred', []);
    }
  }
</script>

<svelte:window onkeypress={handleForceRefresh} />
<div>
  {#if !$loggedIn}
    <Login onLoggedIn={loadPage} />
  {:else}
    <div class="fixed top-0 left-0 w-full bg-screen z-20 px-4 pt-1">
      <Header
        bind:filters={$activeFilters}
        bind:configFilters={$savedFilters}
        bind:viewMode={$viewMode}
        bind:tableMode={$tableMode}
        mode={$mode}
        trackings={$trackings}
        onSearch={search}
        onUpdateTrack={({ track, time }) => updateTrack(track, time)}
        onDeleteTrack={deleteTrack}
        onSaveFilters={saveActiveFilter}
      />
      <Filters
        bind:filters={$activeFilters}
        bind:term={$term}
        viewMode={$viewMode}
        onSearch={search}
      />
    </div>
    <div class="h-40"></div>
    {#if $initErrors}
      <h1 class="text-red-600 text-lg">
        Connection error, try to reload the extension
      </h1>
    {/if}
    {#if $mode === 'kanban'}
      {#if $tableMode}
        <Table
          tasks={$filteredTasks}
          onUpdateTask={updateTask}
          onAddTag={addTaskTag}
          onDeleteTag={deleteTaskTag}
        />
      {:else}
        <Board
          tasks={$filteredTasks}
          onUpdateTask={updateTask}
          onAddTrack={({ task, time }) =>
            addTrack(task, moment().valueOf(), time)}
          onDeleteTrack={deleteTrack}
          onChangeTrack={({ track, time }) => updateTrack(track, time)}
          onAddTag={addTaskTag}
          onDeleteTag={deleteTaskTag}
        />
      {/if}
    {:else if $mode === 'timesheet'}
      <Timesheet
        bind:trackedWeek={$trackedWeek}
        tasks={$filteredTasks}
        trackings={$trackings}
        onUpdateTrack={({ track, time }) => updateTrack(track, time)}
        onDeleteTrack={deleteTrack}
        onAddTrack={({ task, day, time }) => addTrack(task, day, time)}
      />
    {/if}
  {/if}
</div>
