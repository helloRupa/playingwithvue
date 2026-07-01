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
import { onUnmounted } from 'vue'

const { data: items, isLoading } = useLiveQuery((q) =>
  q.from({ item: itemsCollection }).select(({ item }) => ({
    id: item.id,
    name: item.name,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  })),
)

onUnmounted(() => {
  ws.close()
})
</script>

<style scoped></style>
