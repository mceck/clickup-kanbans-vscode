<script lang="ts">
  import moment from "moment";
  import { createEventDispatcher, onMount } from "svelte";
  import type { Interval, Task } from "../../interfaces/clickup";
  import clickupService from "../../services/clickup-service";
  import EditTracking from "../commons/EditTracking.svelte";
  import Icon from "../commons/Icon.svelte";
  import Switch from "../commons/Switch.svelte";
  import TimeTrackInput from "../commons/TimeTrackInput.svelte";
  import { toHours, toTime, toTimeInput } from "../utils/formatters";

  export let tasks: Task[];
  export let trackings: Interval[];

  export let trackedWeek: string;

  let onlyFilteredTasks: boolean = false;

  let starred: string[] = [];
  let editing: { day: number; taskId: string } | null = null;

  let inputsRef: Record<string, HTMLInputElement> = {};

  let showTrackingsDetailForDay: boolean[] = new Array(5).fill(false);
  let filterMode: "task" | "usage" = "usage";

  const ferialDays = [0, 1, 2, 3, 4];

  const dispatch = createEventDispatcher();

  $: sortedTasks = [...tasks].sort((a, b) => {
    const inA = starred.includes(a.id),
      inB = starred.includes(b.id);
    if (inA !== inB) {
      return inB ? 1 : -1;
    }

    if (filterMode === "usage") {
      console.log(a, b);
      const aTot = totalForTask(trackings, a.id);
      const bTot = totalForTask(trackings, b.id);
      if (bTot && !aTot) {
        return 1;
      }
      if (aTot && !bTot) {
        return -1;
      }
    }
    return a.name.localeCompare(b.name);
  });

  onMount(async () => {
    let r = await clickupService.getCache("starred");
    starred = r?.data ?? [];
    r = await clickupService.getCache("onlyFilteredTasks");
    onlyFilteredTasks = !!r.data;
  });

  function tracksForTask(trackings: Interval[], taskId: string) {
    return trackings.filter((t) => {
      return t.task.id === taskId;
    });
  }

  function totalForTask(trackings: Interval[], taskId: string) {
    return tracksForTask(trackings, taskId).reduce(
      (acc, t) => acc + t.duration,
      0
    );
  }

  function tracksForTaskDay(
    trackings: Interval[],
    taskId: string,
    day: number
  ) {
    return trackings.filter((t) => {
      const d = moment(trackedWeek).add(day, "days");
      const start = d.startOf("day").valueOf();
      const end = d.endOf("day").valueOf();
      return t.task.id === taskId && t.start >= start && t.start <= end;
    });
  }

  function totalForTaskDay(trackings: Interval[], taskId: string, day: number) {
    const tracks = tracksForTaskDay(trackings, taskId, day);
    const duration = tracks.reduce((acc, t) => acc + t.duration, 0);
    return duration;
  }

  function trackingsForDay(trackings: Interval[], day: number) {
    return trackings.filter((t) => {
      const d = moment(trackedWeek).add(day, "days");
      const start = d.startOf("day").valueOf();
      const end = d.endOf("day").valueOf();
      return (
        t.start >= start &&
        t.start <= end &&
        (!onlyFilteredTasks || tasks.map((e) => e.id).includes(t.task.id))
      );
    });
  }
  function totalForDay(trackings: Interval[], day: number, _?: boolean) {
    return trackingsForDay(trackings, day).reduce(
      (acc, t) => acc + t.duration,
      0
    );
  }

  function updateTrack(task: Task, day: number, newTime: number) {
    const time = newTime - totalForTaskDay(trackings, task.id, day);
    const date = moment(trackedWeek).add(day, "days").startOf("day").valueOf();
    dispatch("addTrack", { task, time, day: date });
    editing = null;
  }

  function changeWeek() {
    dispatch("changeWeek");
  }

  function showTrackingsForDay(day: number = -1) {
    showTrackingsDetailForDay = showTrackingsDetailForDay.map((v, i) =>
      i === day ? !(onlyFilteredTasks || v) : false
    );
  }

  async function star(taskId: string) {
    if (starred.includes(taskId)) {
      starred = starred.filter((t) => t !== taskId);
    } else {
      starred = [...starred, taskId];
    }
    await clickupService.setCache("starred", starred);
  }

  function isEditing(taskId: string, day: number) {
    return editing?.taskId === taskId && editing?.day === day;
  }

  function toggleEdit(taskId: string, day: number) {
    editing = { taskId, day };
    setTimeout(() => {
      inputsRef[`${taskId}_${day}`]?.focus();
      inputsRef[`${taskId}_${day}`]?.select();
    }, 0);
  }

  function goWeek(add: number) {
    trackedWeek = moment(trackedWeek)
      .add(7 * add, "days")
      .format("YYYY-[W]WW");
    changeWeek();
  }

  function editTrack(track: Interval, time: number) {
    dispatch("updateTrack", { track, time });
    showTrackingsForDay();
  }

  function deleteTrack(interval: Interval) {
    dispatch("deleteTrack", interval);
    showTrackingsForDay();
  }

  function updateOnlyFiltered(value: boolean) {
    onlyFilteredTasks = value;
    clickupService.setCache("onlyFilteredTasks", value);
  }

  function toggleFilterMode() {
    filterMode = filterMode === "task" ? "usage" : "task";
  }
