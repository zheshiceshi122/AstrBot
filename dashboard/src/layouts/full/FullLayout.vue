<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from "vue-router";
import { ref, onMounted, computed, inject, watch } from "vue";
import { mobileViewportPortraitKey } from '@/composables/useMobileViewport';
import VerticalSidebarVue from "./vertical-sidebar/VerticalSidebar.vue";
import VerticalHeaderVue from "./vertical-header/VerticalHeader.vue";
import PageToolbar from '@/components/shared/PageToolbar.vue';
import { useHeaderContextStore } from '@/stores/headerContext';
import MobileBottomNavigation from "./MobileBottomNavigation.vue";
import { useDisplay } from 'vuetify';
import ReadmeDialog from "@/components/shared/ReadmeDialog.vue";
import Chat from "@/components/chat/Chat.vue";
import { useCustomizerStore } from "@/stores/customizer";
import { useRouterLoadingStore } from "@/stores/routerLoading";
import { useCommonStore } from "@/stores/common";
import { useMobileDrawerStore } from "@/stores/mobileDrawer";
import { statsApi } from "@/api/v1";
import { useI18n } from "@/i18n/composables";

const FIRST_NOTICE_SEEN_KEY = "astrbot:first_notice_seen:v1";

const customizer = useCustomizerStore();
const commonStore = useCommonStore();
const headerContext = useHeaderContextStore();
const compactMobile = computed(() => mobileNavigation.value && !window.astrbotDesktop?.isDesktop);
const mergedMobileHeader = computed(() => compactMobile.value && !!headerContext.mobileActionsTarget);
const mobileDrawer = useMobileDrawerStore();
const { locale, t } = useI18n();
const route = useRoute();
const { smAndDown, width, height } = useDisplay();
const viewportPortrait = inject(mobileViewportPortraitKey);
const mobileNavigation = computed(() => smAndDown.value && (viewportPortrait?.value ?? height.value >= width.value) && !isCurrentChatRoute.value);
const showMobileBottomNavigation = computed(() => mobileNavigation.value && (
  ['/platforms', '/session-management', '/cron', '/extensions'].includes(route.path)
  || (route.path === '/settings' && !route.hash)
  || ['/data/statistics', '/data/conversations', '/data/logs', '/data/trace'].includes(route.path)
));
const routerLoadingStore = useRouterLoadingStore();
const isCurrentChatRoute = computed(
  () => route.path === "/chat" || route.path.startsWith("/chat/"),
);
const isPluginViewRoute = computed(
  () => route.path.startsWith("/plugin-view/") || route.path.startsWith("/plugin-page/"),
);
const isProviderPageRoute = computed(() => route.path === "/providers");
const isPlatformPageRoute = computed(() => route.path === "/platforms");
const isViewportLockedRoute = computed(
  () =>
    isCurrentChatRoute.value ||
    isProviderPageRoute.value ||
    isPlatformPageRoute.value ||
    route.path === "/config" ||
    route.path.startsWith('/data') ||
    route.path === "/settings",
);
const isFullScreenRoute = computed(
  () => isCurrentChatRoute.value || isPluginViewRoute.value,
);
const shouldMountChat = ref(isCurrentChatRoute.value);

const showSidebar = computed(() => !isCurrentChatRoute.value && !mobileNavigation.value);
const mobileSectionLinks = computed(() => {
  if (['/platforms', '/session-management', '/cron'].includes(route.path)) return [
    { to: '/platforms', key: 'platforms' },
    { to: '/session-management', key: 'sessionManagement' },
    { to: '/cron', key: 'cron' },
  ];
  if (route.path === '/settings' && route.hash) return [{ to: '/settings', key: 'mobileSettings' }];
  if (['/providers', '/config', '/about'].includes(route.path)) return [{ to: '/settings', key: 'mobileSettings' }];
  if (route.path !== '/extensions' && !route.path.startsWith('/settings') && !route.path.startsWith('/data')) return [{ to: '/extensions', key: 'mobileExtensions' }];
  return [];
});

watch([compactMobile, mobileSectionLinks], ([compact, links]) => {
  headerContext.compactMobile = compact;
  headerContext.backLink = links.length === 1 ? links[0] : null;
}, { immediate: true });

const showFirstNoticeDialog = ref(false);

watch(isCurrentChatRoute, (isChatRoute) => {
  if (isChatRoute) {
    shouldMountChat.value = true;
  }
});

// Temporary mobile drawers must never survive a route transition. Chat stays
// mounted with v-show, so resetting the shared store here also covers Chat/Bot
// switches and navigation initiated from inside ChatUI.
watch(
  () => route.fullPath,
  () => {
    mobileDrawer.SET(false);
  },
  { immediate: true },
);

