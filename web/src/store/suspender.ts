import { writable, type Writable } from 'svelte/store';

export const loading: Writable<boolean> = writable<boolean>(false);

let count = 0;

export const suspend = <T>(call: Promise<T>): Promise<T> => {
  count++;
  loading.set(true);
  return call
    .then((r) => {
      count--;
      if (count <= 0) {
        setTimeout(() => {
          if (count <= 0) {
            loading.set(false);
            if (count < 0) {
              count = 0;
            }
          }
        }, 50);
      }
      return r;
    })
    .catch((err) => {
      count--;
      if (count <= 0) {
        loading.set(false);
        if (count < 0) {
          count = 0;
        }
      }
      throw err;
    });
};
