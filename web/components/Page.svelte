<script lang="ts">
  import { onMount } from 'svelte';

  import type { Interval, PageFilters, Task } from '../interfaces/clickup';
  import clickupService from '../services/clickup-service';
  import { user, userList } from '../store/users';
  import Board from './kanban/Board.svelte';
  import { spacesTree } from '../store/spaces-tree';
  import moment from 'moment';
  import Login from './Login.svelte';
  import Filters from './filters/Filters.svelte';
  import Header from './Header.svelte';
  import Timesheet from './timesheet/Timesheet.svelte';
  import { suspend } from '../store/suspender';

  export let mode: 'kanban' | 'timesheet' = 'kanban';

  let tasks: Task[] = [];
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
    (t) =>
      !term ||
      t.name.toLowerCase().includes(term.trim().toLowerCase()) ||
      t.list?.name?.toLowerCase().includes(term.trim().toLowerCase())
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
    await Promise.all([
      load ? suspend(refreshTasks()) : refreshTasks(),
      refreshTimeTracked(),
    ]);
  }

  async function refreshTasks() {
    if (viewMode) {
      if (!filters.selectedView) {
        return;
      }
      const { data } = await clickupService.getViewTasks(
        filters.selectedView.id
      );
      tasks = data || [];
    } else {
      if (!hasFilters()) {
        return;
      }
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
  }

  async function refreshTask(id: string) {
    const res = await suspend(clickupService.getTask(id));
    if (res.ok) {
      tasks = tasks.map((t) => (t.id === id ? res.data : t));
    }
  }

  async function updateTaskLocal(task: Task) {
    let refresh = false;
    tasks = tasks.map((t) => {
      if (t.id === task.id) {
        if (t.time_spent !== task.time_spent) {
          refresh = true;
        }
        return task;
      }
      return t;
    });
    if (refresh) {
      await refreshTimeTracked();
    }
  }

  async function updateTask(task: any) {
    const { id, refresh, ...params } = task;
    const res = await suspend(clickupService.updateTask(id, params));
    if (res.ok) {
      if (refresh) {
        search();
      } else {
        updateTaskLocal(res.data);
      }
    }
  }

  async function refreshTimeTracked() {
    let start = moment();
    let end = moment();
    if (mode === 'timesheet') {
      start = moment(trackedWeek).startOf('week');
      end = moment(trackedWeek).endOf('week');
    }
    let call = clickupService.findTimeTrack({
      assignee: $user.id,
      start_date: start.startOf('day').valueOf() - 1,
      end_date: end.endOf('day').valueOf(),
    });
    if (mode === 'timesheet') {
      call = suspend(call);
    }
    const res = await call;

    if (res.ok) {
      trackings =
        res.data.map((v) => ({
          ...v,
          duration: parseInt(v.duration || 0),
        })) ?? [];
    }
  }

  function onLogin() {
    loadPage();
  }

  async function deleteTrack(track: Interval) {
    const result = await suspend(
      clickupService.deleteTimeTracked(track.task.id, track.id)
    );
    if (result.ok) {
      refreshTask(track.task.id);
      refreshTimeTracked();
    }
  }

  async function updateTrack(interval: Interval, time: number) {
    if (!time) {
      return deleteTrack(interval);
    }
    const result = await suspend(
      clickupService.updateTimeTracked(interval.task.id, interval.id, {
        start: interval.start,
        end: +interval.start + time,
        time,
      })
    );
    if (result.ok) {
      refreshTask(interval.task.id);
      refreshTimeTracked();
    }
  }

  function addTrack(task: Task, day: number, time: number) {
    return suspend(
      (async () => {
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
            start: moment(day).startOf('day').valueOf() + 1000,
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

          const toAdd =
            toDelete.reduce((acc, t) => acc + +t.duration, 0) - absTime;
          if (toAdd) {
            const { ok, error } = await clickupService.createTimeTrack(
              task.id,
              {
                start: moment(day).startOf('day').valueOf() + 1000,
                time: toAdd,
              }
            );
            if (!ok) {
              throw new Error(error);
            }
          }

          for (let del of toDelete) {
            await clickupService.deleteTimeTracked(task.id, del.id);
          }
        } else {
          throw new Error("Can't update trackings");
        }
        // wait for clickup...
        await new Promise((r) => setTimeout(r, 300));
        refreshTask(task.id);
        refreshTimeTracked();
      })()
    );
  }

  function handleForceRefresh(e: KeyboardEvent) {
    if (e.ctrlKey && e.shiftKey && e.key === 'R') {
      search();
      loadStores();
      clickupService.setCache('starred', []);
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
  {#if mode === 'kanban'}
    <Board
      tasks={filteredTasks}
      on:updateTask={(e) => updateTask(e.detail)}
      on:addTrack={({ detail }) =>
        addTrack(detail.task, moment().valueOf(), detail.time)}
      on:deleteTrack={(e) => deleteTrack(e.detail)}
      on:changeTrack={({ detail }) => updateTrack(detail.track, detail.time)}
    />
  {:else if mode === 'timesheet'}
    <Timesheet
      bind:trackedWeek
      tasks={filteredTasks}
      {trackings}
      on:updateTrack={({ detail }) => updateTrack(detail.track, detail.time)}
      on:deleteTrack={(e) => deleteTrack(e.detail)}
      on:addTrack={({ detail }) =>
        addTrack(detail.task, detail.day, detail.time)}
      on:changeWeek={() => refreshTimeTracked()}
    />
  {/if}
  {#if !loggedIn}
    <Login on:loggedIn={onLogin} />
  {/if}
</div>
