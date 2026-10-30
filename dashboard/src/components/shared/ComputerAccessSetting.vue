<script setup lang="ts">
import { onMounted, ref } from "vue";
import { configProfileApi, type OpenConfig } from "@/api/v1";
import { useI18n, useModuleI18n } from "@/i18n/composables";

const { t } = useI18n();
const { tm } = useModuleI18n("features/welcome");
const runtime = ref("none");
const enabled = ref(false);
const loading = ref(true);
const saving = ref(false);
const loadFailed = ref(false);
const error = ref("");
const result = ref("");
type ComputerAccessProfile = OpenConfig & {
  provider_settings?: { computer_use_runtime?: string };
};

async function load() {
  loading.value = true;
  loadFailed.value = false;
  error.value = "";
  try {
    const response = await configProfileApi.get("default");
    const config = response.data.data?.config as
      | ComputerAccessProfile
      | undefined;
    if (response.data.status !== "ok" || !config)
      throw new Error(
        response.data.message || tm("onboard.computerAccessUpdateFailed"),
      );
    runtime.value = config.provider_settings?.computer_use_runtime || "none";
    enabled.value = runtime.value !== "none";
  } catch (err: any) {
    loadFailed.value = true;
    error.value = err?.response?.data?.message || err.message;
  } finally {
    loading.value = false;
  }
}

async function save(value: boolean) {
  if (loading.value || saving.value || loadFailed.value) return;
  saving.value = true;
  result.value = "";
  error.value = "";
  try {
    // Fetch the latest profile so unrelated changes are not overwritten by a stale form.
    const response = await configProfileApi.get("default");
    const config = response.data.data?.config as
      | ComputerAccessProfile
      | undefined;
    if (response.data.status !== "ok" || !config)
      throw new Error(
        response.data.message || tm("onboard.computerAccessUpdateFailed"),
      );
    config.provider_settings ??= {};
    config.provider_settings.computer_use_runtime = value ? "local" : "none";
    const updated = await configProfileApi.update("default", config);
    if (updated.data.status !== "ok")
      throw new Error(
        updated.data.message || tm("onboard.computerAccessUpdateFailed"),
      );
    runtime.value = value ? "local" : "none";
    result.value = tm(
      value ? "onboard.computerAccessAllowed" : "onboard.computerAccessDenied",
    );
  } catch (err: any) {
    enabled.value = runtime.value !== "none";
    error.value = err?.response?.data?.message || err.message;
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>

<template>
  <section
    class="computer-access-setting"
    :aria-label="tm('onboard.step3Title')"
  >
    <div class="computer-access-setting__row">
      <div>
        <h2>{{ tm("onboard.step3Title") }}</h2>
        <p>{{ t("core.navigation.computerAccessScope") }}</p>
      </div>
      <v-switch
        v-model="enabled"
        :aria-label="tm('onboard.step3Title')"
        color="primary"
        hide-details
        :loading="loading || saving"
        :disabled="loading || saving || loadFailed"
        @update:model-value="save(Boolean($event))"
      />
    </div>
    <p>{{ tm("onboard.step3HelpItem1") }}</p>
    <p>{{ tm("onboard.step3HelpItem2") }}</p>
    <p v-if="runtime === 'sandbox'">
      {{ t("core.navigation.computerAccessSandbox") }}
    </p>
    <RouterLink to="/config">{{ tm("onboard.step3HelpItem3") }}</RouterLink>
    <p v-if="error" role="alert" class="text-error">{{ error }}</p>
    <v-btn v-if="loadFailed" variant="text" @click="load">{{
      t("core.navigation.retry")
    }}</v-btn>
    <p v-if="result" role="status">{{ result }}</p>
  </section>
</template>

<style scoped>
.computer-access-setting {
  padding: 14px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 12px;
}
.computer-access-setting__row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.computer-access-setting__row > div {
  flex: 1;
  min-width: 0;
}
.computer-access-setting__row :deep(.v-switch) {
  flex: 0 0 auto;
}
h2 {
  font-size: 14px;
  line-height: 1.5;
}
p,
a {
  font-size: 13px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}
p {
  margin: 5px 0;
  color: rgba(var(--v-theme-on-surface), 0.75);
}
a {
  display: inline-block;
  padding-block: 8px;
  color: rgb(var(--v-theme-primary));
}
@media (max-width: 600px) {
  .computer-access-setting { padding: 8px 10px; border-radius: 9px; }
  .computer-access-setting__row { gap: 8px; }
  h2 { font-size: 13px; }
  p, a { font-size: 12px; line-height: 1.45; }
  p { margin-block: 4px; }
  a { padding-block: 3px; }
}
</style>
