import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useStatusStore = defineStore('statusStore', () => {
  const isConnected = ref<boolean>(false)

  function setIsConnected(status: boolean) {
    isConnected.value = status
  }

  return {
    isConnected,
    setIsConnected,
  }
})
