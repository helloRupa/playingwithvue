<template>
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
import { ws } from './db/ws'
import { onUnmounted, watch } from 'vue'
import { useDataTrackerStore } from './stores/dataTracker'

const { data: items, isLoading } = useLiveQuery((q) =>
  q.from({ item: itemsCollection }).select(({ item }) => ({
    id: item.id,
    name: item.name,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  })),
)

const dataTrackerStore = useDataTrackerStore()
const { data: lastUpdatedRecord } = useLiveQuery((q) =>
  q
    .from({ item: itemsCollection })
    .orderBy(({ item }) => item.updatedAt, 'desc')
    .limit(1)
    .select(({ item }) => ({
      updatedAt: item.updatedAt,
    })),
)

watch(lastUpdatedRecord.value, () => {
  const latestDate = lastUpdatedRecord.value[0]?.updatedAt

  if (latestDate) {
    console.log(latestDate)
    dataTrackerStore.setLastUpdatedRecordDate(latestDate)
  }
})

onUnmounted(() => {
  ws.close()
})
</script>

<style scoped></style>
