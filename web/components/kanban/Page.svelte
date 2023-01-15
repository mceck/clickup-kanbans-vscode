<script lang="ts">
  import { onMount } from 'svelte';

  import type {
    PageFilters,
    Task,
    WorkspaceConfig,
  } from '../../interfaces/clickup';
  import clickupService from '../../services/clickup-service';
  import { user, userList } from '../../store/users';
  import Board from './Board.svelte';
  import AssigneesSelector from '../commons/assignees-selector/AssigneesSelector.svelte';
  import ListSelector from '../commons/list-selector/ListSelector.svelte';
  import { spacesTree } from '../../store/spaces-tree';
  import moment from 'moment';
  import Login from './Login.svelte';
  import Icon from '../commons/Icon.svelte';
  import AdditionalFilters from './AdditionalFilters.svelte';

  let tasks: Task[] = [];
  let loading = false;
  let viewMode = false;
  let trackedToday = '0.0h';
  let showSaveOptions = false;
  let loggedIn = true;
  let initErrors = false;
  let configFilters: PageFilters[] = [];
  let showConfigurations = false;

  let filters: PageFilters = {
    name: '',
    default: true,
    selectedLists: [],
    selectedAssignees: [],
    selectedView: null,
    tags: [],
    statuses: [],
    due_date_gt: undefined,
    due_date_lt: undefined,
    subtasks: true,
    include_closed: false,
  };

  $: filteredTasks = viewMode
    ? tasks?.filter((t) => {
        let valid = true;
        if (filters.selectedAssignees.length) {
          valid = !!filters.selectedAssignees.find((t2) =>
            t.assignees.map((u) => u.id).includes(t2.id)
          );
        }

        if (valid && filters.tags.length) {
          valid = filters.tags.every((tag) =>
            t.tags.map((e) => e.name).includes(tag)
          );
        }

        if (valid && filters.statuses.length) {
          valid = filters.statuses.some(
            (status) => t.status.status.toLowerCase() === status.toLowerCase()
          );
        }

        if (valid && filters.due_date_gt) {
          valid = new Date(t.due_date) >= new Date(filters.due_date_gt);
        }

        if (valid && filters.due_date_lt) {
          valid = new Date(t.due_date) < new Date(filters.due_date_lt);
        }

        return valid;
      })
    : tasks;

  onMount(() => {
    loadPage();
  });

  async function loadPage() {
    initErrors = false;
    const { data, ok } = await clickupService.getUser();
    loggedIn = ok;
    user.set(data || {});
    const {
      data: { filters: _filters },
    } = await clickupService.getConfig();
    configFilters = _filters ?? [];
    const defFilters = configFilters.find((e) => e.default);
    filters = defFilters ? { ...filters, ...defFilters } : filters;
    if (defFilters?.selectedView) {
      viewMode = true;
    }
    if (!loggedIn) {
      return;
    }
    search();
    if ($spacesTree.spaces.length > 0) {
      return;
    }

    clickupService
      .getAllLists()
      .then((fullTree) => spacesTree.set(fullTree))
      .catch(() => (initErrors = true));

    if ($userList.users?.length === 0) {
      const { data, ok } = await clickupService.getAllUsers();
      if (ok) {
        userList.set({ users: data });
      } else {
        initErrors = true;
      }
    }
  }

  function hasFilters() {
    return (
      filters.selectedAssignees.length ||
      filters.selectedLists.length ||
      filters.tags.length ||
      filters.due_date_gt ||
      filters.due_date_lt
    );
  }

  async function search() {
    if (viewMode) {
      if (!filters.selectedView) {
        return;
      }
      loading = true;
      const { data } = await clickupService.getViewTasks(
        filters.selectedView.id
      );
      tasks = data || [];
    } else {
      if (!hasFilters()) {
        return;
      }
      loading = true;
      const params: any = {
        subtasks: !!filters.subtasks,
        include_closed: !!filters.include_closed,
      };

      if (filters.selectedLists.length > 0) {
        params.list_ids = filters.selectedLists.map((l) => l.id);
      }

      if (filters.selectedAssignees.length > 0) {
        params.assignees = filters.selectedAssignees.map((u) => u.id);
      }

      if (filters.tags.length > 0) {
        params.tags = filters.tags;
      }

      if (filters.statuses.length > 0) {
        params.statuses = filters.statuses;
      }

      if (filters.due_date_gt) {
        params.due_date_gt = new Date(filters.due_date_gt).getTime();
      }

      if (filters.due_date_lt) {
        params.due_date_lt = new Date(filters.due_date_lt).getTime();
      }

      const { data } = await clickupService.findTasks(params);

      tasks = data || [];
    }

    loading = false;
    const res = await clickupService.findTimeTrack({
      assignee: $user.id,
      start_date: moment().startOf('day').valueOf(),
      end_date: moment().endOf('day').valueOf(),
    });

    if (res.ok) {
      const millis = res.data.reduce((p, v) => p + parseInt(v.duration), 0);
      trackedToday = `${(millis / 3600000).toFixed(1)}h`;
    }
  }

  function selectFilter(f: PageFilters) {
    filters = f ?? filters;
    viewMode = !!filters.selectedView;
    search();
    showConfigurations = false;
  }

  async function defaultFilter(f: PageFilters) {
    configFilters = configFilters.map((e) => ({ ...e, default: e === f }));
    await clickupService.saveConfig({ filters: configFilters });
    showConfigurations = false;
  }

  function deleteFilter(f: PageFilters) {
    configFilters = configFilters.filter((e) => e !== f);
    filters = configFilters.find((e) => e.default);
    if (!filters) {
      filters = configFilters[0] ?? { ...f, name: '' };
      filters.default = true;
    }
    clickupService.saveConfig({ filters: configFilters });
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
      filterToSave.name = data;
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
      const res = await clickupService.saveConfig(config);
      if (res.ok) {
        filters = filterToSave;
        configFilters = config.filters;
        clickupService.showToast('info', 'Configuration saved');
      }
    } else {
      const idx = configFilters.findIndex((e) => e.name === filters.name);
      if (idx >= 0) {
        configFilters[idx] = { ...filters };
        const res = await clickupService.saveConfig({ filters: configFilters });
        if (res.ok) {
          clickupService.showToast('info', 'Configuration saved');
        }
      }
    }
  }

  function toggleView() {
    viewMode = !viewMode;
    tasks = [];
    search();
  }

  function updateTask(event: CustomEvent<Task>) {
    const task = event.detail;
    tasks = tasks.map((t) => (t.id === task.id ? task : t));
  }

  function toggleSaveOptions() {
    showSaveOptions = !showSaveOptions;
  }

  function onLogin() {
    loadPage();
  }
