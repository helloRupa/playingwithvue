import { BasicIndex, createCollection } from '@tanstack/vue-db'
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
    defaultIndexType: BasicIndex,
    queryKey: [QUERY_KEYS.items],
    queryClient,
    queryFn: async (): Promise<Item[]> => {
      const response = await fetch(BASE_API_URL)

      if (!response.ok) {
        throw new Error('fetch failed')
      }

      const cachedData = queryClient.getQueryData<Item[]>([QUERY_KEYS.items]) || []
      const fetchedData = await response.json()

      if (!cachedData.length || !fetchedData.length) {
        return cachedData.length ? cachedData : fetchedData
      }

      const mergedData = [...cachedData, ...fetchedData]
      mergedData.sort(
        (a: Item, b: Item) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      )
      const itemMap = new Map()
      let index = mergedData.length - 1

      while (index > -1) {
        const item = mergedData[index]
        const itemInMap = itemMap.get(item.id)

        if (itemInMap) {
          mergedData.splice(index, 1)
        } else {
          itemInMap.set(item.id, item)
        }

        --index
      }

      return mergedData
    },
    getKey: (item: Item) => item.id,
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

itemsCollection.createIndex((row) => row.updatedAt)
