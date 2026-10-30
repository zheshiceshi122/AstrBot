<script setup>
import Chat from '@/components/chat/Chat.vue'
</script>

<template>
    <div id="container">
        <Chat :chatbox-mode="true"></Chat>
    </div>
</template>

<style scoped>
#container {
    width: 100%;
    height: 100%;
    min-height: 0;
}

#container :deep(.chat-main) {
    padding-top: 0;
}
</style>