</script>

<svelte:window
  on:click={() => (showSaveOptions = showConfigurations = false)}
/>
<div>
  <div>
    <div
      class="flex flex-col-reverse lg:justify-between items-center lg:flex-row"
    >
      <div class="flex justify-start w-full">
        <div class="w-36 lg:w-72 flex-none">
          <AssigneesSelector
            bind:selectedAssignees={filters.selectedAssignees}
            on:add={() => viewMode || search()}
            on:remove={() => viewMode || search()}
          />
        </div>
        <div class="w-36 lg:w-80 flex-none">
          <ListSelector
            bind:selectedLists={filters.selectedLists}
            bind:selectedView={filters.selectedView}
            right
            {viewMode}
            on:selectView={search}
            on:selectList={search}
            on:removeList={search}
          />
        </div>
      </div>
      <div class="flex justify-between w-full">
        <div>
          <small
            class="cursor-pointer"
            on:click|stopPropagation={() =>
              (showConfigurations = !showConfigurations)}>{filters.name}</small
          >
          {#if showConfigurations}
            <div
              class="absolute p-2 bg-screen border rounded border-gray-600 z-10"
              on:click|stopPropagation
            >
              {#each configFilters as f}
                <div class="flex items-center py-1">
                  <span
                    class="w-24 cursor-pointer"
                    on:click={() => selectFilter(f)}>{f.name}</span
                  >
                  <span
                    class="h-4 cursor-pointer {f.default && 'text-green-500'}"
                    on:click={() => defaultFilter(f)}
                    ><Icon name="check" /></span
                  >
                  <span
                    class="h-4 cursor-pointer"
                    on:click={() => deleteFilter(f)}><Icon name="trash" /></span
                  >
                </div>
              {/each}
            </div>
          {/if}
        </div>
        <div class="flex justify-end items-center w-full mb-2">
          <div class="flex w-6 items-center text-xs text-green-400">
            <Icon name="clock" class="w-3 mr-1 flex-none stroke-current" />
            <span>{trackedToday}</span>
          </div>
          <button
            class="w-9 px-2 text-xs flex-none ml-4 flex items-center"
            title={viewMode ? 'Switch to filter mode' : 'Switch to view mode'}
            on:click={toggleView}
          >
            {#if viewMode}
              <Icon name="board" class="w-full" />
            {:else}
              <Icon name="filter" class="w-full" />
            {/if}
          </button>
          <button
            class="w-5 flex-none ml-4 flex items-center"
            title="Save filters"
            on:click={() => saveFilters()}
          >
            <Icon name="save" />
          </button>
          <button
            class="w-4 flex-none ml-1 flex items-center relative"
            on:click|stopPropagation={() => toggleSaveOptions()}
          >
            <Icon name="ellipsis" class="flex-none" />
            {#if showSaveOptions}
              <ul
                class="absolute p-2 w-24 top-full right-full bg-screen rounded-lg border border-gray-600 shadow overflow-hidden"
              >
                <button on:click={() => saveFilters(true)}>Save as...</button>
              </ul>
            {/if}
          </button>
          <button
            class="w-9 px-2 flex-none ml-2 flex items-center"
            on:click={search}
          >
            <Icon name="refresh" class="w-full" title="Reload" />
          </button>
        </div>
      </div>
    </div>
    <AdditionalFilters
      {viewMode}
      bind:filters
      on:change={() => viewMode || search()}
    />
    {#if initErrors}
      <h1 class="text-red-600 text-lg">
        Connection error, try to reload the extension
      </h1>
    {/if}
    {#if loading}
      <div class="flex w-full justify-center">
        <Icon name="cog" class="w-8 animate-spin" />
      </div>
    {:else}
      <Board tasks={filteredTasks} on:refresh={updateTask} />
    {/if}
    {#if !loggedIn}
      <Login on:loggedIn={onLogin} />
    {/if}
  </div>
</div>
