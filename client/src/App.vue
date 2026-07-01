<script setup lang="ts">
import { useLiveQuery } from '@tanstack/vue-db'
import { itemsCollection } from './db/db'

const { data: items, isLoading } = useLiveQuery((q) =>
  q.from({ item: itemsCollection }).select(({ item }) => ({
    id: item.id,
    name: item.name,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  })),
)
</script>

<template>
  <h1>Items</h1>
  <div v-if="isLoading">Loading...</div>
  <ul v-if="items.length > 0">
    <li v-for="item in items" :key="item.id">
      {{ item.name }}
    </li>
  </ul>
</template>

<style scoped></style>
