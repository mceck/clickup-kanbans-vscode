/* eslint-disable @typescript-eslint/naming-convention */
import { writable, get } from 'svelte/store';
import moment from 'moment';
import type { Interval, Task } from '../interfaces/clickup';
import clickupService from '../services/clickup-service';
import { suspend } from '../store/suspender';
import { user } from './auth';
import { mode } from './filters';
import { refreshSingleTask } from './tasks';
import { toWeek } from '../components/utils/formatters';

export const trackings = writable<Interval[]>([]);
export const trackedWeek = writable<string>(toWeek(moment()));

export const refreshTimeTracked = async () => {
  const $user = get(user);
  const $mode = get(mode);
  const $trackedWeek = get(trackedWeek);

  let start = moment();
  let end = moment();
  if ($mode === 'timesheet') {
    start = moment($trackedWeek).startOf('week');
    end = moment($trackedWeek).endOf('week');
  }

  let call = clickupService.findTimeTrack({
    assignee: $user!.id,
    start_date: start.startOf('day').valueOf() - 1,
    end_date: end.endOf('day').valueOf(),
  });

  if ($mode === 'timesheet') {
    call = suspend(call);
  }
  const res = await call;

  if (res.ok) {
    trackings.set(
      res.data.map((v: any) => ({
        ...v,
        duration: parseInt(v.duration || 0),
      })) ?? []
    );
  }
};

export const deleteTrack = async (track: Interval) => {
  const result = await suspend(
    clickupService.deleteTimeTracked(track.task.id, track.id)
  );
  if (result.ok) {
    refreshSingleTask(track.task.id);
    refreshTimeTracked();
  }
};

export const updateTrack = async (interval: Interval, time: number) => {
  if (!time) {
    return deleteTrack(interval);
  }
  const result = await suspend(
    clickupService.updateTimeTracked(interval.task.id, interval.id, {
      start: interval.start,
      end: +interval.start + time,
      time,
    })
  );
  if (result.ok) {
    refreshSingleTask(interval.task.id);
    refreshTimeTracked();
  }
};

export const addTrack = (task: Task, day: number, time: number) => {
  return suspend(
    (async () => {
      if (!time) {
        return;
      }
      const absTime = Math.abs(time);
      const tracks = get(trackings).filter(
        (t) =>
          t.task.id === task.id &&
          moment(day).startOf('day').valueOf() ===
            moment(+t.start).startOf('day').valueOf()
      );
      tracks.reverse();
      const sum = tracks.reduce((acc, t) => acc + +t.duration, 0);
      if (time > 0) {
        // add new track
        await clickupService.createTimeTrack(task.id, {
          start: moment(day).startOf('day').add(9, 'hours').valueOf(),
          time,
        });
      } else if (sum >= absTime) {
        // diff tracks
        let acc = 0;
        const toDelete = tracks.filter((t) => {
          const ret = acc < absTime;
          acc += +t.duration;
          return ret;
        });

        const toAdd =
          toDelete.reduce((acc, t) => acc + +t.duration, 0) - absTime;
        if (toAdd) {
          const { ok, error } = await clickupService.createTimeTrack(task.id, {
            start: moment(day).startOf('day').add(9, 'hours').valueOf(),
            time: toAdd,
          });
          if (!ok) {
            throw new Error(error);
          }
        }

        for (let del of toDelete) {
          await clickupService.deleteTimeTracked(task.id, del.id);
        }
      } else {
        throw new Error("Can't update trackings");
      }
      // wait for clickup...
      await new Promise((r) => setTimeout(r, 300));
      refreshSingleTask(task.id);
      refreshTimeTracked();
    })()
  );
};
