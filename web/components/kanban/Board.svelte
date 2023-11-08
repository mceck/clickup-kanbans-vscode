<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import type { Status, Task } from '../../interfaces/clickup';
  import TaskCard from './task/TaskCard.svelte';

  import { spacesTree } from '../../store/spaces-tree';
  import Icon from '../commons/Icon.svelte';

  export let tasks: Task[];
  const dispatch = createEventDispatcher();
  let toggleStatus = {};

  $: statuses = (
    Object.entries(
      tasks.reduce(
        (prev, val) => ({
          ...prev,
          [val.status.status]: {
            ...val.status,
            orderindex:
              prev[val.status.status]?.orderindex <= val.status.orderindex
                ? val.status.orderindex
                : prev[val.status.status]?.orderindex,
          },
        }),
        {}
      )
    ) as [string, Status][]
  ).sort(([_, a], [__, b]) => {
    if (a.orderindex === b.orderindex) return 0;
    return a.orderindex < b.orderindex ? -1 : 1;
  });

  $: lists = $spacesTree.spaces.reduce((acc, s) => {
    s.lists?.forEach((l) => {
      if (!acc.find((e) => e.id === l.id)) {
        acc.push(l);
      }
    });
    s.folders?.forEach((f) => {
      f.lists?.forEach((l) => {
        if (!acc.find((e) => e.id === l.id)) {
          acc.push(l);
        }
      });
    });
    return acc;
  }, []);

  $: folders = $spacesTree.spaces.reduce((acc, s) => {
    s.folders?.forEach((f) => {
      if (!acc.find((e) => e.id === f.id)) {
        acc.push(f);
      }
    });
    return acc;
  }, []);

  $: statusKeys = tasks.reduce((acc, t) => {
    return {
      ...acc,
      [t.id]: getStatusKeys(t),
    };
  }, {});

  function getStatusKeys(task: Task) {
    if (task.override_statuses) {
      return task.statuses?.map((s) => s.status);
    }
    const list = findList(task.list?.id);
    if (list?.override_statuses) {
      return list.statuses?.map((s) => s.status);
    }

    const folder = findFolder(task.folder?.id);
    if (folder?.override_statuses) {
      return folder.statuses?.map((s) => s.status);
    }
    return $spacesTree.spaces
      .find((s) => s.id === task.space?.id)
      ?.statuses.map((s) => s.status);
  }

  function getTasksByStatus(status: string) {
    return tasks.filter((t) => t.status.status === status);
  }

  function findList(listId) {
    return lists.find((e) => e.id === listId);
  }

  function findFolder(folderId) {
    return folders.find((e) => e.id === folderId);
  }

  function toggleStatusList(status) {
    toggleStatus[status] = !toggleStatus[status];
  }
</script>

<div class="sm:flex overflow-x-auto wsize">
  {#each statuses as [id, val] (id)}
    <div class="w-72 mx-2 my-4 flex-none">
      <div
        class="rounded-t-lg border uppercase text-lg px-2 py-1"
        style={`color: ${val.color}; border-color: ${val.color};`}
      >
        {val.status}
        {#if toggleStatus[id]}
          <span>({getTasksByStatus(val.status).length})</span>
        {/if}
        <button
          class="w-5 cursor-pointer float-right transform {toggleStatus[id] &&
            'rotate-180'}"
          on:click={() => toggleStatusList(id)}
        >
          <Icon name="chevron" />
        </button>
      </div>
      {#if !toggleStatus[id]}
        {#each getTasksByStatus(val.status) as task (task.id)}
          <TaskCard
            bind:task
            statusKeys={statusKeys[task.id] || []}
            on:updateTask={(e) => dispatch('updateTask', e.detail)}
            on:addTrack={(e) => dispatch('addTrack', e.detail)}
            on:changeTrack={(e) => dispatch('changeTrack', e.detail)}
            on:deleteTrack={(e) => dispatch('deleteTrack', e.detail)}
            on:addTag={(e) => dispatch('addTag', e.detail)}
            on:deleteTag={(e) => dispatch('deleteTag', e.detail)}
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
