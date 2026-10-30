<template>
  <div ref="pageRoot" class="provider-page">
    <v-container fluid class="pa-0">
      <PageToolbar class="provider-tabs-scroll">
        <div
          class="provider-tabs"
          role="tablist"
          :aria-label="tm('providerTypes.title')"
        >
          <button
            v-for="type in providerTypes"
            :key="type.value"
            type="button"
            class="provider-tab"
            :class="{ 'provider-tab--active': selectedProviderType === type.value }"
            role="tab"
            :aria-selected="selectedProviderType === type.value"
            @click="selectedProviderType = type.value"
          >
            <v-icon :icon="type.icon" size="16" />
            <span>{{ type.label }}</span>
          </button>
        </div>
      </PageToolbar>

      <div class="provider-content" :class="{ 'is-empty': (selectedProviderType === 'chat_completion' ? displayedProviderSources.length : displayedLegacyProviders.length) === 0 && !loadingSources }">
        <div class="provider-workbench" :class="{ 'is-empty': (selectedProviderType === 'chat_completion' ? displayedProviderSources.length : displayedLegacyProviders.length) === 0 && !loadingSources }" :inert="connection.busy || savingSource || loadingModels || undefined">
          <div class="provider-workbench__sidebar">
            <ProviderSourcesPanel
              :displayed-provider-sources="selectedProviderType === 'chat_completion'
                ? displayedProviderSources
                : displayedLegacyProviders"
              :selected-provider-source="selectedProviderType === 'chat_completion'
                ? selectedProviderSource
                : selectedLegacyProvider"
              :available-source-types="availableSourceTypes"
              :title="selectedProviderType === 'chat_completion' ? '' : tm('providers.title')"
              :empty-text="selectedProviderType === 'chat_completion' ? '' : getEmptyText()"
              :select-hint="selectedProviderType === 'chat_completion'
                ? ''
                : tm('providers.selectHint')"
              :delete-label="selectedProviderType === 'chat_completion'
                ? ''
                : tm('providers.deleteProvider')"
              :loading="loadingSources"
              :tm="tm"
              :resolve-source-icon="resolveSourceIcon"
              :is-monochrome-source-icon="isMonochromeSourceIcon"
              :get-source-display-name="getSourceDisplayName"
              @add-provider-source="selectedProviderType === 'chat_completion'
                ? addProviderSource($event)
                : addLegacyProvider($event)"
              @select-provider-source="selectedProviderType === 'chat_completion'
                ? selectProviderSource($event)
                : selectLegacyProvider($event)"
              @delete-provider-source="selectedProviderType === 'chat_completion'
                ? deleteProviderSource($event)
                : deleteLegacyProvider($event)"
            />
          </div>

          <div class="provider-workbench__divider"></div>

          <div class="provider-workbench__main">
            <template v-if="selectedProviderType === 'chat_completion'">
            <div v-if="selectedProviderSource" class="provider-config-shell">
              <div v-if="selectedSponsor" class="provider-config-header">
                <ProviderSourceSubtitle :api-base="selectedProviderSource.api_base" :sponsor="selectedSponsor" :tm="tm" />
              </div>

              <div class="provider-config-body">
                <section class="provider-section">
                  <ProviderConnectionForm
                    :source="basicSourceConfig"
                    :connection="connection"
                    :available-models="availableModels"
                    :configured-models="sourceProviders"
                    :loading-models="loadingModels"
                    :saving-source="savingSource"
                    :modified="isSourceModified"
                    :tm="tm"
                    @save="saveConnection"
                    @fetch-models="fetchAvailableModels"
                    @reload-profiles="loadConnectionProfiles"
                  />
                </section>

                <v-divider v-if="advancedSourceConfig"></v-divider>

                <details
                  v-if="advancedSourceConfig"
                  :key="selectedProviderSource.id"
                  class="provider-section provider-section--advanced config-form"
                >
                  <summary class="provider-section-head provider-section-title">
                    {{ tm('providerSources.advancedConfig') }}
                    <v-icon class="provider-section-chevron" size="20">mdi-chevron-right</v-icon>
                  </summary>
                  <div class="provider-section-content">
                    <AstrBotConfig
                      :iterable="advancedSourceConfig"
                      :metadata="providerSourceSchema"
                      metadataKey="provider"
                      :is-editing="true"
                    />
                  </div>
                </details>

                <v-divider></v-divider>

                <section v-if="sourceProviders.length || availableModels.length" class="provider-section provider-section--models">
                  <ProviderModelsPanel
                    :entries="filteredMergedModelEntries"
                    :available-count="availableModels.length"
                    v-model:model-search="modelSearch"
                    :supports-image-input="supportsImageInput"
                    :supports-audio-input="supportsAudioInput"
                    :supports-tool-call="supportsToolCall"
                    :supports-reasoning="supportsReasoning"
                    :format-context-limit="formatContextLimit"
                    :testing-providers="testingProviders"
                    :saving-providers="savingProviderToggles"
                    :tm="tm"
                    @open-provider-edit="openProviderEdit"
                    @toggle-provider-enable="toggleProviderEnable"
                    @test-provider="testProvider"
                    @delete-provider="deleteProvider"
                    @add-model-provider="openModelAddDialog"
                  />
                </section>
              </div>
            </div>

            <div v-else class="provider-empty-state">
              <v-icon size="48" color="grey-lighten-1">mdi-cursor-default-click</v-icon>
              <p class="mt-2">{{ tm('providerSources.selectHint') }}</p>
            </div>
            </template>

            <template v-else>
            <div v-if="selectedLegacyProvider" class="provider-config-shell">
              <div class="provider-config-header">
                <div class="provider-config-headline">
                  <div class="provider-config-title">
                    {{ newSelectedProviderConfig.id || selectedLegacyProvider.id }}
                  </div>
                  <div class="provider-config-subtitle">
                    {{
                      newSelectedProviderConfig.api_base ||
                      newSelectedProviderConfig.embedding_api_base ||
                      newSelectedProviderConfig.rerank_api_base ||
                      newSelectedProviderConfig.type ||
                      'N/A'
                    }}
                  </div>
                </div>

                <div class="provider-config-actions d-flex align-center ga-2">
                  <v-btn
                    v-if="updatingMode"
                    color="primary"
                    prepend-icon="mdi-connection"
                    :loading="isProviderTesting(selectedLegacyProvider.id)"
                    :disabled="selectedLegacyProvider.enable === false"
                    variant="text"
                    rounded="xl"
                    @click="testSingleProvider(selectedLegacyProvider)"
                  >
                    {{ tm('availability.test') }}
                  </v-btn>
                  <v-btn
                    color="primary"
                    prepend-icon="mdi-content-save-outline"
                    :loading="loading"
                    :disabled="!isLegacyProviderModified"
                    variant="tonal"
                    rounded="xl"
                    @click="saveLegacyProvider"
                  >
                    {{ tm('dialogs.config.save') }}
                  </v-btn>
                </div>
              </div>

              <v-divider></v-divider>

              <div class="provider-config-body">
                <section class="provider-section config-form">
                  <div class="provider-section-head">
                    <div class="provider-section-title">{{ tm('providers.settings') }}</div>
                  </div>
                  <AstrBotConfig
                    :iterable="legacyConfigSections.basic"
                    :metadata="legacyConfigSchema"
                    metadataKey="provider"
                    :is-editing="updatingMode"
                  />
                </section>

                <v-divider v-if="legacyConfigSections.advanced"></v-divider>

                <details
                  v-if="legacyConfigSections.advanced"
                  :key="selectedLegacyProvider.id"
                  class="provider-section provider-section--advanced config-form"
                >
                  <summary class="provider-section-head provider-section-title">
                    {{ tm('providerSources.advancedConfig') }}
                    <v-icon class="provider-section-chevron" size="20">mdi-chevron-right</v-icon>
                  </summary>
                  <div class="provider-section-content">
                    <AstrBotConfig
                      :iterable="legacyConfigSections.advanced"
                      :metadata="legacyConfigSchema"
                      metadataKey="provider"
                      :is-editing="updatingMode"
                    />
                  </div>
                </details>
              </div>
            </div>

            <div v-else class="provider-empty-state">
              <v-icon size="48" color="grey-lighten-1">mdi-cursor-default-click</v-icon>
              <p class="mt-2">{{ tm('providers.selectHint') }}</p>
            </div>
            </template>
          </div>
        </div>
      </div>
    </v-container>

    <v-dialog v-model="showProviderEditDialog" width="800">
      <v-card>
        <v-card-title class="text-h3 pa-4 pb-0 pl-6">
          {{ providerEditDialogTitle }}
        </v-card-title>
        <v-card-text class="py-4 config-form">
          <AstrBotConfig
            v-if="providerEditData"
            :iterable="providerEditData"
            :metadata="providerModelConfigSchema"
            metadataKey="provider"
            :is-editing="true"
          />
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            :disabled="savingProviders.includes(providerEditData?.id)"
            @click="showProviderEditDialog = false"
          >
            {{ tm('dialogs.config.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            variant="tonal"
            :loading="savingProviders.includes(providerEditData?.id)"
            @click="saveEditedProvider"
          >
            {{ tm('dialogs.config.save') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000" location="top">
      {{ snackbar.message }}
    </v-snackbar>

  </div>
</template>

<script setup>
import PageToolbar from '@/components/shared/PageToolbar.vue';
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { providerApi } from '@/api/v1'
import { useModuleI18n } from '@/i18n/composables'
import AstrBotConfig from '@/components/shared/AstrBotConfig.vue'
import ProviderModelsPanel from '@/components/provider/ProviderModelsPanel.vue'
import ProviderConnectionForm from '@/components/provider/ProviderConnectionForm.vue'
import ProviderSourceSubtitle from '@/components/provider/ProviderSourceSubtitle.vue'
import ProviderSourcesPanel from '@/components/provider/ProviderSourcesPanel.vue'
import { useProviderModelConfigDialog } from '@/composables/useProviderModelConfigDialog'
import { useProviderSources } from '@/composables/useProviderSources'

const props = defineProps({
  defaultTab: {
    type: String,
    default: 'chat_completion'
  }
})

const { tm } = useModuleI18n('features/provider')

const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

function showMessage(message, color = 'success') {
  snackbar.value = { show: true, message, color }
}

const {
  providers,
  selectedProviderType,
  selectedProviderSource,
  selectedSponsor,
  availableModels,
  loadingSources,
  loadingModels,
  savingSource,
  savingProviderToggles,
  testingProviders,
  isSourceModified,
  configSchema,
  providerSourceSchema,
  modelSearch,
  providerTypes,
  availableSourceTypes,
  displayedProviderSources,
  filteredMergedModelEntries,
  filteredProviders,
  basicSourceConfig,
  sourceProviders,
  connection,
  saveConnection,
  loadConnectionProfiles,
  advancedSourceConfig,
  resolveSourceIcon,
  isMonochromeSourceIcon,
  getSourceDisplayName,
  supportsImageInput,
  supportsAudioInput,
  supportsToolCall,
  supportsReasoning,
  formatContextLimit,
  updateDefaultTab,
  selectProviderSource,
  addProviderSource,
  deleteProviderSource,
  fetchAvailableModels,
  buildModelProviderConfig,
  deleteProvider,
  modelAlreadyConfigured,
  toggleProviderEnable,
  testProvider,
  loadConfig
} = useProviderSources({
  defaultTab: props.defaultTab,
  tm,
  showMessage
})

// The provider types are a single scrollable row on phones. Keep the active tab
// in view so switching types never leaves the selected tab half off screen.
const pageRoot = ref<HTMLElement | null>(null)
const revealSelectedProviderTab = () => {
  nextTick(() => {
    const tab = pageRoot.value?.querySelector('.provider-tab--active')
    tab?.scrollIntoView({ block: 'nearest', inline: 'center' })
  })
}
watch(selectedProviderType, revealSelectedProviderTab)
onMounted(revealSelectedProviderTab)

const legacyConfigSchema = computed(() => {
  const schema = JSON.parse(JSON.stringify(configSchema.value || {}))
  if (selectedLegacyProvider.value?.type !== 'system_one_decision') return schema

  const items = schema.provider?.items
  if (!items) return schema
  if (items.key) {
    items.key.type = 'string'
    delete items.key.items
  }
  if (items.api_base) items.api_base.hint = tm('providers.decisionHints.apiBase')
  if (items.model) items.model.hint = tm('providers.decisionHints.model')
  if (items.custom_headers) {
    items.custom_headers.hint = tm('providers.decisionHints.customHeaders')
  }
  return schema
})

const unsavedLegacyProviderMarker = Symbol('unsavedLegacyProvider')
const legacyProviderDrafts = ref([])
const selectedLegacyProvider = ref(null)
const newSelectedProviderConfig = ref({})
const newProviderOriginalId = ref('')
const updatingMode = ref(false)
const loading = ref(false)
const isLegacyProviderModified = ref(false)
const legacyConfigSections = computed(() => {
  const config = newSelectedProviderConfig.value
  if (config.type !== 'system_one_decision') return { basic: config, advanced: null }

  const advancedFields = new Set([
    'timeout', 'total_timeout', 'max_concurrency',
    'proxy', 'custom_headers'
  ])
  const basic = {}
  const advanced = {}
  for (const key of Object.keys(config)) {
    const property = {
      get() {
        return config[key]
      },
      set(value) {
        config[key] = value
      }
    }
    // Keep hidden fields accessible to schema conditions in both sections.
    Object.defineProperty(basic, key, { ...property, enumerable: !advancedFields.has(key) })
    Object.defineProperty(advanced, key, { ...property, enumerable: advancedFields.has(key) })
  }
  return { basic, advanced }
})
let suppressLegacyProviderWatch = false

const displayedLegacyProviders = computed(() => [
  ...filteredProviders.value,
  ...legacyProviderDrafts.value.filter(
    (provider) => provider.provider_type === selectedProviderType.value
  )
])

const {
  showProviderEditDialog,
  providerEditData,
  savingProviders,
  providerModelConfigSchema,
  providerEditDialogTitle,
  openProviderEdit,
  openModelAddDialog,
  saveEditedProvider
} = useProviderModelConfigDialog({
  selectedProviderSource,
  configSchema,
  buildModelProviderConfig,
  modelAlreadyConfigured,
  loadConfig,
  tm,
  showMessage
})

watch(() => props.defaultTab, (val) => {
  updateDefaultTab(val)
})

watch(selectedProviderType, () => {
  selectedLegacyProvider.value = null
  newProviderOriginalId.value = ''
  updatingMode.value = false
  isLegacyProviderModified.value = false
  suppressLegacyProviderWatch = true
  newSelectedProviderConfig.value = {}
  nextTick(() => {
    suppressLegacyProviderWatch = false
  })
})

watch(newSelectedProviderConfig, (config) => {
  if (suppressLegacyProviderWatch || !selectedLegacyProvider.value) return

  isLegacyProviderModified.value = true
  if (selectedLegacyProvider.value[unsavedLegacyProviderMarker]) {
    Object.assign(
      selectedLegacyProvider.value,
      JSON.parse(JSON.stringify(config))
    )
  }
}, { deep: true })

function getEmptyText() {
  const selectedType = providerTypes.value.find(
    (type) => type.value === selectedProviderType.value
  )
  return tm('providers.empty.typed', {
    type: selectedType?.label || selectedProviderType.value
  })
}

function addLegacyProvider(name) {
  const template = configSchema.value.provider?.config_template?.[name]
  if (!template) {
    showMessage(tm('dialogs.addProvider.noTemplates'), 'error')
    return
  }

  const draft = JSON.parse(JSON.stringify(template))
  const existingIds = new Set([
    ...providers.value.map((provider) => provider.id),
    ...legacyProviderDrafts.value.map((provider) => provider.id)
  ])
  const baseId = String(draft.id || name)
  let nextId = baseId
  let counter = 1
  while (existingIds.has(nextId)) {
    nextId = `${baseId}_${counter}`
    counter += 1
  }
  draft.id = nextId
  draft[unsavedLegacyProviderMarker] = true
  legacyProviderDrafts.value.push(draft)
  selectLegacyProvider(draft)
}

function selectLegacyProvider(provider) {
  selectedLegacyProvider.value = provider
  newProviderOriginalId.value = provider[unsavedLegacyProviderMarker]
    ? ''
    : provider.id
  suppressLegacyProviderWatch = true
  newSelectedProviderConfig.value = {}

  const templates = configSchema.value.provider?.config_template || {}
  let defaultConfig = {}
  for (const key in templates) {
    if (templates[key]?.type === provider.type) {
      defaultConfig = templates[key]
      break
    }
  }

  const mergeConfigWithOrder = (target, source, reference) => {
    if (source && typeof source === 'object' && !Array.isArray(source)) {
      for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          if (typeof source[key] === 'object' && source[key] !== null) {
            target[key] = Array.isArray(source[key]) ? [...source[key]] : { ...source[key] }
          } else {
            target[key] = source[key]
          }
        }
      }
    }

    for (const key in reference) {
      if (typeof reference[key] === 'object' && reference[key] !== null) {
        if (!(key in target)) {
          if (Array.isArray(reference[key])) {
            target[key] = [...reference[key]]
          } else {
            target[key] = {}
          }
        }
        if (!Array.isArray(reference[key])) {
          mergeConfigWithOrder(
            target[key],
            source && source[key] ? source[key] : {},
            reference[key]
          )
        }
      } else if (!(key in target)) {
        target[key] = reference[key]
      }
    }
  }

  if (defaultConfig) {
    mergeConfigWithOrder(newSelectedProviderConfig.value, provider, defaultConfig)
  }
  if (provider.type === 'system_one_decision') {
    delete newSelectedProviderConfig.value.probability_tolerance
  }

  updatingMode.value = !provider[unsavedLegacyProviderMarker]
  isLegacyProviderModified.value = Boolean(provider[unsavedLegacyProviderMarker])
  nextTick(() => {
    suppressLegacyProviderWatch = false
  })
}

async function saveLegacyProvider() {
  if (!selectedLegacyProvider.value) return

  loading.value = true
  const wasUpdating = updatingMode.value
  const selectedDraft = selectedLegacyProvider.value
  const savedId = newSelectedProviderConfig.value.id
  try {
    if (wasUpdating) {
      const res = await providerApi.update(
        newProviderOriginalId.value,
        newSelectedProviderConfig.value
      )
      if (res.data.status === 'error') {
        throw new Error(res.data.message || '更新失败!')
      }
      showMessage(res.data.message || '更新成功!')
    } else {
      const res = await providerApi.create(newSelectedProviderConfig.value)
      if (res.data.status === 'error') {
        throw new Error(res.data.message || '添加失败!')
      }
      showMessage(res.data.message || '添加成功!')
      legacyProviderDrafts.value = legacyProviderDrafts.value.filter(
        (provider) => provider !== selectedDraft
      )
    }

    await loadConfig()
    const savedProvider = providers.value.find((provider) => provider.id === savedId)
    if (savedProvider) {
      selectLegacyProvider(savedProvider)
      isLegacyProviderModified.value = false
    }
  } catch (err) {
    showMessage(err.response?.data?.message || err.message, 'error')
  } finally {
    loading.value = false
  }
}

async function deleteLegacyProvider(provider) {
  if (provider[unsavedLegacyProviderMarker]) {
    legacyProviderDrafts.value = legacyProviderDrafts.value.filter(
      (draft) => draft !== provider
    )
    if (selectedLegacyProvider.value === provider) {
      selectedLegacyProvider.value = null
      newSelectedProviderConfig.value = {}
      newProviderOriginalId.value = ''
      updatingMode.value = false
      isLegacyProviderModified.value = false
    }
    return
  }

  const deleted = await deleteProvider(provider)
  if (deleted && selectedLegacyProvider.value?.id === provider.id) {
    selectedLegacyProvider.value = null
    newSelectedProviderConfig.value = {}
    newProviderOriginalId.value = ''
    updatingMode.value = false
    isLegacyProviderModified.value = false
  }
}

function isProviderTesting(providerId) {
  return testingProviders.value.includes(providerId)
}

async function testSingleProvider(provider) {
  if (isProviderTesting(provider.id)) return
  if (provider.enable === false) {
    showMessage('该提供商未被用户启用', 'error')
    return
  }
  await testProvider(provider)
}
</script>

<style scoped>
.provider-page {
  --provider-surface: rgb(var(--v-theme-surface));
  --provider-border: rgba(var(--v-theme-on-surface), 0.08);
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
  overflow: hidden;
  width: 100%;
}

.provider-page > .v-container {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.provider-tabs-scroll {
  flex: 0 0 auto;
  overflow-x: auto;
  padding: 4px 12px 8px;
  scrollbar-width: none;
}

.provider-tabs-scroll::-webkit-scrollbar {
  display: none;
}

.provider-tabs {
  align-items: center;
  display: inline-flex;
  gap: 2px;
  min-width: max-content;
}

.provider-tab {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 8px;
  color: rgba(var(--v-theme-on-surface), 0.58);
  cursor: pointer;
  display: inline-flex;
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  gap: 6px;
  height: 40px;
  padding: 0 12px;
  white-space: nowrap;
}

.provider-tab:hover {
  background: rgba(var(--v-theme-primary), 0.06);
  color: rgb(var(--v-theme-primary));
}

.provider-tab--active {
  background: var(--color-accent-soft);
  color: rgb(var(--v-theme-primary));
}

.provider-tab--active:hover {
  background: rgba(var(--v-theme-primary), 0.18);
  color: rgb(var(--v-theme-primary));
}

.provider-content {
  display: flex;
  flex: 1;
  margin: 0 auto;
  max-width: 1200px;
  min-height: 0;
  padding: 16px 12px 12px;
  width: 100%;
}

.provider-workbench {
  border: 1px solid var(--provider-border);
  border-radius: 16px;
  background: var(--provider-surface);
  display: grid;
  flex: 1;
  grid-template-columns: minmax(220px, 260px) 1px minmax(0, 1fr);
  min-height: 0;
  overflow: hidden;
  width: 100%;
}

/* An empty source list needs no detail pane, on desktop or phone. */
.provider-workbench.is-empty {
  flex: 0 0 auto;
  grid-template-columns: 1fr;
  grid-template-rows: auto;
  min-height: 300px;
}

.provider-workbench.is-empty .provider-workbench__divider,
.provider-workbench.is-empty .provider-workbench__main {
  display: none;
}

.provider-content.is-empty {
  align-items: flex-start;
}

.provider-workbench__sidebar,
.provider-workbench__main {
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.provider-workbench__divider {
  background: var(--provider-border);
}

.provider-workbench__main {
  display: flex;
}

.provider-config-shell {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.provider-config-header {
  background: var(--provider-surface);
  display: flex;
  flex: 0 0 auto;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 14px 18px 10px;
  position: relative;
  z-index: 1;
}

.provider-config-shell > :deep(.v-divider) {
  flex: 0 0 auto;
}

.provider-config-headline {
  min-width: 0;
}

.provider-config-title {
  font-size: 21px;
  line-height: 1.1;
  font-weight: 680;
  letter-spacing: -0.03em;
  overflow-wrap: anywhere;
}

.provider-config-subtitle {
  margin-top: 6px;
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-size: 13px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}

.provider-config-actions {
  flex-shrink: 0;
}

.provider-config-body {
  flex: 1;
  min-height: 0;
  overscroll-behavior: contain;
  overflow-y: auto;
  scrollbar-gutter: stable;
}

.provider-section {
  padding: 16px 18px;
}

.provider-section--models {
  padding-top: 16px;
}

.provider-section--models :deep(.provider-models-list--available) {
  max-height: none;
  overflow: visible;
}

.provider-section-head {
  margin-bottom: 10px;
}

.provider-section-title {
  font-size: 16px;
  font-weight: 650;
  line-height: 1.4;
}

.provider-section--advanced > summary {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  list-style: none;
}

.provider-section--advanced > summary::-webkit-details-marker {
  display: none;
}

.provider-section--advanced:not([open]) > summary {
  margin-bottom: 0;
}

.provider-section--advanced[open] .provider-section-chevron {
  transform: rotate(90deg);
}

.provider-section-content {
  /* Restore Vuetify's inherited box sizing across the native details content boundary. */
  box-sizing: border-box;
}

.provider-empty-state {
  flex: 1;
  min-height: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(var(--v-theme-on-surface), 0.56);
}

@media (max-width: 960px) {
  .provider-workbench {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1px minmax(0, 1fr);
  }

  /* An empty source list already explains itself; the detail pane's duplicate
     "select a provider" state only adds a second, contradictory empty card. */
  .provider-workbench.is-empty {
    grid-template-rows: auto;
    flex: 0 0 auto;
  }

  .provider-content.is-empty {
    align-items: flex-start;
  }

  .provider-workbench.is-empty .provider-workbench__sidebar {
    min-height: 300px;
  }

  .provider-workbench.is-empty .provider-workbench__divider,
  .provider-workbench.is-empty .provider-workbench__main {
    display: none;
  }

  .provider-workbench__divider {
    height: 1px;
  }

  .provider-config-header {
    align-items: center;
    padding: 12px;
  }

  .provider-config-actions :deep(.v-btn) {
    width: 100%;
  }

  .provider-config-actions {
    align-items: stretch !important;
    flex-direction: column;
    width: 100%;
  }

  .provider-section {
    padding: 12px;
  }
}

@media (max-width: 600px) {
  .provider-tabs-scroll {
    overflow: visible;
    padding: 2px 4px 6px;
  }

  /* The back button and options menu stay pinned; only the type strip swipes.
     The trailing fade is the affordance that more types exist off screen. */
  .provider-tabs-scroll :deep(.page-toolbar__content) {
    overflow-x: auto;
    padding-right: 12px;
    scrollbar-width: none;
    mask-image: linear-gradient(to right, #000 0, #000 calc(100% - 18px), transparent 100%);
  }
  .provider-tabs-scroll :deep(.page-toolbar__content)::-webkit-scrollbar { display: none; }

  .provider-tabs {
    min-width: max-content;
  }

  .provider-tab {
    flex-shrink: 0;
    padding-inline: 8px;
    font-size: 12px;
  }

  .provider-workbench {
    border-radius: 12px;
  }

  .provider-config-title {
    font-size: 18px;
  }

  .provider-empty-state {
    min-height: 260px;
    padding: 24px;
  }

  .provider-content { padding: 6px 4px; }
  .provider-section { padding: 10px; }
  .provider-section-title { font-size: 14px; }
}
</style>

<style scoped src="@/styles/config-form.css"></style>
