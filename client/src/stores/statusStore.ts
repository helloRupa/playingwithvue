import { defineStore } from 'pinia'
import { ref } from 'vue'

export enum STATES {
  CONNECTED = 'Connected',
  UNSTABLE = 'Unstable',
  DISCONNECTED = 'Disconnected',
}

export const useStatusStore = defineStore('statusStore', () => {
  const networkStatus = ref<STATES>(STATES.DISCONNECTED)
  const isReconnecting = ref<boolean>(false)

  function setConnectionStatus(status: STATES) {
    networkStatus.value = status
  }

  function setIsReconnecting(status: boolean) {
    isReconnecting.value = status
  }

  return {
    networkStatus,
    setConnectionStatus,
    isReconnecting,
    setIsReconnecting,
  }
})
