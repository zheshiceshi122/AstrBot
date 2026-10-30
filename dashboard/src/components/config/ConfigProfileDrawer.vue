<script setup>
import { computed } from 'vue';
import { useModuleI18n } from '@/i18n/composables';
import ConfigPage from '@/views/ConfigPage.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  configId: {
    type: String,
    default: '',
  },
});
const emit = defineEmits(['update:modelValue']);

const { tm } = useModuleI18n('core/shared');

const open = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

function close() {
  open.value = false;
}
</script>

<template>
  <v-dialog
    v-model="open"
    class="config-profile-drawer-overlay"
    scrollable
    transition="slide-x-reverse-transition"
    :scrim="true"
    @click:outside="close"
  >
    <v-card class="config-profile-drawer-card" elevation="12">
      <div class="config-profile-drawer-header">
        <div>
          <span class="config-profile-drawer-title">{{ tm('configProfileDrawer.title') }}</span>
        </div>
        <v-btn icon variant="text" size="small" :aria-label="tm('configProfileDrawer.close')" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>
      <v-divider />
      <div class="config-profile-drawer-content">
        <ConfigPage v-if="open && configId" :initial-config-id="configId" />
      </div>
    </v-card>
  </v-dialog>
</template>

<style>
.config-profile-drawer-overlay {
  align-items: stretch;
  justify-content: flex-end;
}

.config-profile-drawer-overlay > .v-overlay__content {
  width: clamp(320px, 60vw, 820px);
  height: calc(var(--astrbot-overlay-height, 100dvh) - 32px);
  max-height: calc(var(--astrbot-overlay-height, 100dvh) - 32px);
  margin: 16px;
}

.config-profile-drawer-card {
  display: flex;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
}

.config-profile-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px 4px 20px;
}

.config-profile-drawer-title {
  font-size: 18px;
  font-weight: 600;
  line-height: 26px;
}

.config-profile-drawer-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 16px 16px 24px;
}

@media (max-width: 600px) {
  .config-profile-drawer-overlay > .v-overlay__content {
    width: calc(100% - 16px);
    height: calc(var(--astrbot-overlay-height, 100dvh) - 16px);
  }

  .config-profile-drawer-header { padding-left: 12px; }
  .config-profile-drawer-title { font-size: 16px; }
  .config-profile-drawer-content { padding: 8px; }
}
</style>
