<script setup lang="ts">
import { computed } from "vue";
import { useRoute, RouterLink } from "vue-router";
import {
  Bot,
  ChartNoAxesColumnIncreasing,
  Puzzle,
  Settings,
} from "@lucide/vue";
import { useI18n } from "@/i18n/composables";

const { t } = useI18n();
const route = useRoute();
const tabs = [
  { id: "bot", to: "/platforms", key: "platforms", icon: Bot },
  { id: "data", to: "/data", key: "data", icon: ChartNoAxesColumnIncreasing },
  {
    id: "extensions",
    to: "/extensions",
    key: "mobileExtensions",
    icon: Puzzle,
  },
  { id: "settings", to: "/settings", key: "mobileSettings", icon: Settings },
];
const active = computed(() => {
  if (
    route.path === "/platforms" ||
    route.path === "/session-management" ||
    route.path === "/cron"
  )
    return "bot";
  if (route.path.startsWith("/data")) return "data";
  if (
    ["/settings", "/providers", "/config", "/about"].some(
      (path) => route.path === path || route.path.startsWith(`${path}/`),
    )
  )
    return "settings";
  return "extensions";
});
</script>

<template>
  <nav
    class="mobile-bottom-navigation"
    :aria-label="t('core.navigation.mobileNavigation')"
  >
    <RouterLink
      v-for="tab in tabs"
      :key="tab.id"
      :to="tab.to"
      :class="{ 'mobile-bottom-navigation__active': active === tab.id }"
      :aria-current="active === tab.id ? 'page' : undefined"
    >
      <component
        :is="tab.icon"
        :size="21"
        :stroke-width="1.8"
        aria-hidden="true"
      />
      <span>{{ t(`core.navigation.${tab.key}`) }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.mobile-bottom-navigation {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  flex: 0 0 auto;
  padding: 3px 6px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  background: rgb(var(--v-theme-surface));
}
html[data-mobile-standalone='true'] .mobile-bottom-navigation {
  padding-bottom: calc(3px + var(--astrbot-safe-bottom));
}
.mobile-bottom-navigation a {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-width: 0;
  min-height: 58px;
  border-radius: 12px;
  color: rgba(var(--v-theme-on-surface), 0.65);
  text-decoration: none;
  font-size: 12px;
  line-height: 1.25;
}
.mobile-bottom-navigation a.mobile-bottom-navigation__active {
  color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.08);
  font-weight: 700;
}
.mobile-bottom-navigation a:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: -2px;
}
</style>
