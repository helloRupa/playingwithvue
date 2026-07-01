import { WEBSOCKETS_URL } from '@/constants/api'
import { addItemToCollection, updateItemInCollection } from './db'

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

export const ws = new WebSocket(WEBSOCKETS_URL)
ws.onopen = () => console.log('Connected')
ws.onmessage = (event) => {
  const message: ItemAddedMessage | ItemUpdatedMessage = JSON.parse(event.data)
  console.log('Received:', message)

  const { item_id: id, createdAt, updatedAt } = message
  switch (message.action) {
    case 'item_added':
      const { name } = message
      addItemToCollection({ id, name, createdAt, updatedAt })
      break
    case 'item_updated':
      const { changed } = message
      updateItemInCollection({ id, name: changed.name, createdAt, updatedAt })
      break
  }
}
ws.onerror = (error) => console.error('Error:', error)
ws.onclose = () => console.log('Disconnected')
