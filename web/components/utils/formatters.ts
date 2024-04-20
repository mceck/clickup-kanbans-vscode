import moment from 'moment';

export function toDate(time: number, format) {
  return moment(+time).format(format);
}

export function toWeek(date: moment.Moment) {
  return moment(date).format('YYYY-[W]WW');
}

export function toTime(time: number) {
  return moment(+time).add(-1, 'hour').format('HH:mm');
}

export function toTimeInput(time: number) {
  if (+time === 0) {
    return '00h';
  }
  return moment(+time)
    .add(-1, 'hour')
    .format(+time >= 3600000 ? 'H[h] m[m]' : 'm[m]');
}

export function toHours(time, fixed = 1) {
  return `${(+time / 3600000).toFixed(fixed)}h`;
}
