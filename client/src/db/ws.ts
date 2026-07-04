import { WEBSOCKETS_URL } from '@/constants/api'
import { addItemToCollection, fetchMissedUpdates, updateItemInCollection } from './db'
import { STATES, useStatusStore } from '@/stores/statusStore'

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

interface Pong {
  action: 'pong'
}

const ws = new WebSocket(WEBSOCKETS_URL)

export function closeWebSocket() {
  ws.close()
}

let pingsInProcess = 0
let heartbeatInterval: number | undefined
function heartbeat() {
  heartbeatInterval = setInterval(() => {
    if (pingsInProcess >= 3) {
      clearInterval(heartbeatInterval)
      closeWebSocket()
      return
    }

    ++pingsInProcess

    if (pingsInProcess > 1) {
      const statusStore = useStatusStore()
      statusStore.setIsConnected(STATES.UNSTABLE)
    }

    ws.send(JSON.stringify({ action: 'ping' }))
  }, 10_000)
}

ws.onopen = () => {
  console.log('WebSocket Connected')
  const statusStore = useStatusStore()
  statusStore.setIsConnected(STATES.CONNECTED)
  pingsInProcess = 0
  heartbeat()
}
ws.onmessage = (event: MessageEvent) => {
  if (shouldSkipWSChanges()) {
    return
  }

  const message: ItemAddedMessage | ItemUpdatedMessage | Pong = JSON.parse(event.data)
  console.log('Received:', message)

  const { action } = message
  const {
    item_id: id,
    createdAt,
    updatedAt,
  } = message as Partial<ItemAddedMessage & ItemUpdatedMessage>
  switch (action) {
    case 'item_added':
      const { name } = message
      addItemToCollection({ id, name, createdAt, updatedAt })
      break
    case 'item_updated':
      const { changed } = message
      updateItemInCollection({ id, name: changed.name, createdAt, updatedAt })
      break
    case 'pong':
      if (pingsInProcess > 1) {
        fetchMissedUpdates()
      }

      pingsInProcess = 0
      const statusStore = useStatusStore()
      statusStore.setIsConnected(STATES.CONNECTED)
      break
  }
}
ws.onerror = (error: Event) => console.error('Error:', error)
ws.onclose = () => {
  clearInterval(heartbeatInterval)
  console.log('Disconnected')
  const statusStore = useStatusStore()
  statusStore.setIsConnected(STATES.DISCONNECTED)
}

function shouldSkipWSChanges() {
  return sessionStorage.getItem('disablePongs') === '1'
}
