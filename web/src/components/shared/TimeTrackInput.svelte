<script lang="ts">
  
  import { t } from '../../store/i18n';

  interface Props {
    timeTrackText?: string;
    timeTrackInput?: HTMLInputElement;
    class?: string;
    onCancel?: () => void;
    onInput?: (millis: number) => void;
    onSubmit?: (millis: number) => void;
  }

  let {
    timeTrackText = $bindable(''),
    timeTrackInput = $bindable(),
    class: className = '',
    onCancel: propsOnCancel,
    onInput: propsOnInput,
    onSubmit: propsOnSubmit,
  }: Props = $props();
  const regex = /((\d?\d(.\d)?)\s?(h))|((\d?\d)\s?(m))/gi;

  function handleInputs(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      propsOnCancel?.();
      return;
    }
    const match = timeTrackText.match(regex)?.filter((m: any) => m.trim());
    if (!match) {
      const t = timeTrackText.replace(',', '.');
      if (t.match(/^[\d.]+$/) && e.key === 'Enter') {
        const millis = parseFloat(t) * 3600000;
        propsOnSubmit?.(millis);
      }
      return;
    }
    let hours = 0;
    let mins = 0;
    for (let a of match) {
      for (let m of a.split(' ')) {
        if (m.match(/h$/i)) {
          hours += parseFloat(m);
        }
        if (m.match(/m$/i)) {
          mins += parseInt(m);
        }
      }
    }
    if (hours >= 24 || mins >= 60) {
      return;
    }
    const millis = mins * 60000 + hours * 3600000;
    propsOnInput?.(millis);
    if (e.key === 'Enter') {
      propsOnSubmit?.(millis);
    }
  }
</script>

<input
  class={className}
  placeholder={$t('global.time-track-info')}
  bind:value={timeTrackText}
  bind:this={timeTrackInput}
  onkeyup={handleInputs}
/>
