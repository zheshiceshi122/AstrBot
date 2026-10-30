<template>
  <section class="connection-form" :aria-label="tm('connection.title')">
    <div class="connection-fields">
      <v-text-field
        v-model="source.id"
        :label="tm('providerSources.fields.name')"
        variant="outlined"
        density="compact"
        hide-details="auto"
        autocomplete="off"
      />
      <v-text-field
        v-model="source.api_base"
        :label="tm('providerSources.fields.baseUrl')"
        variant="outlined"
        density="compact"
        hide-details="auto"
        autocomplete="off"
        spellcheck="false"
      />
      <div class="connection-key">
        <ListConfigItem
          v-model="source.key"
          :label="tm('providerSources.fields.apiKey')"
          secret
          prefer-single-item
        />
        <a
          v-if="keyLink"
          :href="keyLink"
          target="_blank"
          rel="noopener noreferrer"
          >{{ tm("providerSources.getApiKey") }}</a
        >
      </div>
      <div class="connection-model">
        <v-combobox
          v-model="connection.model"
          :items="modelOptions"
          :label="tm('connection.model')"
          :aria-label="tm('connection.model')"
          :placeholder="tm('connection.modelPlaceholder')"
          :hint="tm('connection.modelHint')"
          persistent-hint
          :return-object="false"
          variant="outlined"
          density="compact"
          hide-details="auto"
          :clearable="Boolean(connection.model)"
          autocomplete="off"
        />
        <v-btn
          prepend-icon="mdi-refresh"
          variant="tonal"
          height="36"
          :aria-label="
            modified
              ? tm('providerSources.saveAndFetchModels')
              : tm('providerSources.fetchModels')
          "
          :title="
            modified
              ? tm('providerSources.saveAndFetchModels')
              : tm('providerSources.fetchModels')
          "
          :loading="loadingModels"
          :disabled="savingSource"
          @click="$emit('fetch-models')"
          >{{
            modified
              ? tm("providerSources.saveAndFetchModels")
              : tm("providerSources.fetchModels")
          }}</v-btn
        >
      </div>
      <v-select
        v-model="connection.profileId"
        :items="profileOptions"
        :label="tm('connection.applyTo')"
        :aria-label="tm('connection.applyTo')"
        :hint="
          connection.profileError
            ? tm('connection.profilesError')
            : tm('connection.profileHint')
        "
        persistent-hint
        :disabled="
          !connection.model ||
          connection.profilesLoading ||
          connection.profileError
        "
        :loading="connection.profilesLoading"
        variant="outlined"
        density="compact"
        hide-details="auto"
      />
      <v-btn
        v-if="connection.profileError"
        variant="text"
        @click="$emit('reload-profiles')"
      >
        {{ tm("connection.reloadProfiles") }}
      </v-btn>
    </div>
    <div class="connection-actions">
      <span v-if="modified" class="connection-unsaved">{{
        tm("connection.unsaved")
      }}</span>      <v-btn
        color="primary"
        variant="tonal"
        :loading="connection.busy || savingSource"
        :disabled="
          loadingModels ||
          !source.id?.trim() ||
          (!modified && !connection.model)
        "
        @click="$emit('save')"
      >
        {{
          connection.model
            ? connection.profileId
              ? tm("connection.saveAndUse")
              : tm("connection.saveModel")
            : tm("providerSources.save")
        }}
      </v-btn>
    </div>
    <p
      v-if="connection.result"
      class="connection-result"
      :class="{ 'connection-result--error': connection.failed }"
      :role="connection.failed ? 'alert' : 'status'"
    >
      {{ connection.result }}
    </p>
  </section>
</template>

<script setup>
import { computed } from "vue";
import ListConfigItem from "@/components/shared/ListConfigItem.vue";

const props = defineProps({
  source: { type: Object, required: true },
  connection: { type: Object, required: true },
  availableModels: { type: Array, default: () => [] },
  configuredModels: { type: Array, default: () => [] },
  loadingModels: Boolean,
  savingSource: Boolean,
  modified: Boolean,
  keyLink: String,
  tm: { type: Function, required: true },
});

defineEmits(["save", "fetch-models", "reload-profiles"]);

const modelOptions = computed(() => [
  ...new Set(
    [
      ...props.configuredModels.map((provider) => provider.model),
      ...props.availableModels.map((model) =>
        typeof model === "string" ? model : model.name,
      ),
    ].filter(Boolean),
  ),
]);

const profileOptions = computed(() => [
  { title: props.tm("connection.saveOnly"), value: "" },
  ...props.connection.profiles.map((profile) => ({
    title: profile.name || profile.id,
    value: profile.id,
  })),
]);
</script>

<style scoped>
.connection-form {
  min-width: 0;
  container-type: inline-size;
}
.connection-fields {
  display: grid;
  gap: 16px;
}
.connection-key {
  min-width: 0;
}
.connection-key :deep(.v-btn) {
  min-height: 44px;
}
.connection-model {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: 8px;
}
.connection-model > .v-btn {
  justify-self: end;
}
.connection-fields :deep(.v-messages) {
  font-size: 13px;
  line-height: 1.5;
  opacity: 1;
  color: rgba(var(--v-theme-on-surface), 0.75);
}
.connection-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}
.connection-actions > .v-btn {
  min-height: 44px;
}
.connection-unsaved {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin-right: auto;
}
.connection-result {
  margin: 12px 0 0;
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.connection-result--error {
  color: rgb(var(--v-theme-error));
}
@container (min-width: 640px) {
  .connection-fields {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .connection-key,
  .connection-model,
  .connection-fields > .v-select {
    grid-column: 1 / -1;
  }
  .connection-model {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    gap: 12px;
  }
  .connection-model > .v-btn {
    min-height: 40px;
  }
}
@media (max-width: 600px) {
  .connection-fields :deep(input) {
    font-size: 16px;
  }
  .connection-actions > .v-btn {
    flex: 1;
  }
}
@media (max-width: 600px) {
  .connection-fields { gap: 10px; }
  .connection-fields :deep(.v-messages) { font-size: 12px; line-height: 1.4; }
  .connection-key :deep(.v-btn), .connection-actions > .v-btn { min-height: 32px; }
  .connection-model { grid-template-columns: minmax(0, 1fr) auto; gap: 6px; }
  .connection-model > .v-btn { align-self: start; margin-top: 2px; padding-inline: 8px; }
  .connection-actions { justify-content: stretch; margin-top: 10px; gap: 6px; }
  .connection-actions > .v-btn { flex: 1 1 auto; }
}
</style>
