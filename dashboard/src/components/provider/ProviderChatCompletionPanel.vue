<template>
  <div class="provider-chat-panel">
    <div
      class="provider-workbench"
      :inert="connection.busy || savingSource || loadingModels || undefined"
      :class="{ 'provider-workbench--borderless': !props.showBorder }"
    >
      <div class="provider-workbench__sidebar">
        <ProviderSourcesPanel
          :displayed-provider-sources="displayedProviderSources"
          :selected-provider-source="selectedProviderSource"
          :available-source-types="availableSourceTypes"
          :tm="tm"
          :resolve-source-icon="resolveSourceIcon"
          :is-monochrome-source-icon="isMonochromeSourceIcon"
          :get-source-display-name="getSourceDisplayName"
          @add-provider-source="addProviderSource"
          @select-provider-source="selectProviderSource"
          @delete-provider-source="deleteProviderSource"
        />
      </div>

      <div class="provider-workbench__divider"></div>

      <div class="provider-workbench__main">
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
                :key-link="selectedProviderSource.provider === 'ssycloud' ? 'https://www.shengsuanyun.com/?from=CH_T70U2X9L' : undefined"
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
                :saving-providers="savingProviderToggles"
                :testing-providers="testingProviders"
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
      </div>
    </div>

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
import { ref } from 'vue'
import { useModuleI18n } from '@/i18n/composables'
import AstrBotConfig from '@/components/shared/AstrBotConfig.vue'
import ProviderModelsPanel from '@/components/provider/ProviderModelsPanel.vue'
import ProviderConnectionForm from '@/components/provider/ProviderConnectionForm.vue'
import ProviderSourceSubtitle from '@/components/provider/ProviderSourceSubtitle.vue'
import ProviderSourcesPanel from '@/components/provider/ProviderSourcesPanel.vue'
import { useProviderModelConfigDialog } from '@/composables/useProviderModelConfigDialog'
import { useProviderSources } from '@/composables/useProviderSources'

const props = defineProps({
  showBorder: {
    type: Boolean,
    default: true
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
  selectedProviderSource,
  selectedSponsor,
  availableModels,
  loadingModels,
  savingSource,
  savingProviderToggles,
  testingProviders,
  isSourceModified,
  configSchema,
  providerSourceSchema,
  modelSearch,
  availableSourceTypes,
  displayedProviderSources,
  filteredMergedModelEntries,
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
  selectProviderSource,
  addProviderSource,
  deleteProviderSource,
  fetchAvailableModels,
  buildModelProviderConfig,
  deleteProvider,
  testProvider,
  toggleProviderEnable,
  loadConfig,
  modelAlreadyConfigured
} = useProviderSources({
  defaultTab: 'chat_completion',
  tm,
  showMessage
})

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

</script>

<style scoped>
.provider-chat-panel {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.provider-workbench {
  flex: 1;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 24px;
  background: rgb(var(--v-theme-surface));
  display: grid;
  grid-template-columns: minmax(220px, 260px) 1px minmax(0, 1fr);
  min-height: 0;
  overflow: hidden;
}

.provider-workbench--borderless {
  border: 0;
  border-radius: 0;
  background: transparent;
}

.provider-workbench__sidebar,
.provider-workbench__main {
  min-width: 0;
  min-height: 0;
}

.provider-workbench__sidebar,
.provider-workbench__main,
.provider-workbench__divider {
  height: 100%;
}

.provider-workbench__divider {
  background: rgba(var(--v-theme-on-surface), 0.08);
}

.provider-workbench__main {
  display: flex;
  overflow: hidden;
}

.provider-config-shell {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.provider-config-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 14px 18px 10px;
}

.provider-config-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.provider-section {
  padding: 16px 18px;
}

.provider-section--models {
  padding-top: 16px;
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

  .provider-workbench__sidebar,
  .provider-workbench__main,
  .provider-workbench__divider {
    height: auto;
  }

  .provider-workbench__divider {
    min-height: 1px;
  }

  .provider-config-header {
    align-items: center;
    gap: 8px;
    padding: 12px;
  }

  .provider-section {
    padding: 12px;
  }
}

@media (max-width: 600px) {
  .provider-workbench {
    border-radius: 16px;
  }

  .provider-workbench--borderless {
    border-radius: 0;
  }

  .provider-empty-state {
    min-height: 260px;
    padding: 24px;
  }
}
</style>

<style scoped src="@/styles/config-form.css"></style>
