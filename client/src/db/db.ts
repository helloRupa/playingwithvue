import { createCollection } from '@tanstack/vue-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { QueryClient } from '@tanstack/query-core'

export interface Item {
  id: number
  name: string
  createdAt: string
  updatedAt: string
}

export const itemsCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['items'],
    queryClient: new QueryClient(),
    queryFn: async (): Promise<Item[]> => {
      const response = await fetch('http://localhost:8000/items')

      if (!response.ok) {
        throw new Error('fetch failed')
      }

      return response.json()
    },
    getKey: (item: Item) => item.id,
  }),
)
