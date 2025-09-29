import type {
  Folder,
  List,
  Space,
  Status,
  Task,
} from '../../interfaces/clickup';

export function getAllStatuses(tasks: Task[]) {
  return Object.entries(
    tasks.reduce(
      (prev: any, val) => ({
        ...prev,
        [val.status.status]: {
          ...val.status,
          orderindex:
            prev[val.status.status]?.orderindex <= val.status.orderindex!
              ? val.status.orderindex
              : prev[val.status.status]?.orderindex,
        },
      }),
      {}
    )
  ) as [string, Status][];
}

export function getAllStatusKeys(
  tasks: Task[],
  spaces: Space[]
): Record<string, string[]> {
  return tasks.reduce((acc, t) => {
    return {
      ...acc,
      [t.id]: getStatusKeys(t, spaces),
    };
  }, {});
}

function getAllFolders(spaces: Space[]) {
  return spaces.reduce((acc: Folder[], s) => {
    s.folders?.forEach((f) => {
      if (!acc.find((e) => e.id === f.id)) {
        acc.push(f);
      }
    });
    return acc;
  }, []);
}

function getAllLists(spaces: Space[]) {
  return spaces.reduce((acc: List[], s) => {
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
}

function getStatusKeys(task: Task, spaces: Space[]) {
  if (task.override_statuses) {
    return task.statuses?.map((s) => s.status);
  }
  const list = findList(spaces, task.list?.id);
  if (list?.override_statuses) {
    return list.statuses?.map((s) => s.status);
  }

  const folder = findFolder(spaces, task.folder?.id);
  if (folder?.override_statuses) {
    return folder.statuses?.map((s) => s.status);
  }
  return spaces
    .find((s) => s.id === task.space?.id)
    ?.statuses.map((s) => s.status);
}

function findList(spaces: Space[], listId?: string) {
  return getAllLists(spaces).find((e) => e.id === listId);
}

function findFolder(spaces: Space[], folderId?: string) {
  return getAllFolders(spaces).find((e) => e.id === folderId);
}
