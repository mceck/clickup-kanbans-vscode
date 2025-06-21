/* eslint-disable curly */
import { writable, derived, get } from 'svelte/store';
import type { Task } from '../interfaces/clickup';
import clickupService from '../services/clickup-service';
import { activeFilters, hasFilters, viewMode, term, mode } from './filters';
import { suspend } from '../store/suspender';
import {
  getAllStatuses,
  getAllStatusKeys,
} from '../components/kanban/kanban-utils';
import { spacesTree } from './workspace';

export const tasks = writable<Task[]>([]);

const prefilteredTasks = derived([tasks, term], ([$tasks, $term]) => {
  if (!$term) return $tasks;
  const lowerCaseTerm = $term.trim().toLowerCase();
  return $tasks.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerCaseTerm) ||
      t.list?.name?.toLowerCase().includes(lowerCaseTerm)
  );
});

export const filteredTasks = derived(
  [prefilteredTasks, activeFilters, viewMode],
  ([$prefilteredTasks, $filters, $viewMode]) => {
    if (!$viewMode) {
      return $prefilteredTasks;
    }
    return $prefilteredTasks?.filter((t) => {
      let valid = true;
      if ($filters.selectedAssignees.length) {
        valid = !!$filters.selectedAssignees.find((t2) =>
          t.assignees.map((u) => u.id).includes(t2.id)
        );
      }

      if (valid && $filters.tags.length) {
        valid = $filters.tags.every((tag) =>
          t.tags.map((e) => e.name).includes(tag)
        );
      }

      if (valid && $filters.statuses.length) {
        valid = $filters.statuses.some(
          (status) => t.status.status.toLowerCase() === status.toLowerCase()
        );
      }

      if (valid && $filters.due_date_gt) {
        valid = new Date(t.due_date) >= new Date($filters.due_date_gt);
      }

      if (valid && $filters.due_date_lt) {
        valid = new Date(t.due_date) < new Date($filters.due_date_lt);
      }

      return valid;
    });
  }
);

export const statuses = derived([tasks], ([$tasks]) => getAllStatuses($tasks));

export const statusKeys = derived(
  [tasks, spacesTree],
  ([$tasks, $spacesTree]) => getAllStatusKeys($tasks, $spacesTree.spaces)
);

export const loadTasksFromCache = async () => {
  if (get(mode) === 'timesheet') return;
  const { data } = await clickupService.getCache('tasks');
  if (data) tasks.set(data);
};

const updateTasksCache = async () => {
  if (get(mode) === 'timesheet') return;
  await clickupService.setCache(
    'tasks',
    JSON.parse(JSON.stringify(get(tasks)))
  );
};

export const refreshTasks = async () => {
  const $viewMode = get(viewMode);
  const $filters = get(activeFilters);
  const $hasFilters = get(hasFilters);

  let newTasks: Task[] = [];
  if ($viewMode) {
    if (!$filters.selectedView) return;
    const { data } = await clickupService.getViewTasks(
      $filters.selectedView.id
    );
    newTasks = data || [];
  } else {
    if (!$hasFilters) {
      return;
    }
    const params: any = {
      subtasks: !!$filters.subtasks,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      include_closed: !!$filters.include_closed,
    };

    if ($filters.selectedLists.length > 0) {
      params.list_ids = $filters.selectedLists.map((l) => l.id);
    }

    if ($filters.selectedAssignees.length > 0) {
      params.assignees = $filters.selectedAssignees.map((u) => u.id);
    }

    if ($filters.tags.length > 0) {
      params.tags = JSON.parse(JSON.stringify($filters.tags));
    }

    if ($filters.statuses.length > 0) {
      params.statuses = $filters.statuses;
    }

    if ($filters.due_date_gt) {
      params.due_date_gt = new Date($filters.due_date_gt).getTime();
    }

    if ($filters.due_date_lt) {
      params.due_date_lt = new Date($filters.due_date_lt).getTime();
    }

    const { data } = await clickupService.findTasks(params);
    newTasks = data || [];
  }
  tasks.set(newTasks);
  await updateTasksCache();
};

export const refreshSingleTask = async (id: string) => {
  const res = await suspend(clickupService.getTask(id));
  if (res.ok) {
    tasks.update((tasks) => tasks.map((t) => (t.id === id ? res.data : t)));
  }
};

export const updateTask = async (taskUpdate: any) => {
  const { id, refresh, ...params } = taskUpdate;
  const res = await suspend(clickupService.updateTask(id, params));
  if (res.ok) {
    if (refresh) {
      await refreshTasks();
    } else {
      tasks.update((tasks) => tasks.map((t) => (t.id === id ? res.data : t)));
    }
  }
};

export const addTaskTag = async ({
  taskId,
  tag,
}: {
  taskId: string;
  tag: string;
}) => {
  try {
    await clickupService.addTagToTask(taskId, tag);
    refreshSingleTask(taskId);
  } catch (error: any) {
    clickupService.showToast('error', error.message);
  }
};

export const deleteTaskTag = async ({
  taskId,
  tag,
}: {
  taskId: string;
  tag: string;
}) => {
  try {
    await clickupService.deleteTagFromTask(taskId, tag);
    refreshSingleTask(taskId);
  } catch (error: any) {
    clickupService.showToast('error', error.message);
  }
};
