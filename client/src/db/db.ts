import { BasicIndex, createCollection } from '@tanstack/vue-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { QueryClient } from '@tanstack/query-core'
import { BASE_API_URL, POST_PATCH_API_URL } from '@/constants/api'
import { QUERY_KEYS } from '@/constants/query-keys'

export interface Item {
  id: number
  name: string
  createdAt: string
  updatedAt: string
}

export const queryClient = new QueryClient()

export const itemsCollection = createCollection(
  queryCollectionOptions({
    defaultIndexType: BasicIndex,
    queryKey: [QUERY_KEYS.items],
    queryClient,
    queryFn: async (): Promise<Item[]> => {
      const response = await fetch(BASE_API_URL)

      if (!response.ok) {
        throw new Error('fetch failed')
      }

      const fetchedData: Item[] = await response.json()
      const mergedMap = new Map<number, Item>(itemsCollection.state)

      fetchedData.forEach((fetchedItem) => {
        const existingItem = mergedMap.get(fetchedItem.id)

        if (!existingItem || new Date(fetchedItem.updatedAt) > new Date(existingItem.updatedAt)) {
          mergedMap.set(fetchedItem.id, fetchedItem)
        }
      })

      return Array.from(mergedMap.values(), ({ id, name, createdAt, updatedAt }) => ({
        id,
        name,
        createdAt,
        updatedAt,
      }))
    },
    getKey: (item: Item) => item.id,
    onUpdate: async ({ transaction }) => {
      const { id, name } = transaction.mutations[0].modified

      const response = await fetch(POST_PATCH_API_URL, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name }),
      })

      if (!response.ok) {
        throw new Error('patch failed')
      }

      const { name: confirmedName, createdAt, updatedAt } = await response.json()
      updateItemInCollection({ id, name: confirmedName, createdAt, updatedAt })
    },
    onInsert: async ({ transaction }) => {
      const { name: temporaryName } = transaction.mutations[0].modified

      const response = await fetch(POST_PATCH_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: temporaryName }),
      })

      if (!response.ok) {
        throw new Error('post failed')
      }

      const { id, name, createdAt, updatedAt } = await response.json()

      addItemToCollection({ id, name, createdAt, updatedAt })

      return { refetch: false }
    },
  }),
)

export function addItemToCollection({ id, name, createdAt, updatedAt }: Item) {
  itemsCollection.utils.writeInsert({ id, name, createdAt, updatedAt })
}

export function updateItemInCollection({ id, name, createdAt, updatedAt }: Item) {
  const record = itemsCollection.get(id)

  if (!record) {
    itemsCollection.utils.writeInsert({ id, name, createdAt, updatedAt })
    return
  }

  if (new Date(record.updatedAt) > new Date(updatedAt)) {
    return
  }

  itemsCollection.utils.writeUpsert({
    ...record,
    name,
    updatedAt,
  })
}

export function fetchMissedUpdates() {
  itemsCollection.utils.refetch().catch((error) => {
    console.error('Failed to fetch missed updates: ', error)
  })
}

itemsCollection.createIndex((row) => row.updatedAt)
