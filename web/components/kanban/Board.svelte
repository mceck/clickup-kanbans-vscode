<script lang="ts">
  import type { Task } from '../../interfaces/clickup';
  import TaskCard from './components/TaskCard.svelte';

  import { spacesTree } from '../../store/spaces-tree';
  import StatusHeader from './components/StatusHeader.svelte';
  import { getAllStatusKeys, getAllStatuses } from './kanban-utils';

  export let tasks: Task[];
  let toggleStatus = {};

  $: statuses = getAllStatuses(tasks);

  $: statusKeys = getAllStatusKeys(tasks, $spacesTree.spaces);

  function getTasksByStatus(status: string) {
    return tasks.filter((t) => t.status.status === status);
  }

  function toggleStatusList(status) {
    toggleStatus[status] = !toggleStatus[status];
  }
</script>

<div class="sm:flex overflow-x-auto wsize">
  {#each statuses as [id, val] (id)}
    <div class="w-72 mx-2 my-4 flex-none">
      <StatusHeader
        color={val.color}
        status={val.status}
        tasksCount={getTasksByStatus(val.status).length}
        open={toggleStatus[id]}
        on:toggle={() => toggleStatusList(id)}
      />

      {#if !toggleStatus[id]}
        {#each getTasksByStatus(val.status) as task (task.id)}
          <TaskCard
            bind:task
            statusKeys={statusKeys[task.id] || []}
            on:updateTask
            on:addTrack
            on:changeTrack
            on:deleteTrack
            on:addTag
            on:deleteTag
          />
        {/each}
      {/if}
    </div>
  {/each}
</div>

<style>
  .wsize {
    width: 100%;
  }
  @media (min-width: 1024px) {
    .wsize {
      width: calc(100vw - var(--container-paddding) * 2);
    }
  }
</style>
