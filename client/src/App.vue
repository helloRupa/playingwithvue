<template>
  <div>
    <span class="status" :class="statusStore.networkStatus.toLowerCase()"></span>
    {{ statusStore.networkStatus }}
    <span v-if="statusStore.isReconnecting" class="blink">Reconnecting</span>
  </div>
  <h1>Items</h1>
  <form @submit.prevent="handleSubmit">
    <label for="item-id">ID: </label>
    <input id="item-id" type="number" v-model="itemId" />
    <label for="item-name">Name: </label>
    <input id="item-name" type="text" v-model="itemName" />

    <button type="submit">Submit</button>
    <div v-if="hasFormError">
      {{ errorMessage }}
    </div>
  </form>
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
import { onUnmounted, ref } from 'vue'
import { useStatusStore } from './stores/statusStore'
import { itemSchema } from './schemas/itemForm'
// import { POST_PATCH_API_URL } from './constants/api'

const { data: items, isLoading } = useLiveQuery((q) =>
  q.from({ item: itemsCollection }).select(({ item }) => ({
    id: item.id,
    name: item.name,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  })),
)

const statusStore = useStatusStore()
const itemName = ref<string>('')
const itemId = ref<null | string>(null)
const hasFormError = ref(false)
const errorMessage = ref('')

async function handleSubmit() {
  const result = itemSchema.safeParse({ id: itemId.value, name: itemName.value })

  if (!result.success) {
    hasFormError.value = true
    errorMessage.value = result.error.issues.map((issue) => issue.message).join(', ')

    return
  }

  hasFormError.value = false

  if (itemId.value) {
    const id = parseInt(itemId.value, 10)
    if (itemsCollection.has(id)) {
      const transaction = itemsCollection.update(itemId.value, (draft) => {
        draft.name = itemName.value
      })

      try {
        await transaction.isPersisted.promise
        itemId.value = null
        itemName.value = ''
      } catch (error) {
        hasFormError.value = true
        errorMessage.value = `Failed to update ${itemId.value}`
        console.log(error)
      }
    } else {
      hasFormError.value = true
      errorMessage.value = `${itemId.value} is not an existing item ID`
    }

    return
  }

  const transaction = itemsCollection.insert({
    id: Date.now() + Math.random(),
    name: itemName.value,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  try {
    await transaction.isPersisted.promise
    itemId.value = null
    itemName.value = ''
  } catch (error) {
    hasFormError.value = true
    errorMessage.value = `Failed to post ${itemName.value}`
    console.log(error)
  }
}

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
