<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { ChevronLeft } from '@lucide/vue';
import { useHeaderContextStore } from '@/stores/headerContext';
import { useI18n } from '@/i18n/composables';

const header = useHeaderContextStore();
const { t } = useI18n();
const menuTarget = ref<HTMLElement | null>(null);
onMounted(() => { header.mobileActionsTarget = menuTarget.value; });
onBeforeUnmount(() => {
  if (header.mobileActionsTarget === menuTarget.value) header.mobileActionsTarget = null;
});
</script>

<template>
  <div class="page-toolbar" :class="{ 'page-toolbar--compact': header.compactMobile, 'page-toolbar--described': !!$slots.description }">
    <v-btn v-if="header.compactMobile && header.backLink" :to="header.backLink.to" icon variant="text"
      class="page-toolbar__back" :aria-label="t(`core.navigation.${header.backLink.key}`)" :title="t(`core.navigation.${header.backLink.key}`)">
      <ChevronLeft :size="18" aria-hidden="true" />
    </v-btn>
    <div class="page-toolbar__content"><slot /></div>
    <div v-if="$slots.actions" class="page-toolbar__actions"><slot name="actions" /></div>
    <div v-show="header.compactMobile" ref="menuTarget" class="page-toolbar__menu" />
    <div v-if="$slots.description" class="page-toolbar__description"><slot name="description" /></div>
  </div>
</template>

<style scoped>
.page-toolbar { display: flex; align-items: center; gap: 8px; min-width: 0; }
.page-toolbar--described { flex-wrap: wrap; }
.page-toolbar__description { flex: 1 0 100%; min-width: 0; }
.page-toolbar__content { display: flex; flex: 1; align-items: center; gap: 8px; min-width: 0; }
.page-toolbar__actions { display: flex; flex: 0 0 auto; align-items: center; gap: 4px; }
.page-toolbar__menu { flex: 0 0 40px; width: 40px; height: 40px; }
.page-toolbar--compact { gap: 4px; min-height: 40px; }
.page-toolbar--compact .page-toolbar__content { gap: 6px; }
.page-toolbar__back { flex: 0 0 40px; width: 40px; height: 40px; margin: 0; }
.page-toolbar__menu :deep(.global-options-button) { width: 40px; height: 40px; min-width: 40px; padding: 0; margin: 0 !important; background: transparent !important; }
</style>
