<script>
  import Suspender from '../components/commons/Suspender.svelte';
  import Page from '../components/Page.svelte';

  let mode = __vs_svelte_view || 'kanban';
</script>

<Suspender>
  <Page {mode} />
</Suspender>
