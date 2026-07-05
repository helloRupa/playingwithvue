import {
  HEARTBEAT_INTERVAL,
  INVALID_WEBSOCKETS_URL,
  RETRY_MAX_MS,
  RETRY_START_MS,
  WEBSOCKETS_URL,
} from '@/constants/api'
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

function shouldSkipWSChanges() {
  return sessionStorage.getItem('disablePongs') === '1'
}

function createReconnectingSocket() {
  let ws: WebSocket
  let shouldReconnect = true
  let retryDelay = RETRY_START_MS
  let retryTimeout: number | undefined
  let heartbeatInterval: number | undefined
  let pingsInProcess = 0

  function startHeartbeat() {
    heartbeatInterval = setInterval(() => {
      if (pingsInProcess >= 3) {
        clearInterval(heartbeatInterval)
        ws.close()
        return
      }

      ++pingsInProcess

      if (pingsInProcess > 1) {
        const statusStore = useStatusStore()
        statusStore.setConnectionStatus(STATES.UNSTABLE)
      }

      ws.send(JSON.stringify({ action: 'ping' }))
    }, HEARTBEAT_INTERVAL)
  }

  function handleMessage(message: ItemAddedMessage | ItemUpdatedMessage | Pong) {
    console.log('Received:', message)

    const { action } = message
    switch (action) {
      case 'item_added': {
        const { item_id: id, name, createdAt, updatedAt } = message
        addItemToCollection({ id, name, createdAt, updatedAt })
        break
      }
      case 'item_updated': {
        const { item_id: id, changed, createdAt, updatedAt } = message
        updateItemInCollection({ id, name: changed.name, createdAt, updatedAt })
        break
      }
      case 'pong': {
        if (pingsInProcess > 1) {
          fetchMissedUpdates()
        }

        pingsInProcess = 0
        const statusStore = useStatusStore()
        statusStore.setConnectionStatus(STATES.CONNECTED)
        break
      }
    }
  }

  function scheduleRetry() {
    if (!shouldReconnect) {
      return
    }

    const statusStore = useStatusStore()
    statusStore.setIsReconnecting(true)

    retryTimeout = setTimeout(() => {
      retryDelay = Math.min(retryDelay * 2, RETRY_MAX_MS)
      console.log(`Trying to reconnect Socket. Next reconnect in: ${retryDelay} MS`)

      connect(shouldSkipWSChanges())
    }, retryDelay)
  }

  function connect(withError: boolean = false) {
    const url = withError ? INVALID_WEBSOCKETS_URL : WEBSOCKETS_URL
    ws = new WebSocket(url)

    ws.onopen = () => {
      console.log('Socket Connected')

      if (pingsInProcess > 0) {
        fetchMissedUpdates()
        pingsInProcess = 0
      }

      shouldReconnect = true
      retryDelay = RETRY_START_MS

      clearTimeout(retryTimeout)
      const statusStore = useStatusStore()
      statusStore.setConnectionStatus(STATES.CONNECTED)
      statusStore.setIsReconnecting(false)
      startHeartbeat()
    }

    ws.onmessage = (event: MessageEvent) => {
      if (shouldSkipWSChanges()) {
        return
      }

      handleMessage(JSON.parse(event.data))
    }

    ws.onerror = (error: Event) => console.error('Error:', error)

    ws.onclose = () => {
      console.log('Socket disconnected')

      clearInterval(heartbeatInterval)
      const statusStore = useStatusStore()
      statusStore.setConnectionStatus(STATES.DISCONNECTED)
      scheduleRetry()
    }
  }

  connect(shouldSkipWSChanges())

  return {
    close() {
      shouldReconnect = false
      clearTimeout(retryTimeout)
      clearInterval(heartbeatInterval)
      const statusStore = useStatusStore()
      statusStore.setIsReconnecting(false)
      ws.close()
    },
  }
}

export const socketConnection = createReconnectingSocket()
