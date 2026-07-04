<template>
  <div>
    <span class="status" :class="statusStore.networkStatus.toLowerCase()"></span>
    {{ statusStore.networkStatus }}
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
import { closeWebSocket } from './db/ws'
import { onUnmounted } from 'vue'
import { useDataTrackerStore } from './stores/dataTracker'
import { useStatusStore } from './stores/statusStore'

const { data: items, isLoading } = useLiveQuery((q) =>
  q.from({ item: itemsCollection }).select(({ item }) => ({
    id: item.id,
    name: item.name,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  })),
)

const dataTrackerStore = useDataTrackerStore()
const itemsCollectionCleanup = itemsCollection.subscribeChanges(
  (changes) => {
    changes.forEach((change) => {
      if (
        !dataTrackerStore.lastUpdatedRecordDate ||
        new Date(change.value.updatedAt).getTime() >
          new Date(dataTrackerStore.lastUpdatedRecordDate).getTime()
      ) {
        dataTrackerStore.setLastUpdatedRecordDate(change.value.updatedAt)
      }
    })
  },
  { includeInitialState: true },
)

const statusStore = useStatusStore()

onUnmounted(() => {
  itemsCollectionCleanup.unsubscribe()
  closeWebSocket()
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
</style>
