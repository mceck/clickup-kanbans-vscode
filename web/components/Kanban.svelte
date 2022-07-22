<script lang="ts">
  import type { Status, Task, TimeTrack } from '../interfaces/clickup';
  import ClickupService from '../services/clickup-service';

  export let tasks: Task[];

  let timetrackers: { [s: string]: TimeTrack[] } = {};

  $: status = Object.entries(
    tasks.reduce(
      (prev, val) => ({ ...prev, [val.status.status]: val.status }),
      {}
    )
  ) as [string, Status][];

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

<div>
  {#each status as [id, val] (id)}
    <div>
      <div
        class="rounded-lg border uppercase text-lg px-2 py-1"
        style={`color: ${val.color}; border-color: ${val.color};`}
      >
        {val.status}
      </div>
      {#each getTasksByStatus(val.status) as task (task.id)}
        <div
          class="p-4 border border-gray-600 rounded-lg h-36 overflow-auto"
          on:click={() => showTimetrack(task.id)}
        >
          <div>
            name: {task.name}
          </div>
          <div>
            estimated: {task.time_estimate / 3600000}h
          </div>
          {#if timetrackers[task.id]}
            <div>
              {#each timetrackers[task.id] as tt, i (i)}
                <div>tracked {tt.time / 3600000}h</div>
              {/each}
            </div>
          {/if}
          {#if task.description}
            <div
              class="whitespace-nowrap overflow-hidden overflow-ellipsis"
              title={task.description}
            >
              {task.description}
            </div>
          {/if}
          <a href={task.url} target="_blank"> Link </a>
        </div>
      {/each}
    </div>
  {/each}
</div>
