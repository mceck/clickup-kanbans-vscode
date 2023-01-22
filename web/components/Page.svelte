<script lang="ts">
  import { onMount } from 'svelte';

  import type { Interval, PageFilters, Task } from '../interfaces/clickup';
  import clickupService from '../services/clickup-service';
  import { user, userList } from '../store/users';
  import Board from './kanban/Board.svelte';
  import { spacesTree } from '../store/spaces-tree';
  import moment from 'moment';
  import Login from './Login.svelte';
  import Icon from './commons/Icon.svelte';
  import Filters from './filters/Filters.svelte';
  import Header from './Header.svelte';
  import Timesheet from './timesheet/Timesheet.svelte';

  export let mode: 'kanban' | 'timesheet' = 'kanban';

  let tasks: Task[] = [];
  let loading = false;
  let viewMode = false;
  let loggedIn = true;
  let initErrors = false;
  let configFilters: PageFilters[] = [];
  let term = '';
  let trackings: Interval[] = [];
  let trackedWeek: string = moment().format('YYYY-[W]WW');
  let cacheExpiration: number;

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
    allTracking: false,
  };

  $: prefilteredTask = tasks?.filter(
    (t) => !term || t.name.toLowerCase().includes(term.trim().toLowerCase())
  );

  $: filteredTasks = viewMode
    ? prefilteredTask?.filter((t) => {
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
    : prefilteredTask;

  onMount(() => {
    loadPage();
  });

  async function loadPage() {
    initErrors = false;
    const { data: usr, ok } = await clickupService.getUser();
    loggedIn = ok;
    user.set(usr || {});
    const { data } = await clickupService.getConfig(
      mode === 'timesheet' ? 'ts-config' : 'vs-config'
    );
    configFilters = data?.filters ?? [];
    const defFilters = configFilters.find((e) => e.default);
    filters = defFilters ? { ...filters, ...defFilters } : filters;
    if (defFilters?.selectedView) {
      viewMode = true;
    }
    if (!loggedIn) {
      return;
    }

    await loadCache();
    search(!tasks.length || mode === 'timesheet');

    if (cacheExpiration && cacheExpiration > moment().valueOf()) {
      return;
    }
    await loadStores();
  }

  async function loadStores() {
    spacesTree.set({ spaces: [] });
    userList.set({ users: [] });

    try {
      const [fullTree, usersResp] = await Promise.all([
        clickupService.getAllLists(),
        clickupService.getAllUsers(),
      ]);
      spacesTree.set(fullTree);

      const { data, ok } = usersResp;
      if (ok) {
        userList.set({ users: data });
      } else {
        throw new Error();
      }
      await updateSelectorsCache();
    } catch (error) {
      initErrors = true;
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

  async function loadCache() {
    const results = await Promise.all([
      mode === 'timesheet'
        ? Promise.resolve({ data: [] })
        : clickupService.getCache('tasks'),
      clickupService.getCache('spaces'),
      clickupService.getCache('users'),
      clickupService.getCache('expiration'),
    ]);

    const [t, s, u, c] = results.map((r) => r.data);
    tasks = t || [];
    if (s) {
      spacesTree.set(s);
    }
    if (u) {
      userList.set(u);
    }
    cacheExpiration = c;
  }

  async function updateTasksCache() {
    if (mode === 'timesheet') {
      return;
    }
    await clickupService.setCache('tasks', tasks);
  }

  async function updateSelectorsCache() {
    cacheExpiration = moment().add(1, 'hour').valueOf();
    await Promise.all([
      clickupService.setCache('spaces', $spacesTree),
      clickupService.setCache('users', $userList),
      clickupService.setCache('expiration', cacheExpiration),
    ]);
  }

  async function search(load = true) {
    if (viewMode) {
      if (!filters.selectedView) {
        return;
      }
      loading = load;
      const { data } = await clickupService.getViewTasks(
        filters.selectedView.id
      );
      tasks = data || [];
    } else {
      if (!hasFilters()) {
        return;
      }
      loading = load;
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
    await updateTasksCache();

    loading = false;
    refreshTimeTracked();
  }

  function updateTask(task: Task) {
    tasks = tasks.map((t) => {
      if (t.id === task.id) {
        if (t.time_spent !== task.time_spent) {
          refreshTimeTracked();
        }
        return task;
      }
      return t;
    });
  }

  async function refreshTimeTracked() {
    loading = mode === 'timesheet';
    let start = moment();
    let end = moment();
    if (mode === 'timesheet') {
      start = moment(trackedWeek).startOf('week');
      end = moment(trackedWeek).endOf('week');
    }
    const res = await clickupService.findTimeTrack({
      assignee: $user.id,
      start_date: start.startOf('day').valueOf() - 1,
      end_date: end.endOf('day').valueOf(),
    });

    if (res.ok) {
      trackings =
        res.data.map((v) => ({
          ...v,
          duration: parseInt(v.duration || 0),
        })) ?? [];
    }
    loading = false;
  }

  function onLogin() {
    loadPage();
  }

  async function deleteTrack(track: Interval) {
    const result = await clickupService.deleteTimeTracked(
      track.task.id,
      track.id
    );
    if (result.ok) {
      search(false);
      clickupService.showToast('info', 'Tracking deleted');
    }
  }

  async function updateTrack(interval: Interval, time: number) {
    if (!time) {
      return deleteTrack(interval);
    }
    const result = await clickupService.updateTimeTracked(
      interval.task.id,
      interval.id,
      {
        start: interval.start,
        end: +interval.start + time,
        time,
      }
    );
    if (result.ok) {
      search(false);
      clickupService.showStatusMessage('Time tracked');
    }
  }

  async function addTrack(task: Task, day: number, time: number) {
    if (!time) {
      return;
    }
    const absTime = Math.abs(time);
    const tracks = trackings.filter(
      (t) =>
        t.task.id === task.id &&
        moment(day).startOf('day').valueOf() ===
          moment(+t.start).startOf('day').valueOf()
    );
    tracks.reverse();
    const sum = tracks.reduce((acc, t) => acc + +t.duration, 0);
    if (time > 0) {
      // add new track
      await clickupService.createTimeTrack(task.id, {
        start: moment(day).startOf('day').valueOf(),
        time,
      });
    } else if (sum >= absTime) {
      // diff tracks
      let acc = 0;
      const toDelete = tracks.filter((t) => {
        const ret = acc < absTime;
        acc += +t.duration;
        return ret;
      });

      const toAdd = toDelete.reduce((acc, t) => acc + +t.duration, 0) - absTime;
      if (toAdd) {
        await clickupService.createTimeTrack(task.id, {
          start: moment(day).startOf('day').valueOf(),
          time: toAdd,
        });
      }

      for (let del of toDelete) {
        await clickupService.deleteTimeTracked(task.id, del.id);
      }
    } else {
      throw new Error("Can't update trackings");
    }
    updateTask({
      ...task,
      time_spent: +task.time_spent + time,
    });
    refreshTimeTracked();
  }

  function handleForceRefresh(e: KeyboardEvent) {
    if (e.ctrlKey && e.shiftKey && e.key === 'R') {
      search();
      loadStores();
    }
  }
</script>

<svelte:window on:keypress={handleForceRefresh} />
<div>
  <Header
    bind:filters
    bind:configFilters
    bind:viewMode
    {mode}
    {trackings}
    on:search={() => search()}
    on:updateTrack={({ detail }) => updateTrack(detail.track, detail.time)}
    on:deleteTrack={(e) => deleteTrack(e.detail)}
  />
  <Filters bind:filters bind:viewMode bind:term on:search={() => search()} />
  {#if initErrors}
    <h1 class="text-red-600 text-lg">
      Connection error, try to reload the extension
    </h1>
  {/if}
  {#if loading}
    <div class="flex w-full justify-center mt-4">
      <Icon name="cog" class="w-8 animate-spin" />
    </div>
  {:else if mode === 'kanban'}
    <Board tasks={filteredTasks} on:refresh={(e) => updateTask(e.detail)} />
  {:else if mode === 'timesheet'}
    <Timesheet
      bind:trackedWeek
      tasks={filteredTasks}
      {trackings}
      on:updateTrack={({ detail }) => updateTrack(detail.track, detail.time)}
      on:addTrack={({ detail }) =>
        addTrack(detail.task, detail.day, detail.time)}
      on:changeWeek={() => refreshTimeTracked()}
    />
  {/if}
  {#if !loggedIn}
    <Login on:loggedIn={onLogin} />
  {/if}
</div>
