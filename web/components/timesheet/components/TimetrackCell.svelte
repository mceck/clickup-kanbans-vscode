<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import TimeTrackInput from '../../commons/TimeTrackInput.svelte';
  import { toTime, toTimeInput } from '../../utils/formatters';
  import { outsideClickable } from '../../utils/clickOutside';

  export let totalForDay: number;

  let edit: boolean = false;
  let inputRef: HTMLInputElement;

  const dispatch = createEventDispatcher();

  function toggleEdit() {
    edit = !edit;
    if (edit) {
      setTimeout(() => {
        inputRef.focus();
        inputRef.select();
      }, 0);
    }
  }

  function updateTrack(time: number) {
    edit = false;
    dispatch('updateTrack', time);
  }
</script>

<p
  class="w-1/12 pr-4"
  use:outsideClickable
  on:clickOutside={() => (edit = false)}
>
  {#if edit}
    <TimeTrackInput
      bind:timeTrackInput={inputRef}
      class="!py-0"
      timeTrackText={toTimeInput(totalForDay)}
      on:submit={({ detail: time }) => updateTrack(time)}
      on:cancel={() => (edit = false)}
    />
  {:else}
    <span on:click={toggleEdit} class:text-neutral-600={totalForDay === 0}>
      {toTime(totalForDay)}
    </span>
  {/if}
</p>
