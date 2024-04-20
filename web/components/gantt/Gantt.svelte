<script lang="ts">
  import { onMount } from 'svelte';
  import type { Task, User } from '../../interfaces/clickup';
  import moment from 'moment';
  import AssigneeBadge from '../commons/assignees-selector/AssigneeBadge.svelte';
  import { toWeek } from '../utils/formatters';

  export let tasks: Task[] = [];
  export let users: User[] = [];
  export let timeSpan: number = 24 * 60 * 60 * 1000;
  export let startDate: Date = moment()
    .startOf('day')
    .subtract(1, 'week')
    .toDate();
  export let endDate: Date = moment().startOf('day').add(1, 'week').toDate();

  let timeSlots: { start: number; end: number }[] = [];
  let period = 4;

  $: filteredTasks = tasks
    .map((t) => ({
      ...t,
      start_date: t.start_date && new Date(parseInt(t.start_date.toString())),
      due_date: t.due_date && new Date(parseInt(t.due_date.toString())),
    }))
    .filter(
      (t) =>
        t.start_date &&
        t.due_date &&
        t.assignees.length > 0 &&
        ((moment(t.start_date).isAfter(startDate) &&
          moment(t.start_date).isBefore(endDate)) ||
          (moment(t.due_date).isBefore(endDate) &&
            moment(t.due_date).isAfter(startDate)))
    )
    .map((t) => {
      if (moment(t.start_date).isBefore(startDate)) {
        t.start_date = startDate;
      }
      if (t.due_date > endDate) {
        t.due_date = endDate;
      }
      return { ...t };
    });

  $: filteredUsers = users.filter((u) =>
    filteredTasks.some((t) => t.assignees.map((e) => e.id).includes(u.id))
  );

  onMount(() => {
    calcTimeslots();
  });

  function formatSlot(slot: { start: number; end: number }) {
    let start = moment(slot.start);
    // let end = moment(slot.end);
    return start.format('DD/MM');
  }

  function userTasks(user: User) {
    return filteredTasks.filter((t) =>
      t.assignees.map((e) => e.id).includes(user.id)
    );
  }

  function taskStyle(task: any) {
    let start = moment(task.start_date);
    let end = moment(task.due_date);
    let duration = end.diff(start);
    if (end.isBefore(endDate)) {
      duration += timeSpan;
    }
    let left = start.diff(moment(startDate));
    const totalSpan = moment(endDate).diff(moment(startDate));
    return `
        top: 4px; 
        bottom: 4px;
        border-radius: 4px;
        left: ${(left * 100) / totalSpan}%;
        width: calc(${(duration * 100) / totalSpan}% - 1px);
        background-color: ${task.status.color};
        `;
  }

  function headerStyle() {
    return `
            flex: 1;
            overflow: hidden;
            `;
  }

  function calcTimeslots() {
    timeSlots = [];
    for (
      let start = startDate.getTime();
      start < endDate.getTime();
      start += timeSpan
    ) {
      timeSlots.push({
        start: start,
        end: start + timeSpan,
      });
    }
  }

  let debounceStop = 0;

  function onScroll(e: any) {
    if (debounceStop) {
      return;
    }
    const delta = e.deltaX;
    if (delta > 7) {
      startDate = moment(startDate).add(1, 'day').toDate();
      endDate = moment(endDate).add(1, 'day').toDate();
      calcTimeslots();
      debounceStop = 1;
      setTimeout(() => {
        debounceStop = 0;
      }, 100);
    } else if (delta < -7) {
      startDate = moment(startDate).subtract(1, 'day').toDate();
      endDate = moment(endDate).subtract(1, 'day').toDate();
      calcTimeslots();
      debounceStop = 1;
      setTimeout(() => {
        debounceStop = 0;
      }, 50);
    }
  }

  function onWeekChange(e: any) {
    const week = e.target.value;
    startDate = moment(week)
      .subtract(Math.floor(period / 2.0), 'week')
      .toDate();
    endDate = moment(week)
      .add(Math.ceil(period / 2.0), 'week')
      .toDate();
    calcTimeslots();
  }

  function onPeriodChange(e: any) {
    const oldPeriod = period;
    period = parseInt(e.target.value);
    const delta = period - oldPeriod;
    if (delta > 0) {
      endDate = moment(endDate).add(delta, 'week').toDate();
    } else if (delta < 0) {
      startDate = moment(startDate).subtract(delta, 'week').toDate();
    }
    calcTimeslots();
  }
</script>

<div class="w-full min-h" on:wheel={onScroll}>
  <div class="flex justify-between pb-2">
    <div class="w-52">
      <input
        type="week"
        class="w-20"
        on:change={onWeekChange}
        value={toWeek(moment(startDate).add(Math.floor(period / 2), 'week'))}
      />
    </div>
    <select
      class="w-20 bg-screen text-white"
      on:change={onPeriodChange}
      value={period.toString()}
    >
      <option value="1">1 week</option>
      <option value="2">2 week</option>
      <option value="3">3 week</option>
      <option value="4">4 week</option>
    </select>
  </div>
  <div class="flex items-center w-full border-b border-gray-500">
    <div class="w-10 flex-none p-1" />
    <div class="flex w-fill">
      {#each timeSlots as ts}
        <div style={headerStyle()}>{formatSlot(ts)}</div>
      {/each}
    </div>
  </div>
  {#each filteredUsers as user}
    <div class="flex items-center border-b border-gray-500">
      <div class="w-10 h-10 flex-none p-1" title={user.username}>
        <AssigneeBadge {user} />
      </div>
      <div class="flex relative h-12 w-fill">
        {#each userTasks(user) as task}
          <a
            href={task.url}
            class="absolute flex items-center justify-center text-white hover:text-gray-100"
            style={taskStyle(task)}
          >
            {task.name}
          </a>
        {/each}
      </div>
    </div>
  {/each}
</div>

<style scoped>
  .w-fill {
    width: calc(100% - 2rem);
  }

  .min-h {
    min-height: 60vh;
  }
</style>
