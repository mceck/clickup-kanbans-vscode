import moment from 'moment';

export function toDate(time: number, format?: string) {
  return moment(+time).format(format);
}

export function toWeek(date: moment.Moment) {
  return moment(date).format('YYYY-[W]WW');
}

export function toTime(time: number) {
  return moment(+time).utc().format('HH:mm');
}

export function toTimeInput(time: number) {
  if (+time === 0) {
    return '00h';
  }
  return moment(+time)
    .utc()
    .format(+time >= 3600000 ? 'H[h] m[m]' : 'm[m]');
}

export function toHours(time: number, fixed = 1) {
  return `${(+time / 3600000).toFixed(fixed)}h`;
}
