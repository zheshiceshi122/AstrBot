<script setup lang="ts">
import PageToolbar from '@/components/shared/PageToolbar.vue';
import { computed, watch } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";
import {
  ChartNoAxesColumnIncreasing,
  Logs,
  MessageSquareText,
  Waypoints,
} from "@lucide/vue";
import { useI18n } from "@/i18n/composables";

const { t } = useI18n();
const route = useRoute();

const tabs = computed(() => [
  {
    value: "statistics",
    label: t("core.navigation.dataTabs.statistics"),
    routeName: "Stats",
    icon: ChartNoAxesColumnIncreasing,
  },
  {
    value: "conversations",
    label: t("core.navigation.dataTabs.conversations"),
    routeName: "Conversation",
    icon: MessageSquareText,
  },
  {
    value: "logs",
    label: t("core.navigation.dataTabs.logs"),
    routeName: "Console",
    icon: Logs,
  },
  {
    value: "trace",
    label: t("core.navigation.dataTabs.trace"),
    routeName: "Trace",
    icon: Waypoints,
  },
]);

const activeTab = computed(() => String(route.meta.dataTab || "statistics"));

// Watch the route metadata directly so leaving this workspace does not save
// the Statistics fallback as the last opened tab.
watch(
  () => route.meta.dataTab,
  (value) => {
    const tab = tabs.value.find((item) => item.value === value);
    if (tab) localStorage.setItem("data_last_tab", tab.routeName);
  },
  { immediate: true },
);
</script>

<template>
  <div class="data-workspace">
    <PageToolbar class="data-tabs-scroll">
      <nav
        class="data-tabs"
        role="tablist"
        :aria-label="t('core.navigation.data')"
      >
        <RouterLink
          v-for="tab in tabs"
          :key="tab.value"
          v-slot="{ href, navigate }"
          custom
          :to="{ name: tab.routeName }"
        >
          <a
            :href="href"
            class="data-tab"
            :class="{ 'data-tab--active': activeTab === tab.value }"
            role="tab"
            :aria-selected="activeTab === tab.value"
            @click="navigate"
          >
            <component
              :is="tab.icon"
              :size="16"
              :stroke-width="1.8"
              aria-hidden="true"
            />
            <span>{{ tab.label }}</span>
          </a>
        </RouterLink>
      </nav>
    </PageToolbar>

    <div class="data-page-content"><RouterView /></div>
  </div>
</template>

<style scoped>
.data-workspace {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  min-width: 0;
  width: 100%;
}

.data-tabs-scroll {
  flex: 0 0 auto;
  overflow-x: auto;
  padding: 4px 12px 8px;
  scrollbar-width: none;
}

.data-tabs-scroll::-webkit-scrollbar {
  display: none;
}

.data-tabs {
  max-width: 100%;
  overflow-x: auto;
  scrollbar-width: none;
  align-items: center;
  display: inline-flex;
  gap: 2px;
  min-width: 0;
}

.data-tab {
  align-items: center;
  border-radius: 8px;
  color: rgba(var(--v-theme-on-surface), 0.58);
  display: inline-flex;
  font-size: 0.8125rem;
  font-weight: 500;
  gap: 6px;
  height: 34px;
  padding: 0 12px;
  text-decoration: none;
}

.data-tab:hover {
  background: rgba(var(--v-theme-primary), 0.06);
  color: rgb(var(--v-theme-primary));
}

.data-tab--active {
  background: var(--color-accent-soft);
  color: rgb(var(--v-theme-primary));
}

.data-tab--active:hover {
  background: rgba(var(--v-theme-primary), 0.18);
  color: rgb(var(--v-theme-primary));
}

@media (max-width: 600px) {
  .data-tabs-scroll {
    padding-inline: 4px;
  }

  .data-tab {
    height: 40px;
    padding-inline: 6px;
    flex-shrink: 0;
    font-size: 12px;
    gap: 4px;
  }
}
.data-page-content { flex: 1; min-height: 0; overflow-y: auto; }
.data-page-content > :deep(.console-page),
.data-page-content > :deep(.trace-page),
.data-page-content > :deep(.conversation-workspace) { height: 100%; min-height: 0; }
</style>
