<script lang="ts">
  import { createEventDispatcher } from "svelte";

  import type { Status, Task } from "../interfaces/clickup";
  import ActionBar from "./ActionBar.svelte";
  import AssigneesSelector from "./AssigneesSelector/AssigneesSelector.svelte";

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
        <div
          class="px-2 pt-6 border border-gray-600 hover:border-gray-500 rounded-lg my-1 relative"
        >
          <div class="h-20 flex flex-col">
            <div class="absolute top-1 right-1">
              <AssigneesSelector
                bind:selectedAssignees={task.assignees}
                editable={false}
                maxShown={4}
                small
              />
            </div>

            <p>
              {task.name}
            </p>
            {#if task.time_estimate}
              <small class="absolute left-2 top-1 text-gray-400">
                est: {(task.time_estimate / 3600000).toFixed(0)}h
              </small>
            {/if}
            {#if task.time_spent}
              <small class="absolute text-green-600 left-16 top-1">
                tracked: {(task.time_spent / 3600000).toFixed(1)}h
              </small>
            {/if}
            {#if task.description}
              <small
                class="whitespace-nowrap text-gray-400 overflow-hidden overflow-ellipsis"
                title={task.description}
              >
                {task.description}
              </small>
            {/if}
          </div>
          <div class="w-full px-2 pb-2 rounded shadow">
            <ActionBar
              {task}
              statuses={statusKeys}
              on:refresh={(e) => dispatch("refresh", e.detail)}
            />
          </div>
        </div>
      {/each}
    </div>
  {/each}
</div>

<style>
  small {
    @apply text-xs;
  }
</style>
