<script setup>
import MarketPluginCard from "@/components/extension/MarketPluginCard.vue";
import PluginSortControl from "@/components/extension/PluginSortControl.vue";
import defaultPluginIcon from "/favicon.svg";
import { computed } from "vue";
import { normalizeTextInput } from "@/utils/inputValue";

const props = defineProps({
  state: {
    type: Object,
    required: true,
  },
});

const {
  commonStore,
  t,
  tm,
  router,
  route,
  getSelectedGitHubProxy,
  conflictDialog,
  checkAndPromptConflicts,
  handleConflictConfirm,
  fileInput,
  activeTab,
  validTabs,
  isValidTab,
  getLocationHash,
  extractTabFromHash,
  syncTabFromHash,
  extension_data,
  getInitialShowReserved,
  showReserved,
  snack_message,
  snack_show,
  snack_success,
  configDialog,
  extension_config,
  pluginMarketData,
  loadingDialog,
  curr_namespace,
  updatingAll,
  readmeDialog,
  forceUpdateDialog,
  updateAllConfirmDialog,
  changelogDialog,
  getInitialListViewMode,
  isListView,
  pluginSearch,
  loading_,
  currentPage,
  dangerConfirmDialog,
  selectedDangerPlugin,
  selectedMarketInstallPlugin,
  installSupport,
  versionSupportDialog,
  showUninstallDialog,
  uninstallTarget,
  showSourceDialog,
  showSourceManagerDialog,
  sourceName,
  sourceUrl,
  customSources,
  selectedSource,
  showRemoveSourceDialog,
  sourceToRemove,
  editingSource,
  originalSourceUrl,
  extension_url,
  dialog,
  upload_file,
  uploadTab,
  showPluginFullName,
  marketSearch,
  debouncedMarketSearch,
  refreshingMarket,
  sortBy,
  sortOrder,
  randomPluginNames,
  marketCategoryFilter,
  marketCategoryItems,
  getMarketPluginKey,
  normalizeStr,
  toPinyinText,
  toInitials,
  pluginHeaders,
  filteredExtensions,
  filteredPlugins,
  filteredMarketPlugins,
  sortedPlugins,
  RANDOM_PLUGINS_COUNT,
  randomPlugins,
  shufflePlugins,
  refreshRandomPlugins,
  displayItemsPerPage,
  totalPages,
  paginatedPlugins,
  updatableExtensions,
  toggleShowReserved,
  toast,
  resetLoadingDialog,
  onLoadingDialogResult,
  failedPluginsDict,
  getExtensions,
  handleReloadAllFailed,
  checkUpdate,
  uninstallExtension,
  handleUninstallConfirm,
  updateExtension,
  showUpdateAllConfirm,
  confirmUpdateAll,
  cancelUpdateAll,
  confirmForceUpdate,
  updateAllExtensions,
  pluginOn,
  pluginOff,
  openExtensionConfig,
  updateConfig,
  showPluginInfo,
  reloadPlugin,
  viewReadme,
  viewChangelog,
  openInstallDialog,
  handleInstallPlugin,
  confirmDangerInstall,
  cancelDangerInstall,
  loadCustomSources,
  saveCustomSources,
  addCustomSource,
  openSourceManagerDialog,
  selectPluginSource,
  editCustomSource,
  removeCustomSource,
  confirmRemoveSource,
  saveCustomSource,
  trimExtensionName,
  checkAlreadyInstalled,
  showVersionSupportWarning,
  continueInstallIgnoringVersionWarning,
  cancelInstallOnVersionWarning,
  newExtension,
  normalizePlatformList,
  getPlatformDisplayList,
  resolveSelectedInstallPlugin,
  selectedInstallPlugin,
  checkInstallVersionSupport,
  refreshPluginMarket,
  handleLocaleChange,
  searchDebounceTimer,
} = props.state;

const currentSourceName = computed(() => {
  if (!selectedSource.value) {
    return tm("market.defaultSource");
  }
  const matched = customSources.value.find(
    (s) => s.url === selectedSource.value,
  );
  return matched?.name || tm("market.defaultSource");
});

const marketSortItems = computed(() => [
  { title: tm("sort.default"), value: "default" },
  { title: tm("sort.stars"), value: "stars" },
  { title: tm("sort.downloads"), value: "downloads" },
  { title: tm("sort.author"), value: "author" },
  { title: tm("sort.updated"), value: "updated" },
]);

const marketCategorySelectItems = computed(() =>
  marketCategoryItems.value.map((item) => ({
    title: `${item.label || ""} (${item.count || 0})`,
    value: item.value,
  })),
);

