<script lang="ts">
  import moment from 'moment';
  import { createEventDispatcher } from 'svelte';
  import Icon from '../../commons/Icon.svelte';

  export let trackedWeek: string;

  const dispatch = createEventDispatcher();

  function goWeek(add: number) {
    trackedWeek = moment(trackedWeek)
      .add(7 * add, 'days')
      .format('YYYY-[W]WW');
    changeWeek();
  }

  const changeWeek = (e?: any) => {
    dispatch('changeWeek', e?.target?.value);
  };
</script>

<div class="flex items-center mt-2 mb-4">
  <p>Week:</p>
  <span class="cursor-pointer" on:click={() => goWeek(-1)}
    ><Icon name="chevron" class="w-6 rotate-90 ml-2" /></span
  >
  <div class="mx-2 w-56">
    <input type="week" bind:value={trackedWeek} on:change={changeWeek} />
  </div>
  <span class="cursor-pointer" on:click={() => goWeek(1)}
    ><Icon name="chevron" class="w-6 -rotate-90" /></span
  >
</div>
