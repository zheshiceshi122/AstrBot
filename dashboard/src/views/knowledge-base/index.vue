<template>
  <div class="kb-container">
    <PageToolbar class="page-header">
      <div class="kb-page-heading">
        <h1 class="kb-page-title">
          <button
            v-if="isDetailRoute"
            class="kb-page-title__parent"
            type="button"
            @click="goToList"
          >
            {{ t('list.title') }}
          </button>
          <template v-else>
            {{ t('list.title') }}
          </template>
          <template v-if="isDetailRoute">
            <v-icon icon="mdi-chevron-right" size="24" class="mx-1" />
            <span class="kb-page-title__current" :title="displayDetailTitle">{{ displayDetailTitle }}</span>
          </template>
        </h1>
      </div>
      <template #actions><div class="kb-header-actions">
        <template v-if="isListRoute">
          <v-btn v-if="currentPage?.hasItems" variant="text" icon :loading="currentPage?.loading" :aria-label="t('list.refresh')" :title="t('list.refresh')" @click="currentPage?.refresh()"><RefreshCw :size="20" /></v-btn>
          <v-btn v-if="currentPage?.hasItems" variant="text" icon color="primary" :aria-label="t('list.create')" :title="t('list.create')" @click="currentPage?.openCreate()"><Plus :size="22" /></v-btn>
        </template>
        <v-btn
        icon="mdi-information-outline"
        variant="text"
        size="small"
        color="grey"
        href="https://docs.astrbot.app/use/knowledge-base.html"
        target="_blank"
        :aria-label="globalT('core.navigation.documentation')"
        :title="globalT('core.navigation.documentation')"
      />
      </div></template>
    </PageToolbar>

    <router-view v-slot="{ Component }"><component :is="Component" ref="currentPage" @title-change="detailTitle = $event" /></router-view>
  </div>
</template>

<script setup lang="ts">
import PageToolbar from '@/components/shared/PageToolbar.vue';
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n, useModuleI18n } from '@/i18n/composables'
import { Plus, RefreshCw } from '@lucide/vue'

const { tm: t } = useModuleI18n('features/knowledge-base/index')
const { t: globalT } = useI18n()
const route = useRoute()
const router = useRouter()
const detailTitle = ref('')
const currentPage = ref<{ loading: boolean; hasItems: boolean; refresh: () => void; openCreate: () => void } | null>(null)
const isListRoute = computed(() => route.name === 'NativeKBList')

const isDetailRoute = computed(() => route.name === 'NativeKBDetail')
const displayDetailTitle = computed(() => detailTitle.value || String(route.params.kbId || ''))

const goToList = () => {
  router.push({ name: 'NativeKBList' })
}
</script>

<style scoped>
.kb-container {
  margin: 0 auto;
  max-width: 1040px;
  padding: 24px;
  width: 100%;
  height: 100%;
  position: relative;
}

.page-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
}
.kb-header-actions { display: flex; align-items: center; flex: 0 0 auto; gap: 2px; }
.kb-page-heading { flex: 1; min-width: 0; }
.kb-header-actions :deep(.v-btn) { width: 44px; height: 44px; }

.kb-page-title {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  font-size: 1.5rem;
  font-weight: 700;
  gap: 2px;
  letter-spacing: 0;
  line-height: 1.2;
  margin: 0 0 4px;
  min-width: 0;
}

.kb-page-title__parent {
  background: transparent;
  border: 0;
  color: inherit;
  cursor: pointer;
  font: inherit;
  padding: 0;
}

.kb-page-title__parent:hover {
  color: rgb(var(--v-theme-primary));
}

.kb-page-title__current {
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .kb-container {
    padding: 16px;
  }
}
@media (max-width: 600px) {
  .kb-container { padding: 6px; } .page-header { margin-bottom: 12px; gap: 8px; } .kb-page-title { font-size: 20px; } .page-header p { font-size: 13px !important; line-height: 1.5; }
}
</style>
