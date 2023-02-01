<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Task } from '../../../interfaces/clickup';
  import clickupService from '../../../services/clickup-service';

  import Icon from '../../commons/Icon.svelte';

  export let task: Task;
  export let statuses: string[];
  export let expanded: boolean;

  const dispatch = createEventDispatcher();
  $: currentStatusIdx = statuses.findIndex((s) => task.status.status === s);
  $: canPrev = currentStatusIdx > 0;
  $: canNext = currentStatusIdx < statuses.length - 1 && currentStatusIdx >= 0;

  function shiftState(n: number) {
    const idx = currentStatusIdx + n;
    if (!statuses[idx]) {
      clickupService.showToast(
        'error',
        'Cannot calculate next status, try to refresh the page'
      );
    }
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
    <button
      class="flex justify-center items-center"
      title="Previous status"
      disabled={!canPrev}
      on:click={actionPrev}><Icon class="h-6" name="left" /></button
    >
    <button
      class="flex justify-center items-center"
      title="Checkout or create branch for this task in working directory"
      on:click|stopPropagation={gitCheckout}
      ><Icon class="h-6" name="git" /></button
    >
    <button
      class="flex justify-center items-center"
      title="Expand"
      on:click={actionExpand}
      ><Icon class="h-6" name={expanded ? 'collapse' : 'expand'} /></button
    >
    <a href={task.url}
      ><button class="flex justify-center items-center" title="Go to Clickup"
        ><Icon class="h-6" name="clickup" /></button
      ></a
    >
    <button
      class="flex justify-center items-center"
      title="Next status"
      disabled={!canNext}
      on:click={actionNext}
      ><Icon class="h-6 rotate-180 transform" name="left" /></button
    >
  </div>
</div>
