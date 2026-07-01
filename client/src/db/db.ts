import { createCollection } from '@tanstack/vue-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { QueryClient } from '@tanstack/query-core'
import { BASE_API_URL } from '@/constants/api'
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
    queryKey: [QUERY_KEYS.items],
    queryClient,
    queryFn: async (): Promise<Item[]> => {
      const response = await fetch(BASE_API_URL)

      if (!response.ok) {
        throw new Error('fetch failed')
      }

      return response.json()
    },
    getKey: (item: Item) => item.id,
  }),
)

function addItem(old: Item[], { id, name, createdAt, updatedAt }: Item) {
  return [
    ...old,
    {
      id,
      name,
      createdAt,
      updatedAt,
    },
  ]
}

export function addItemToCollection({ id, name, createdAt, updatedAt }: Item) {
  queryClient.setQueryData([QUERY_KEYS.items], (old: Item[] = []) => {
    if (old.findIndex((item: Item) => item.id === id) !== -1) {
      return old
    }

    return addItem(old, { id, name, createdAt, updatedAt })
  })
}

export function updateItemInCollection({ id, name, createdAt, updatedAt }: Item) {
  queryClient.setQueryData([QUERY_KEYS.items], (old: Item[] = []) => {
    const recordIndexFound = old.findIndex((item: Item) => item.id === id)
    if (recordIndexFound === -1) {
      return addItem(old, {
        id,
        name,
        createdAt,
        updatedAt,
      })
    }

    const record: Item = old[recordIndexFound]!

    if (new Date(record.updatedAt) > new Date(updatedAt)) {
      return old
    }

    old[recordIndexFound] = {
      ...record,
      name,
      updatedAt,
    }

    return old
  })
}
