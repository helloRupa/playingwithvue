import { type Item } from './db'
import { queryClient } from './db'

interface ItemAddedMessage {
  action: 'item_added'
  item_id: number
  name: string
  createdAt: string
  updatedAt: string
}

interface ItemUpdatedMessage {
  action: 'item_updated'
  item_id: number
  createdAt: string
  updatedAt: string
  changed: { name: string }
  previous: { name: string }
}

export const ws = new WebSocket('ws://localhost:8000')
ws.onopen = () => console.log('Connected')
ws.onmessage = (event) => {
  const message: ItemAddedMessage | ItemUpdatedMessage = JSON.parse(event.data)
  console.log('Received:', message)

  switch (message.action) {
    case 'item_added':
      queryClient.setQueryData(['items'], (old: Item[] = []) => {
        if (old.findIndex((item: Item) => item.id === message.item_id) !== -1) {
          return old
        }

        return addItem(old, message)
      })
      break
    case 'item_updated':
      queryClient.setQueryData(['items'], (old: Item[] = []) => {
        const recordIndexFound = old.findIndex((item: Item) => item.id === message.item_id)
        if (recordIndexFound === -1) {
          return addItem(old, {
            action: 'item_added',
            item_id: message.item_id,
            name: message.changed.name,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
          })
        }

        const record: Item = old[recordIndexFound]!

        if (new Date(record.updatedAt) > new Date(message.updatedAt)) {
          return old
        }

        old[recordIndexFound] = {
          ...record,
          name: message.changed.name,
          updatedAt: message.updatedAt,
        }

        return old
      })
      break
  }
}
ws.onerror = (error) => console.error('Error:', error)
ws.onclose = () => console.log('Disconnected')

function addItem(old: Item[], message: ItemAddedMessage) {
  return [
    ...old,
    {
      id: message.item_id,
      name: message.name,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    },
  ]
}