// Navigate with the unique market plugin key instead of the metadata name —
// two market entries can share the same `name`.
const openMarketPluginDetail = (plugin) => {
  const pluginKey = getMarketPluginKey(plugin);
  if (!pluginKey) return;
  router.push({
    name: "ExtensionMarketDetails",
    params: { pluginId: pluginKey },
  });
};
</script>

<template>
  <v-tab-item v-show="activeTab === 'market'">
    <div class="plugin-workspace-toolbar">
      <div class="market-header-row d-flex align-center">
        <div class="market-header-primary d-flex align-center">
          <v-tabs
            model-value="market"
            bg-color="transparent"
            class="plugin-view-tabs"
            height="40"
          >
            <v-tab
              value="installed"
              :to="{ name: 'Extensions' }"
              class="plugin-view-tab text-none"
              :ripple="false"
            >
              {{ tm("titles.installedAstrBotPlugins") }}
            </v-tab>
            <v-tab
              value="market"
              :to="{ name: 'ExtensionMarketplace' }"
              class="plugin-view-tab text-none"
              :ripple="false"
            >
              {{ tm("tabs.market") }}
            </v-tab>
          </v-tabs>

          <v-tooltip location="top" :text="tm('market.sourceManagement')">
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                variant="tonal"
                rounded="md"
                color="primary"
                class="market-source-button text-none px-2"
                :aria-label="tm('market.sourceManagement')"
                @click="openSourceManagerDialog"
              >
                <v-icon size="18" class="mr-1">mdi-source-branch</v-icon>
                <span class="text-truncate" style="max-width: 180px">
                  {{ currentSourceName }}
                </span>
              </v-btn>
            </template>
          </v-tooltip>
          <v-btn
            class="market-mobile-install"
            icon="mdi-plus"
            variant="tonal"
            color="primary"
            :aria-label="tm('market.installPlugin')"
            :title="tm('market.installPlugin')"
            @click="openInstallDialog"
          />
        </div>

        <v-text-field
          :model-value="marketSearch"
          @update:model-value="marketSearch = normalizeTextInput($event)"
          class="market-search-field ml-auto"
          density="compact"
          :placeholder="tm('search.marketPlaceholder')"
          :aria-label="tm('search.marketPlaceholder')"
          prepend-inner-icon="mdi-magnify"
          clearable
          variant="solo-filled"
          flat
          hide-details
          single-line
        >
        </v-text-field>
      </div>

      <div
        class="d-flex align-center text-caption text-medium-emphasis mt-2"
        style="color: grey; line-height: 1.4"
      >
        <v-icon size="16" class="mr-1">mdi-alert-outline</v-icon>
        <span>{{ tm("market.sourceSafetyWarning") }}</span>
      </div>
    </div>

    <!-- <small style="color: var(--v-theme-secondaryText);">每个插件都是作者无偿提供的的劳动成果。如果您喜欢某个插件，请 Star！</small> -->

    <!-- FAB Button -->
    <v-tooltip :text="tm('market.installPlugin')" location="left">
      <template v-slot:activator="{ props }">
        <button
          v-bind="props"
          type="button"
          :aria-label="tm('market.installPlugin')"
          class="v-btn v-btn--elevated v-btn--icon v-theme--PurpleThemeDark bg-darkprimary v-btn--density-default v-btn--size-x-large v-btn--variant-elevated fab-button"
          style="
            position: fixed;
            right: 52px;
            bottom: 52px;
            z-index: 10000;
            border-radius: 16px;
          "
          @click="openInstallDialog"
        >
          <span class="v-btn__overlay"></span>
          <span class="v-btn__underlay"></span>
          <span class="v-btn__content" data-no-activator="">
            <i
              class="mdi-plus mdi v-icon notranslate v-theme--PurpleThemeDark v-icon--size-default"
              aria-hidden="true"
              style="font-size: 32px"
            ></i>
          </span>
        </button>
      </template>
    </v-tooltip>

    <div class="market-results">
      <div
        class="d-flex align-center mb-2"
        style="justify-content: space-between; flex-wrap: wrap; gap: 8px"
      >
        <div class="d-flex align-center" style="gap: 6px">
          <h2>
            {{ tm("market.allPlugins") }}
          </h2>
          <v-btn
            icon
            variant="text"
            @click="refreshPluginMarket"
            :loading="loading_ || refreshingMarket"
            :disabled="loading_ || refreshingMarket"
          >
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </div>

        <div class="market-filter-group d-flex align-center">
          <v-select
            v-if="marketCategoryItems.length > 0"
            v-model="marketCategoryFilter"
            :items="marketCategorySelectItems"
            item-title="title"
            item-value="value"
            :label="tm('market.category')"
            density="compact"
            variant="outlined"
            hide-details
            class="market-filter-control"
            :menu-props="{ openOnHover: true, closeOnContentClick: false }"
          ></v-select>

          <PluginSortControl
            class="market-sort-control"
            v-model="sortBy"
            :items="marketSortItems"
            :label="tm('sort.by')"
            :order="sortOrder"
            :ascending-label="tm('sort.ascending')"
            :descending-label="tm('sort.descending')"
            :show-order="sortBy !== 'default'"
            @update:order="sortOrder = $event"
          />
        </div>
      </div>

      <v-row style="min-height: 26rem" dense>
        <v-col
          v-for="plugin in paginatedPlugins"
          :key="getMarketPluginKey(plugin)"
          cols="12"
          md="6"
          lg="4"
          class="pb-2"
        >
          <MarketPluginCard
            :plugin="plugin"
            :default-plugin-icon="defaultPluginIcon"
            :show-plugin-full-name="showPluginFullName"
            @install="handleInstallPlugin"
            @open="openMarketPluginDetail"
          />
        </v-col>
      </v-row>

      <div class="d-flex justify-center mt-4" v-if="totalPages > 1">
        <v-pagination
          v-model="currentPage"
          :length="totalPages"
          :total-visible="7"
          size="small"
        ></v-pagination>
      </div>

      <v-expand-transition>
        <div v-if="randomPlugins.length > 0">
          <div
            class="d-flex align-center mb-2 mt-4"
            style="justify-content: space-between; flex-wrap: wrap; gap: 8px"
          >
            <h2>
              {{ tm("market.randomPlugins") }}
            </h2>
            <v-btn
              color="primary"
              variant="tonal"
              prepend-icon="mdi-shuffle-variant"
              :disabled="pluginMarketData.length === 0"
              @click="refreshRandomPlugins"
            >
              {{ tm("buttons.reshuffle") }}
            </v-btn>
          </div>

          <v-row class="mb-6" dense>
            <v-col
              v-for="plugin in randomPlugins"
              :key="getMarketPluginKey(plugin)"
              cols="12"
              md="6"
              lg="4"
              class="pb-2"
            >
              <MarketPluginCard
                :plugin="plugin"
                :default-plugin-icon="defaultPluginIcon"
                :show-plugin-full-name="showPluginFullName"
                @install="handleInstallPlugin"
                @open="openMarketPluginDetail"
              />
            </v-col>
          </v-row>
        </div>
      </v-expand-transition>
    </div>
  </v-tab-item>
