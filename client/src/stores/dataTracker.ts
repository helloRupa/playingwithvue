import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useDataTrackerStore = defineStore('dataTracker', () => {
  const lastUpdatedRecordDate = ref<null | string>(null)

  function setLastUpdatedRecordDate(dateTime: string) {
    if (
      !lastUpdatedRecordDate.value ||
      new Date(dateTime).getTime() > new Date(lastUpdatedRecordDate.value!).getTime()
    ) {
      lastUpdatedRecordDate.value = dateTime
    }
  }

  return { lastUpdatedRecordDate, setLastUpdatedRecordDate }
})
