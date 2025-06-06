<script lang="ts">
  import { onMount } from 'svelte';

  import type {
    Interval,
    PageFilters,
    Space,
    Task,
    WorkspaceConfig,
  } from '../interfaces/clickup';
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
  import Gantt from './gantt/Gantt.svelte';
  import { toWeek } from './utils/formatters';
  import { dateFormat, locale, t } from '../store/i18n';

  interface Props {
    mode?: 'kanban' | 'timesheet';
  }

  let { mode = 'kanban' }: Props = $props();

  let tasks: Task[] = $state([]);
  let viewMode = $state(false);
  let ganttMode = $state(false);
  let loggedIn = $state(true);
  let initErrors = $state(false);
  let configFilters: PageFilters[] = $state([]);
  let term = $state('');
  let trackings: Interval[] = $state([]);
  let trackedWeek: string = $state(toWeek(moment()));
  let cacheExpiration: number;

  let filters: PageFilters = $state({
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
  });

  let prefilteredTask = $derived(
    tasks?.filter(
      (t) =>
        !term ||
        t.name.toLowerCase().includes(term.trim().toLowerCase()) ||
        t.list?.name?.toLowerCase().includes(term.trim().toLowerCase())
    )
  );

  let filteredTasks = $derived(
    viewMode
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
      : prefilteredTask
  );

  onMount(() => {
    loadLocalization();
    loadPage();
  });

  async function loadLocalization() {
    const { data: loc } = await clickupService.getConfig('locale');
    const { data: dateFmt } = await clickupService.getConfig('dateFormat');
    if (loc) {
      locale.set(loc);
    }
    if (dateFmt) {
      dateFormat.set(dateFmt);
    }
  }

  async function loadPage() {
    initErrors = false;
    const { data: usr, ok } = await clickupService.getUser();
    loggedIn = ok;
    user.set(usr || {});
    const { data } = await clickupService.getConfig(
      mode === 'timesheet' ? 'ts-config' : 'vs-config'
    );
    configFilters = data?.filters ?? [];
    ganttMode = data?.ganttMode ?? false;
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
      await updateFollowedViews();
    } catch (error) {
      console.error(error);
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
    await clickupService.setCache('tasks', JSON.parse(JSON.stringify(tasks)));
  }

  async function updateSelectorsCache() {
    cacheExpiration = moment().add(1, 'hour').valueOf();
    await Promise.all([
      clickupService.setCache('spaces', $spacesTree),
      clickupService.setCache('users', $userList),
      clickupService.setCache('expiration', cacheExpiration),
    ]);
  }

  async function updateFollowedViews() {
    const followed = configFilters.filter((f) => f.follow);
    for (let follow of followed) {
      const newList = getLastFollowed(follow, $spacesTree.spaces);
      if (newList) {
        const { data } = await clickupService.getListViews(newList.id);
        if (data.length && data[0]?.id !== follow.selectedView?.id) {
          data[0].list = newList;
          const redoSearch =
            filters.selectedView?.id === follow.selectedView?.id;
          filters.selectedView = data[0];
          follow.selectedView = data[0];
          if (redoSearch) {
            search();
          }
          saveFilters(follow);
        }
      }
    }
  }

  function getLastFollowed(filter: PageFilters, spaces: Space[]) {
    const space = spaces.find(
      (s) => s.id === filter.selectedView.list.space.id
    );
    if (!space) {
      return null;
    }
    for (let folder of space.folders) {
      if (folder.lists.find((l) => l.id === filter.selectedView.list.id)) {
        const follow = [...folder.lists]
          .sort((a, b) => a.name.localeCompare(b.name))
          .reverse()
          .find((l) => l.name.startsWith(filter.follow));
        if (follow && follow.id !== filter.selectedView.list.id) {
          return follow;
        }
      }
    }
    if (space.lists?.find((l) => l.id === filter.selectedView.list.id)) {
      const follow = [...space.lists]
        .sort((a, b) => a.name.localeCompare(b.name))
        .reverse()
        .find((l) => l.name.startsWith(filter.follow));
      if (follow) {
        return follow;
      }
    }
    return null;
  }

  let configName = $derived(mode === 'timesheet' ? 'ts-config' : 'vs-config');

  async function saveFilters(filters: PageFilters, isNew: boolean = false) {
    if (!filters.name) {
      isNew = true;
    }
    if (isNew) {
      const filterToSave = { ...filters, default: true };
      const { data } = await clickupService.showInput({
        placeHolder: $t('global.configuration-name'),
        prompt: $t('global.choose-name'),
        value: '',
      });
      filterToSave.name = data.trim();
      if (!filterToSave.name || configFilters.find((f) => f.name === data)) {
        clickupService.showToast('error', $t('global.invalid-name'));
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
        ganttMode,
      };
      const res = await clickupService.saveConfig(config, configName);
      if (res.ok) {
        filters = filterToSave;
        configFilters = config.filters;
        clickupService.showToast('info', $t('global.configuration-saved'));
      }
    } else {
      const idx = configFilters.findIndex((e) => e.name === filters.name);
      if (idx >= 0) {
        configFilters[idx] = { ...filters };
        const res = await clickupService.saveConfig(
          { filters: configFilters, ganttMode },
          configName
        );
        if (res.ok) {
          clickupService.showToast('info', $t('global.configuration-saved'));
        }
      }
    }
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
        params.tags = JSON.parse(JSON.stringify(filters.tags));
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
            start: moment(day).startOf('day').add(9, 'hours').valueOf(),
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
                start: moment(day).startOf('day').add(9, 'hours').valueOf(),
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

  async function addTaskTag({ taskId, tag }) {
    try {
      await clickupService.addTagToTask(taskId, tag);
      refreshTask(taskId);
    } catch (error) {
      clickupService.showToast('error', error.message);
    }
  }

  async function deleteTaskTag({ taskId, tag }) {
    try {
      await clickupService.deleteTagFromTask(taskId, tag);
      refreshTask(taskId);
    } catch (error) {
      clickupService.showToast('error', error.message);
    }
  }
</script>

<svelte:window onkeypress={handleForceRefresh} />
<div>
  <div class="fixed top-0 left-0 w-full bg-screen z-20 px-4 pt-1">
    <Header
      bind:filters
      bind:configFilters
      bind:viewMode
      bind:ganttMode
      {mode}
      {trackings}
      on:search={() => search()}
      on:updateTrack={({ detail }) => updateTrack(detail.track, detail.time)}
      on:deleteTrack={(e) => deleteTrack(e.detail)}
      on:saveFilters={({ detail }) => saveFilters(filters, detail)}
    />
    <Filters bind:filters bind:term {viewMode} on:search={() => search()} />
  </div>
  <div class="h-40"></div>
  {#if initErrors}
    <h1 class="text-red-600 text-lg">
      Connection error, try to reload the extension
    </h1>
  {/if}
  {#if mode === 'kanban'}
    {#if ganttMode}
      <Gantt tasks={filteredTasks} users={$userList.users} />
    {:else}
      <Board
        tasks={filteredTasks}
        on:updateTask={(e) => updateTask(e.detail)}
        on:addTrack={({ detail }) =>
          addTrack(detail.task, moment().valueOf(), detail.time)}
        on:deleteTrack={(e) => deleteTrack(e.detail)}
        on:changeTrack={({ detail }) => updateTrack(detail.track, detail.time)}
        on:addTag={({ detail }) => addTaskTag(detail)}
        on:deleteTag={({ detail }) => deleteTaskTag(detail)}
      />
    {/if}
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