</script>

<svelte:window on:click={() => (editing = null) || showTrackingsForDay()} />
<div class="timesheet">
  <div
    class="fixed top-28 left-0 w-full z-10 bg-screen px-5 pt-4"
    on:click|stopPropagation
  >
    <div class="flex items-center mt-2 mb-4">
      <p>Week:</p>
      <span class="cursor-pointer" on:click={() => goWeek(-1)}
        ><Icon name="chevron" class="w-6 rotate-90 ml-2" /></span
      >
      <div class="mx-2 w-56">
        <input type="week" bind:value={trackedWeek} on:change={changeWeek} />
      </div>
      <span class="cursor-pointer" on:click={() => goWeek(1)}
        ><Icon name="chevron" class="w-6 -rotate-90" /></span
      >
    </div>

    <div class="flex flex-wrap w-full">
      <div class="flex w-full items-center mb-3 text-lg font-bold">
        <p class="w-1/12"><Icon class="w-6" name="star" /></p>
        <p class="w-6/12 cursor-pointer" on:click={toggleFilterMode}>
          Task
          <span class="text-gray-500 text-sm font-normal italic ml-4"
            >{filterMode === "usage" ? "by usage" : ""}</span
          >
          <span class="font-normal text-sm italic float-right pt-1 mr-8"
            >{moment(trackedWeek).format("DD/MM/yyyy")} - {moment(trackedWeek)
              .add(4, "days")
              .format("DD/MM/yyyy")}</span
          >
        </p>
        {#each ferialDays as day}
          <p class="w-1/12">
            {moment(trackedWeek).add(day, "days").format("ddd")}
          </p>
        {/each}
      </div>
      <div class="flex w-full items-center pb-3 border-b-4 border-neutral-800">
        <p class="w-1/12" />
        <p class="w-6/12">
          <span
            class="mr-8 float-right"
            title="Show total tracked time only for filtered tasks"
          >
            <span class="mr-2 text-neutral-400">Totals filtered: </span>
            <Switch
              value={onlyFilteredTasks}
              on:change={(e) => updateOnlyFiltered(e.detail)}
            />
          </span>
        </p>
        {#each ferialDays as day}
          <p
            class="w-1/12 relative {totalForDay(
              trackings,
              day,
              onlyFilteredTasks
            ) >=
            3600000 * 8
              ? 'text-green-500'
              : 'text-red-400'} {!onlyFilteredTasks && 'cursor-pointer'}"
            on:click|stopPropagation={() => showTrackingsForDay(day)}
          >
            {toHours(totalForDay(trackings, day, onlyFilteredTasks))}
            {#if showTrackingsDetailForDay[day]}
              <EditTracking
                class="w-track right-1/2 max-h-56 text-white"
                showTask={true}
                intervals={trackingsForDay(trackings, day)}
                on:update={({ detail }) => editTrack(detail.track, detail.time)}
                on:delete={({ detail }) => deleteTrack(detail)}
              />
            {/if}
          </p>
        {/each}
      </div>
    </div>
  </div>
  <div class="h-28" />
  <div>
    {#each sortedTasks as task (task.id)}
      <div class="flex w-full items-center py-4 border-b border-neutral-800">
        <p class="w-1/12" on:click={() => star(task.id)}>
          <Icon
            name={starred.includes(task.id) ? "star" : "star-empty"}
            class="w-6"
          />
        </p>
        <a class="w-6/12" href={task.url}>{task.name}</a>
        {#each ferialDays as day}
          <p class="w-1/12 pr-4" on:click|stopPropagation>
            {#if editing && isEditing(task.id, day)}
              <TimeTrackInput
                bind:timeTrackInput={inputsRef[`${task.id}_${day}`]}
                class="nopady"
                timeTrackText={toTimeInput(
                  totalForTaskDay(trackings, task.id, day)
                )}
                on:submit={({ detail: time }) => updateTrack(task, day, time)}
                on:cancel={() => (editing = null)}
              />
            {:else}
              <span
                on:click|stopPropagation={() => toggleEdit(task.id, day)}
                class:text-neutral-600={totalForTaskDay(
                  trackings,
                  task.id,
                  day
                ) === 0}
              >
                {toTime(totalForTaskDay(trackings, task.id, day))}
              </span>
            {/if}
          </p>
        {/each}
      </div>
    {/each}
  </div>
</div>

<style global>
  .timesheet .w-track {
    width: 450px;
  }
</style>
