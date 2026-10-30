<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>

<template>
  <div class="plugin-workspace">
    <RouterView v-slot="{ Component, route: childRoute }">
      <component :is="Component" :key="String(childRoute.meta.pluginView || childRoute.meta.extensionTab || childRoute.name)" />
    </RouterView>
  </div>
</template>

<style scoped>
.plugin-workspace { min-width: 0; width: 100%; }
</style>
