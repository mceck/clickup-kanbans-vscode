<script lang="ts">
  import { onMount } from 'svelte';

  import type {
    List,
    Task,
    User,
    WorkspaceConfig,
  } from '../interfaces/clickup';
  import ClickupService from '../services/clickup-service';
  import { user, userList } from '../store/users';
  import AssigneesSelector from './AssigneesSelector/AssigneesSelector.svelte';
  import Kanban from './Kanban.svelte';
  import ListSelector from './ListSelector/ListSelector.svelte';
  import { spacesTree } from '../store/spaces-tree';
  // @ts-ignore
  import RefreshIcon from '../assets/refresh.svg';
  // @ts-ignore
  import SaveIcon from '../assets/save.svg';
  // @ts-ignore
  import EllipsisIcon from '../assets/ellipsis.svg';
  // @ts-ignore
  import Spinner from '../assets/cog.svg';
  // @ts-ignore
  import BoardIcon from '../assets/board.svg';
  // @ts-ignore
  import FilterIcon from '../assets/filter.svg';
  // @ts-ignore
  import ClockIcon from '../assets/clock.svg';
  import moment from 'moment';
  import Login from './Login.svelte';

  const service = new ClickupService();

  let selectedLists: List[] = [];
  let selectedAssignees: User[] = [];
  let selectedView: any = {};
  let tasks: Task[] = [];
  let loading = false;
  let viewMode = true;
  let trackedToday = '0.0h';
  let showSaveOptions = false;
  let loggedIn = true;
  let initErrors = false;

  $: filteredTasks =
    viewMode && selectedAssignees.length
      ? tasks?.filter((t) =>
          selectedAssignees.reduce(
            (r, t2) => r || t.assignees.map((u) => u.id).includes(t2.id),
            false
          )
        )
      : tasks;

  onMount(() => {
    loadPage();
  });

  async function loadPage() {
    initErrors = false;
    const { data, ok } = await service.getUser();
    loggedIn = ok;
    user.set(data || {});
    const {
      data: { assignees, lists, view },
    } = await service.getConfig();
    selectedAssignees = assignees ?? [];
    selectedLists = lists ?? [];
    selectedView = view;
    if (view) {
      viewMode = true;
    }
    if (!loggedIn) {
      return;
    }
    if (selectedAssignees.length || selectedLists.length || view) {
      search();
    }
    if ($spacesTree.spaces.length > 0) {
      return;
    }

    service
      .getAllLists()
      .then((fullTree) => spacesTree.set(fullTree))
      .catch(() => (initErrors = true));

    if ($userList.users?.length === 0) {
      const { data, ok } = await service.getAllUsers();
      if (ok) {
        userList.set({ users: data });
      } else {
        initErrors = true;
      }
    }
  }

  async function search() {
    loading = true;
    if (viewMode) {
      if (!selectedView) {
        return;
      }
      const { data } = await service.getViewTasks(selectedView.id);
      tasks = data || [];
    } else {
      const params: any = {
        subtasks: true,
      };

      if (selectedLists.length > 0) {
        params.list_ids = selectedLists.map((l) => l.id);
      }

      if (selectedAssignees.length > 0) {
        params.assignees = selectedAssignees.map((u) => u.id);
      }
      const { data } = await service.findTasks(params);

      tasks = data || [];
    }

    loading = false;
    const res = await service.findTimeTrack({
      assignee: $user.id,
      start_date: moment().startOf('day').valueOf(),
      end_date: moment().endOf('day').valueOf(),
    });

    if (res.ok) {
      const millis = res.data.reduce((p, v) => p + parseInt(v.duration), 0);
      trackedToday = `${(millis / 3600000).toFixed(1)}h`;
    }
  }

  async function saveFilters(global: boolean = false) {
    const config: WorkspaceConfig = {
      assignees: selectedAssignees,
      lists: selectedLists,
      view: selectedView,
    };
    if (!viewMode) {
      config.view = undefined;
    }
    let res;
    try {
      res = await service.saveConfig(config, global);
    } catch (error) {
      res = {
        ok: false,
        error: error.message || 'generic_error',
      };
    }
    if (res.ok) {
      service.showToast('info', 'Configuration saved');
    }
  }

  function toggleView() {
    viewMode = !viewMode;
    tasks = [];
    if (
      (viewMode && selectedView) ||
      (!viewMode && (selectedAssignees.length || selectedLists.length))
    ) {
      search();
    }
  }

  function updateTask(event: CustomEvent<Task>) {
    const task = event.detail;
    tasks = tasks.map((t) => (t.id === task.id ? task : t));
  }

  function toggleSaveOptions() {
    showSaveOptions = !showSaveOptions;
  }

  function onLogin(event) {
    loadPage();
  }
</script>

<svelte:window on:click={() => (showSaveOptions = false)} />
<div>
  <div>
    <div
      class="flex flex-col-reverse lg:justify-between items-center lg:flex-row"
    >
      <div class="flex justify-start w-full">
        <div class="w-36 lg:w-72 flex-none">
          <AssigneesSelector bind:selectedAssignees />
        </div>
        <div class="w-36 lg:w-80 flex-none">
          <ListSelector
            bind:selectedLists
            bind:selectedView
            right
            {viewMode}
            on:selectView={search}
          />
        </div>
      </div>

      <div class="flex justify-end items-center w-full mb-2">
        <div class="flex w-6 items-center text-xs text-green-400">
          <ClockIcon class="w-3 mr-1 flex-none stroke-current" />
          <span>{trackedToday}</span>
        </div>
        <button
          class="w-9 px-2 text-xs flex-none ml-4 flex items-center"
          title={viewMode ? 'Switch to filter mode' : 'Switch to view mode'}
          on:click={toggleView}
        >
          {#if viewMode}
            <BoardIcon class="w-full" />
          {:else}
            <FilterIcon class="w-full" />
          {/if}
        </button>
        <button
          class="w-5 flex-none ml-4 flex items-center"
          title="Save filters"
          on:click={() => saveFilters(true)}
        >
          <SaveIcon />
        </button>
        <button
          class="w-4 flex-none ml-1 flex items-center relative"
          on:click|stopPropagation={() => toggleSaveOptions()}
        >
          <EllipsisIcon class="flex-none" />
          {#if showSaveOptions}
            <ul
              class="absolute w-24 h-12 top-full right-full bg-black rounded shadow overflow-hidden"
            >
              <button on:click={() => saveFilters(true)}>Global</button>
              <button on:click={() => saveFilters(false)}>Workspace</button>
            </ul>
          {/if}
        </button>
        <button
          class="w-9 px-2 flex-none ml-2 flex items-center"
          on:click={search}
        >
          <RefreshIcon class="w-full" title="Reload" />
        </button>
      </div>
    </div>
    {#if initErrors}
      <h1 class="text-red-600 text-lg">
        Connection error, try to reload the extension
      </h1>
    {/if}
    {#if loading}
      <div class="flex w-full justify-center">
        <Spinner class="w-8 animate-spin" />
      </div>
    {:else}
      <Kanban tasks={filteredTasks} on:refresh={updateTask} />
    {/if}
    {#if !loggedIn}
      <Login on:loggedIn={onLogin} />
    {/if}
  </div>
</div>

<style global>
  button {
    outline: none !important;
  }

  button:hover {
    background-color: #2e2e2e;
    color: white;
  }
</style>
