<script>
  import TailwindWrapper from '../../components/commons/TailwindWrapper.svelte';
  import Page from '../../components/Page.svelte';

  let mode = __vs_svelte_view || 'kanban';
</script>

<TailwindWrapper>
  <Page {mode} />
</TailwindWrapper>
