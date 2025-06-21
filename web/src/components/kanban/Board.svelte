<script lang="ts">
  import type { Task, Interval } from '../../interfaces/clickup';
  import TaskCard from './components/TaskCard.svelte';

  import StatusHeader from './components/StatusHeader.svelte';
  import { statuses, statusKeys } from '../../store/tasks';

  interface Props {
    tasks: Task[];
    onUpdateTask?: (detail: {
      id: string;
      assignees?: { add?: string[]; rem?: string[] };
      status?: string;
      refresh?: boolean;
    }) => void;
    onAddTrack?: (detail: { task: Task; time: number }) => void;
    onChangeTrack?: (detail: { track: Interval; time: number }) => void;
    onDeleteTrack?: (track: Interval) => void;
    onAddTag?: (detail: { taskId: string; tag: string }) => void;
    onDeleteTag?: (detail: { taskId: string; tag: string }) => void;
  }

  let {
    tasks,
    onUpdateTask,
    onAddTrack,
    onChangeTrack,
    onDeleteTrack,
    onAddTag,
    onDeleteTag,
  }: Props = $props();
  let toggleStatus: any = $state({
    complete: true,
  });

  function getTasksByStatus(status: string) {
    return tasks.filter((t) => t.status.status === status);
  }

  function toggleStatusList(status: any) {
    toggleStatus[status] = !toggleStatus[status];
  }
</script>

<div class="sm:flex overflow-x-auto wsize">
  {#each $statuses as [id, val] (id)}
    <div class="w-72 mx-2 my-4 flex-none">
      <StatusHeader
        color={val.color}
        status={val.status}
        tasksCount={getTasksByStatus(val.status).length}
        open={toggleStatus[id]}
        onToggleCallback={() => toggleStatusList(id)}
      />

      {#if !toggleStatus[id]}
        {#each getTasksByStatus(val.status) as task (task.id)}
          <TaskCard
            {task}
            statusKeys={$statusKeys[task.id] || []}
            {onUpdateTask}
            {onAddTrack}
            {onChangeTrack}
            {onDeleteTrack}
            {onAddTag}
            {onDeleteTag}
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
