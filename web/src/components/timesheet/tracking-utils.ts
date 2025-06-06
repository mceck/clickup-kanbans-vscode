import moment from 'moment';
import type { Interval, Task } from '../../../interfaces/clickup';

export function tracksForTask(trackings: Interval[], taskId: string) {
  return trackings.filter((t) => {
    return t.task.id === taskId;
  });
}

export function totalForTask(trackings: Interval[], taskId: string) {
  return tracksForTask(trackings, taskId).reduce(
    (acc, t) => acc + t.duration,
    0
  );
}

export function tracksForTaskDay(
  trackings: Interval[],
  taskId: string,
  day: number,
  trackedWeek: string
) {
  return trackings.filter((t) => {
    const d = moment(trackedWeek).add(day, 'days');
    const start = d.startOf('day').valueOf();
    const end = d.endOf('day').valueOf();
    return t.task.id === taskId && t.start >= start && t.start <= end;
  });
}

export function totalForTaskDay(
  trackings: Interval[],
  taskId: string,
  day: number,
  trackedWeek: string
) {
  const tracks = tracksForTaskDay(trackings, taskId, day, trackedWeek);
  const duration = tracks.reduce((acc, t) => acc + t.duration, 0);
  return duration;
}

export function sortTasks(
  tasks: Task[],
  starred: string[],
  trackings: Interval[],
  filterMode: 'task' | 'usage'
) {
  return [...tasks].sort((a, b) => {
    const inA = starred.includes(a.id),
      inB = starred.includes(b.id);
    if (inA !== inB) {
      return inB ? 1 : -1;
    }

    if (filterMode === 'usage') {
      const aTot = totalForTask(trackings, a.id);
      const bTot = totalForTask(trackings, b.id);
      if (bTot && !aTot) {
        return 1;
      }
      if (aTot && !bTot) {
        return -1;
      }
    }
    return a.name.localeCompare(b.name);
  });
}

export const FERIAL_DAYS = [0, 1, 2, 3, 4];
