<script lang="ts">
  import type { Status, Task, TimeTrack } from "../interfaces/clickup";
  import ClickupService from "../services/clickup-service";

  export let tasks: Task[];

  let timetrackers: { [s: string]: TimeTrack[] } = {};

  $: status = (
    Object.entries(
      tasks.reduce(
        (prev, val) => ({ ...prev, [val.status.status]: val.status }),
        {}
      )
    ) as [string, Status][]
  ).sort(([_, a], [__, b]) => {
    if (a.orderindex === b.orderindex) return 0;
    return a.orderindex < b.orderindex ? -1 : 1;
  });

  function getTasksByStatus(status: string) {
    return tasks.filter((t) => t.status.status === status);
  }

  async function showTimetrack(taskId) {
    if (!timetrackers[taskId]) {
      const { data } = await new ClickupService().getTimeTracked(taskId);
      timetrackers = {
        ...timetrackers,
        [taskId]: data,
      };
    }
  }
</script>

<div class="lg:flex w-full">
  {#each status as [id, val] (id)}
    <div class="w-72 mx-2 my-4 flex-none">
      <div
        class="rounded-lg border uppercase text-lg px-2 py-1"
        style={`color: ${val.color}; border-color: ${val.color};`}
      >
        {val.status}
      </div>
      {#each getTasksByStatus(val.status) as task (task.id)}
        <div
          class="p-4 border border-gray-600 rounded-lg h-36 relative flex flex-col justify-around"
        >
          <h3>
            {task.name}
          </h3>
          <small
            class="cursor-pointer absolute left-1 top-1"
            on:click={() => showTimetrack(task.id)}
          >
            est: {(task.time_estimate / 3600000).toFixed(0)}h
          </small>
          <a
            class="absolute right-1 top-1 text-xs"
            href={task.url}
            target="_blank"
          >
            Link
          </a>
          {#if timetrackers[task.id]}
            <small class="absolute left-16 top-1"
              >tracked {(timetrackers[task.id][0].time / 3600000).toFixed(
                1
              )}h</small
            >
          {/if}
          {#if task.description}
            <small
              class="whitespace-nowrap overflow-hidden overflow-ellipsis"
              title={task.description}
            >
              {task.description}
            </small>
          {/if}
        </div>
      {/each}
    </div>
  {/each}
</div>

<style>
  h3 {
    @apply text-lg;
  }

  small {
    @apply text-xs text-gray-400;
  }

  p {
  }
</style>
