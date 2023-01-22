<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Task } from '../../../interfaces/clickup';

  import Icon from '../../commons/Icon.svelte';

  export let task: Task;
  export let statuses: string[];
  export let expanded: boolean;

  const dispatch = createEventDispatcher();

  function shiftState(n: number) {
    const idx = statuses.findIndex((s) => task.status.status === s) + n;
    return statuses[idx];
  }

  async function actionNext() {
    const nextStatus = shiftState(1);
    dispatch('next', nextStatus);
  }

  async function actionPrev() {
    const nextStatus = shiftState(-1);
    dispatch('prev', nextStatus);
  }

  function gitCheckout() {
    dispatch('checkout');
  }

  function actionExpand() {
    dispatch('expand', !expanded);
  }
</script>

<div class="relative">
  <div class="grid grid-cols-5 rounded overflow-hidden">
    <button class="flex justify-center items-center" on:click={actionPrev}
      ><Icon class="h-6" name="left" /></button
    >
    <button
      class="flex justify-center items-center"
      on:click|stopPropagation={gitCheckout}
      ><Icon class="h-6" name="git" /></button
    >
    <button class="flex justify-center items-center" on:click={actionExpand}
      ><Icon class="h-6" name={expanded ? 'collapse' : 'expand'} /></button
    >
    <a href={task.url}
      ><button class="flex justify-center items-center"
        ><Icon class="h-6" name="clickup" /></button
      ></a
    >
    <button class="flex justify-center items-center" on:click={actionNext}
      ><Icon class="h-6 rotate-180 transform" name="left" /></button
    >
  </div>
</div>
