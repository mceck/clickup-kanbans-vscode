<script lang="ts">
  import type { Comment, CommentDetail } from '../../interfaces/clickup';
  import Icon from '../commons/Icon.svelte';

  export let comment: Comment;
  let showPreviews = false;

  $: previews = comment.comment.filter((e) => isImage(e.attachment));

  function isLink(detail: CommentDetail) {
    return (
      ['frame', 'attachment'].includes(detail.type) || detail.attributes?.link
    );
  }

  function getLink(detail: CommentDetail) {
    if (detail.type === 'frame') {
      return detail.frame.url;
    } else if (detail.type === 'attachment') {
      return detail.attachment.url;
    }
    return detail.attributes?.link ?? '#';
  }

  function isImage(attachment?: any) {
    return ['image/svg+xml', 'image/png', 'image/jpg'].includes(
      attachment?.mimetype
    );
  }
</script>

<div {...$$props}>
  {#each comment.comment as detail}
    {#if isLink(detail)}
      <a class="link block" href={getLink(detail)}>{detail.text}</a>
    {:else if detail.type === 'tag'}
      <span class="link text-sm">{detail.text}</span>
    {:else}
      <span class="text-sm">{detail.text}</span>
    {/if}
  {/each}
  {#if previews.length}
    <div
      class="cursor-pointer text-sm w-full my-2 text-gray-500 flex items-center"
      on:click={() => (showPreviews = !showPreviews)}
    >
      <span>Attachments preview</span>
      <Icon class="w-4 ml-2 {showPreviews && 'rotate-180'}" name="chevron" />
    </div>
  {/if}
  {#if showPreviews}
    {#each previews as detail}
      <img
        class="min-w-6 max-w-full max-h-20 my-3 mr-3 inline"
        src={detail.attachment.url_w_query ?? detail.attachment.url}
        alt={detail.text}
      />
    {/each}
  {/if}
</div>