</template>

<style scoped>
.market-mobile-install { display: none; }
.market-results { margin-top: 16px; }

.market-header-row,
.market-header-primary,
.market-filter-group {
  gap: 12px;
}

.market-header-primary {
  min-width: 0;
}

.market-source-button {
  max-width: 220px;
}

.market-search-field {
  flex: 0 1 340px;
  max-width: 340px;
  min-width: 220px;
}

.market-filter-group {
  flex-wrap: wrap;
}

.market-filter-control {
  min-width: 190px;
  max-width: 220px;
}

.market-filter-control :deep(.v-field__input),
.market-filter-control :deep(.v-field-label),
.market-filter-control :deep(.v-select__selection-text),
.market-filter-control :deep(.v-field__prepend-inner) {
  font-size: 0.875rem;
}

@media (max-width: 700px) {
  .market-header-row {
    align-items: stretch !important;
    flex-direction: column;
  }

  .market-header-primary {
    flex-wrap: wrap;
    gap: 8px;
  }

  .market-search-field {
    flex: none;
    margin-left: 0 !important;
    max-width: none;
    min-width: 0;
    width: 100%;
  }

  .market-filter-group {
    align-items: stretch !important;
    flex-direction: column;
    width: 100%;
  }

  .market-filter-control {
    max-width: none;
    min-width: 0;
    width: 100%;
  }

  .market-filter-group :deep(.plugin-sort-control) {
    flex-wrap: nowrap;
    width: 100%;
  }

  .market-filter-group :deep(.plugin-sort-control__select) {
    flex: 1;
    max-width: none;
    min-width: 0;
    width: auto;
  }

}

@media (max-width: 600px) {
  .market-header-row { gap: 6px; }
  .market-header-primary { flex-wrap: nowrap; gap: 6px; }
  .market-source-button { flex: 1 1 auto; min-width: 40px; }
  .market-source-button :deep(.v-btn__content) { min-width: 0; }
  .market-mobile-install { display: inline-flex; flex: 0 0 40px; }
  .fab-button { display: none; }
  .market-results { margin-top: 8px; }
  .market-results h2 { font-size: 17px; line-height: 1.4; }
  .market-filter-group { display: grid !important; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
}
</style>
