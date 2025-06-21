<script lang="ts">
  import type { Interval, Task, User } from '../../interfaces/clickup';
  import { statuses, statusKeys } from '../../store/tasks';
  import TaskDetail from '../kanban/components/TaskDetail.svelte';
  import StatusRow from './components/StatusRow.svelte';
  import TaskRow from './components/TaskRow.svelte';

  interface Props {
    tasks?: Task[];
    onUpdateTask?: (detail: {
      id: string;
      assignees?: { add?: string[]; rem?: string[] };
      status?: string;
      refresh?: boolean;
    }) => void;
    onAddTag?: (detail: { taskId: string; tag: string }) => void;
    onDeleteTag?: (detail: { taskId: string; tag: string }) => void;
  }

  let { tasks = [], onUpdateTask, onAddTag, onDeleteTag }: Props = $props();

  let toggleStatus: any = $state({
    complete: true,
  });

  let openedTask: Task | null = $state(null);

  function getTasksByStatus(status: string) {
    return tasks.filter((t) => t.status.status === status);
  }

  function toggleStatusList(status: any) {
    toggleStatus[status] = !toggleStatus[status];
  }
</script>

<div class="w-full">
  {#each $statuses as [id, val] (id)}
    <div class="w-full px-2 py-4">
      <StatusRow
        color={val.color}
        status={val.status}
        tasksCount={getTasksByStatus(val.status).length}
        open={toggleStatus[id]}
        onToggleCallback={() => toggleStatusList(id)}
      />

      {#if !toggleStatus[id]}
        {#each getTasksByStatus(val.status) as task (task.id)}
          <TaskRow
            {task}
            {onUpdateTask}
            {onAddTag}
            {onDeleteTag}
            onSelect={(task) => {
              openedTask = task;
            }}
          />
        {/each}
      {/if}
    </div>
  {/each}
  {#if openedTask}
    <div
      class="fixed inset-0 bg-[rgba(0,0,0,0.3)] z-50 flex items-center justify-center"
      onclick={() => (openedTask = null)}
    >
      <div
        class="p-4 bg-screen rounded-lg shadow-lg w-11/12 max-w-3xl max-h-[80vh] overflow-y-auto"
        onclick={(e) => e.stopPropagation()}
      >
        <h2 class="text-xl font-bold mb-4">
          {openedTask.name}
        </h2>
        <TaskDetail task={openedTask} />
      </div>
    </div>
  {/if}
</div>
