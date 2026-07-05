<template>
  <div>
    <span class="status" :class="statusStore.networkStatus.toLowerCase()"></span>
    {{ statusStore.networkStatus }}
    <span v-if="statusStore.isReconnecting" class="blink">Reconnecting</span>
  </div>
  <h1>Items</h1>
  <div v-if="isLoading">Loading...</div>
  <div v-if="itemsCollection.utils.isError">Something went wrong!</div>
  <ul v-if="items.length > 0">
    <li v-for="item in items" :key="item.id">{{ item.id }}: {{ item.name }}</li>
  </ul>
</template>

<script setup lang="ts">
import { useLiveQuery } from '@tanstack/vue-db'
import { itemsCollection } from './db/db'
import { socketConnection } from './db/ws'
import { onUnmounted } from 'vue'
import { useStatusStore } from './stores/statusStore'

const { data: items, isLoading } = useLiveQuery((q) =>
  q.from({ item: itemsCollection }).select(({ item }) => ({
    id: item.id,
    name: item.name,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  })),
)

const statusStore = useStatusStore()

onUnmounted(() => {
  socketConnection.close()
})
</script>

<style scoped>
.status {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: yellow;
  margin-right: 5px;

  &.connected {
    background-color: green;
  }

  &.unstable {
    background-color: orange;
  }

  &.disconnected {
    background-color: red;
  }
}

.blink {
  animation: blinker 1s linear infinite;
}

@keyframes blinker {
  50% {
    opacity: 0;
  }
}
</style>