const maybeShowFirstNotice = async () => {
  if (localStorage.getItem(FIRST_NOTICE_SEEN_KEY) === "1") {
    return;
  }

  try {
    const response = await statsApi.firstNotice(locale.value);
    if (response.data.status !== "ok") {
      return;
    }

    const content = response.data?.data?.content;
    if (typeof content === "string" && content.trim().length > 0) {
      showFirstNoticeDialog.value = true;
      return;
    }

    localStorage.setItem(FIRST_NOTICE_SEEN_KEY, "1");
  } catch (error) {
    console.error("Failed to load first notice:", error);
  }
};

const onFirstNoticeDialogUpdate = (visible: boolean) => {
  showFirstNoticeDialog.value = visible;
  if (!visible) {
    localStorage.setItem(FIRST_NOTICE_SEEN_KEY, "1");
  }
};

onMounted(() => {
  setTimeout(async () => {
    try {
      const response = await statsApi.version();
      if (response.data.status === "ok") {
        commonStore.setAstrBotVersion(
          response.data.data?.version,
          response.data.data?.dashboard_version,
        );
      }
    } catch (error) {
      console.error("Failed to load version info:", error);
    }
    await maybeShowFirstNotice();
  }, 1000);
});
</script>

<template>
  <v-locale-provider>
    <v-app
      :theme="useCustomizerStore().uiTheme"
      :style="{ '--astrbot-toolbar-height': mergedMobileHeader ? '0px' : undefined }"
      :class="[
        { 'mobile-navigation-shell': mobileNavigation },
        { 'mobile-bottom-navigation-present': showMobileBottomNavigation },
        customizer.fontTheme,
        customizer.mini_sidebar ? 'mini-sidebar' : '',
        customizer.inputBg ? 'inputWithbg' : '',
      ]"
    >
      <v-progress-linear
        v-if="routerLoadingStore.isLoading"
        class="route-loading-indicator"
        :model-value="routerLoadingStore.progress"
        color="primary"
        height="2"
        fixed
        top
        style="z-index: 9999; position: absolute; opacity: 0.3"
      />
      <VerticalSidebarVue v-if="showSidebar" />
      <VerticalHeaderVue :mobile-navigation="mobileNavigation" :mobile-back-link="mobileSectionLinks.length === 1 ? mobileSectionLinks[0] : undefined" />
      <v-main :class="{ 'chat-main': isCurrentChatRoute }">
        <v-container
          fluid
          class="page-wrapper"
          :class="{
            'chat-mode-container': isCurrentChatRoute,
            'section-navigation-container': mobileSectionLinks.length > 1,
            'viewport-locked-container':
              isProviderPageRoute || isPlatformPageRoute,
            'fullscreen-container': isFullScreenRoute,
          }"
        >
          <PageToolbar v-if="!isCurrentChatRoute && mobileSectionLinks.length > 1" class="section-toolbar">
          <nav class="mobile-section-navigation" :aria-label="t('core.navigation.sectionNavigation')">
            <RouterLink v-for="item in mobileSectionLinks" :key="item.to" :to="item.to" :aria-current="route.path === item.to ? 'page' : undefined">
              <span v-if="mobileSectionLinks.length === 1" aria-hidden="true">‹</span> {{ t(`core.navigation.${item.key}`) }}
            </RouterLink>
          </nav>
          </PageToolbar>
          <div
            class="page-content"
            :class="{
              'page-content--locked': isViewportLockedRoute || isPluginViewRoute,
            }"
            :style="{
              padding: isFullScreenRoute ? '0' : undefined,
              position: isPluginViewRoute ? 'relative' : undefined,
            }"
          >
            <div
              v-if="shouldMountChat"
              v-show="isCurrentChatRoute"
              style="height: 100%; width: 100%; overflow: hidden"
            >
              <Chat :active="isCurrentChatRoute" />
            </div>
            <RouterView v-if="!isCurrentChatRoute" />
          </div>
        </v-container>
      </v-main>
      <MobileBottomNavigation v-if="showMobileBottomNavigation" />

      <ReadmeDialog
        :show="showFirstNoticeDialog"
        mode="first-notice"
        @update:show="onFirstNoticeDialogUpdate"
      />
    </v-app>
  </v-locale-provider>
</template>

<style scoped>
/* The first content row is 40px even when it replaces the global header.
   Keep transient progress out of the native chrome's sampled top edge. */
:global(html[data-mobile-standalone='true'] .route-loading-indicator) {
  top: calc(var(--astrbot-safe-top, 0px) + 40px) !important;
}
:global(.mobile-navigation-shell .v-main) {
  flex: 1 1 0;
  min-height: 0;
  height: auto !important;
  padding-bottom: 0 !important;
}
:global(.mobile-navigation-shell .page-wrapper) {
  display: flex;
  flex-direction: column;
  height: 100% !important;
}
:global(.mobile-navigation-shell .page-content) { flex: 1; min-height: 0; height: auto; }
.section-toolbar { flex: 0 0 auto; padding-inline: 4px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), .08); }
.mobile-section-navigation { display: flex; flex: 0 0 auto; gap: 4px; padding: 2px 6px; border-bottom: 1px solid rgba(var(--v-theme-on-surface), .08); overflow-x: auto; scrollbar-width: none; }
.mobile-section-navigation::-webkit-scrollbar { display: none; }
.mobile-section-navigation a { display: inline-flex; align-items: center; gap: 6px; flex: 0 0 auto; min-height: 40px; padding: 0 12px; font-size: 13px; color: rgba(var(--v-theme-on-surface), .7); text-decoration: none; border-radius: 8px; }
.mobile-section-navigation a[aria-current] { color: rgb(var(--v-theme-primary)); background: rgba(var(--v-theme-primary), .07); font-weight: 650; }
.chat-main {
  padding-top: 0 !important;
}

