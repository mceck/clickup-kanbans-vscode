<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { Status, Task } from "../interfaces/clickup";
  import TaskCard from "./TaskCard.svelte";

  export let tasks: Task[];
  const dispatch = createEventDispatcher();

  $: statuses = (
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

  $: statusKeys = statuses.map(([k, _]) => k);

  function getTasksByStatus(status: string) {
    return tasks.filter((t) => t.status.status === status);
  }
</script>

<div class="lg:flex w-full">
  {#each statuses as [id, val] (id)}
    <div class="w-72 mx-2 my-4 flex-none">
      <div
        class="rounded-t-lg border uppercase text-lg px-2 py-1"
        style={`color: ${val.color}; border-color: ${val.color};`}
      >
        {val.status}
      </div>
      {#each getTasksByStatus(val.status) as task (task.id)}
        <TaskCard
          bind:task
          {statusKeys}
          on:refresh={(e) => dispatch("refresh", e.detail)}
        />
      {/each}
    </div>
  {/each}
</div>

<style>
  small {
    @apply text-xs;
  }
</style>
