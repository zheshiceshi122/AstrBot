<script setup lang="ts">
import { computed } from "vue";
import ProviderModelMenu from "@/components/chat/ProviderModelMenu.vue";
import { useChatHeaderStore } from "@/stores/chatHeader";

const chatHeader = useChatHeaderStore();
const title = computed(() => {
  const t = chatHeader.title.trim();
  const s = chatHeader.subtitle.trim();
  if (t && s) return `${s} / ${t}`;
  return t || s;
});
</script>

<template>
  <div class="chat-toolbar-context">
    <ProviderModelMenu variant="header" />
    <span v-if="title" class="chat-toolbar-context-title">{{ title }}</span>
  </div>
</template>

<style scoped>
.chat-toolbar-context {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

/* Slim the trigger down so the selector and title stack inside the 40px band. */
.chat-toolbar-context :deep(.provider-select-menu) {
  height: 20px;
  display: flex;
}

.chat-toolbar-context :deep(.provider-trigger--header) {
  height: 20px;
}

.chat-toolbar-context :deep(.provider-trigger--header .provider-trigger-title) {
  font-size: 0.8125rem;
  line-height: 20px;
}

.chat-toolbar-context :deep(.provider-trigger--header .provider-trigger-chevron) {
  font-size: 16px;
}

.chat-toolbar-context-title {
  max-width: 32vw;
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-size: 0.6875rem;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* On a phone the two stacked lines are too small to tap. The model selector
   takes the whole 40px toolbar band as its hit area and the conversation title
   is left to the chat list, where it already has room. */
@media (max-width: 600px) {
  .chat-toolbar-context {
    flex-direction: row;
    align-items: center;
  }

  .chat-toolbar-context :deep(.provider-select-menu),
  .chat-toolbar-context :deep(.provider-trigger--header) {
    height: 40px;
  }

  .chat-toolbar-context :deep(.provider-trigger--header) {
    padding: 0 10px;
    border-radius: 10px;
  }

  .chat-toolbar-context :deep(.provider-trigger--header .provider-trigger-title) {
    line-height: 1;
  }

  .chat-toolbar-context-title {
    display: none;
  }
}
</style>
