import { defineStore } from 'pinia'
import { ref } from 'vue'

export enum STATES {
  CONNECTED = 'Connected',
  UNSTABLE = 'Unstable',
  DISCONNECTED = 'Disconnected',
}

export const useStatusStore = defineStore('statusStore', () => {
  const networkStatus = ref<STATES>(STATES.DISCONNECTED)

  function setIsConnected(status: STATES) {
    networkStatus.value = status
  }

  return {
    networkStatus,
    setIsConnected,
  }
})
