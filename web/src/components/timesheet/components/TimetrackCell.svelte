<script lang="ts">
  // import { createEventDispatcher } from 'svelte';
  import TimeTrackInput from '../../commons/TimeTrackInput.svelte';
  import { toTime, toTimeInput } from '../../utils/formatters';
  import { outsideClickable } from '../../utils/clickOutside';

  interface Props {
    totalForDay: number;
    onUpdateTrack?: (time: number) => void;
  }

  let { totalForDay, onUpdateTrack }: Props = $props();

  let edit: boolean = $state(false);
  let inputRef: HTMLInputElement = $state()!;

  // const dispatch = createEventDispatcher();

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
    onUpdateTrack?.(time);
  }
</script>

<p
  class="w-1/12 pr-4"
  use:outsideClickable
  onclickOutside={() => (edit = false)}
>
  {#if edit}
    <TimeTrackInput
      bind:timeTrackInput={inputRef}
      class="py-0!"
      timeTrackText={toTimeInput(totalForDay)}
      onSubmit={(time) => updateTrack(time)}
      onCancel={() => (edit = false)}
    />
  {:else}
    <span onclick={toggleEdit} class:text-neutral-600={totalForDay === 0}>
      {toTime(totalForDay)}
    </span>
  {/if}
</p>