:global(html[data-mobile-keyboard='true'] .mobile-bottom-navigation) {
  display: none !important;
}

:global(.v-main) {
  height: calc(var(--astrbot-viewport-height, 100dvh) - var(--astrbot-toolbar-height, 40px)) !important;
  padding-top: 0 !important;
  overflow: hidden !important;
  /* The document no longer scrolls; the content area does. Sticky offsets that were
     written for the document layout must be measured from the content area's own top. */
  --v-layout-top: 0px !important;
}

/* Keep the card frame fixed while its content scrolls inside the rounded edges. */
:global(.page-wrapper) {
  --astrbot-content-gap: 6px;
  height: calc(var(--astrbot-viewport-height, 100dvh) - var(--astrbot-toolbar-height, 40px) - var(--astrbot-content-gap)) !important;
  width: calc(100% - var(--astrbot-content-gap));
  min-height: 0;
  margin: 0;
  padding: 0 !important;
  overflow: hidden;
  border-left: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-radius: 12px;
}

/* On small screens there is no permanent sidebar to separate from, so the
   card's edge treatments would only read as stray lines. */
@media (max-width: 959.98px) {
  :global(.v-main) {
    flex: 1 1 0;
    min-height: 0;
    height: auto !important;
  }
  :global(.page-wrapper) {
    display: flex;
    flex-direction: column;
    height: 100% !important;
    --astrbot-content-gap: 0px;
    border-left: 0;
    border-right: 0;
    border-bottom: 0;
    border-radius: 0;
  }
  :global(.page-content) {
    flex: 1;
    min-height: 0;
    height: auto;
  }
}

/* Off macOS the card also carries the hairline under the toolbar, so the line
   follows the rounded corner instead of cutting across the notch. */
@media (min-width: 960px) {
  :global(html:not([data-astrbot-desktop-platform='macos']) .page-wrapper) {
    border-top: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  }
}

.section-navigation-container { display: flex; flex-direction: column; }
.section-navigation-container > .page-content { flex: 1; min-height: 0; height: auto; }

.page-content {
  height: 100%;
  width: 100%;
  padding: 8px;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none;
}

.page-content::-webkit-scrollbar {
  width: 0;
  background: transparent;
}

/* Chat, workspace and plugin pages manage their own internal scrolling. */
.page-content--locked {
  overflow: hidden;
}

/* macOS desktop vibrancy: the window material shows through wherever the UI stays
   transparent. Only the content area keeps an opaque background. */
:global(html) {
  /* Shared chrome background for the top toolbar and the sidebars, so the
     header and sidebar always read as one surface in both themes. */
  --astrbot-chrome-bg: var(--color-surface);
}

:global(html .v-application.v-theme--PurpleThemeDark) {
  --astrbot-chrome-bg: rgb(var(--v-theme-background));
}

:global(html[data-astrbot-desktop-platform='macos']) {
  /* Bias the native window material toward the warm paper canvas. */
  --astrbot-vibrancy-tint: rgba(247, 244, 237, 0.92);
}

:global(html[data-astrbot-desktop-platform='macos'] .v-application.v-theme--PurpleThemeDark) {
  --astrbot-vibrancy-tint: rgba(29, 24, 19, 0.92);
}

/* Extend the warm page gradient behind every card gap. */
:global(html:not([data-astrbot-desktop-platform='macos']) .v-main) {
  background: var(--page-background) !important;
}

:global(html[data-astrbot-desktop-platform='macos']),
:global(html[data-astrbot-desktop-platform='macos'] body),
:global(html[data-astrbot-desktop-platform='macos'] .v-application),
:global(html[data-astrbot-desktop-platform='macos'] .v-application__wrap) {
  background: transparent !important;
}

/* Keep the macOS tint continuous behind the sidebar and the card gaps. */
:global(html[data-astrbot-desktop-platform='macos'] .v-main) {
  background: var(--astrbot-vibrancy-tint, transparent) !important;
}

/* Vuetify paints its own surface behind every list, which would sit on top of the
   translucent sidebar, so keep the navigation lists transparent on macOS. */
:global(html[data-astrbot-desktop-platform='macos'] .leftSidebar .v-list),
:global(html[data-astrbot-desktop-platform='macos'] .chat-sidebar .v-list) {
  background: transparent !important;
}
</style>
