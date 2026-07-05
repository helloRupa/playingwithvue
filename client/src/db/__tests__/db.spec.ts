import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Item } from '../db'

function mockFetchOnce(items: Item[], ok = true) {
  global.fetch = vi.fn<typeof fetch>().mockResolvedValue({
    ok,
    json: async () => items,
  } as Response)
}

describe('itemsCollection gap-fill fetch', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('fetches items with no query filter regardless of prior state', async () => {
    mockFetchOnce([])
    const { itemsCollection } = await import('../db')
    await itemsCollection.preload()

    mockFetchOnce([])
    await itemsCollection.utils.refetch()

    expect(global.fetch).toHaveBeenLastCalledWith('http://localhost:8000/items')
  })

  it('merges a fetched item into the collection when no local record exists', async () => {
    mockFetchOnce([])
    const { itemsCollection } = await import('../db')
    await itemsCollection.preload()

    const item: Item = {
      id: 9,
      name: 'fresh',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }
    mockFetchOnce([item])
    await itemsCollection.utils.refetch()

    expect(itemsCollection.get(9)).toMatchObject({ name: 'fresh' })
  })

  it('keeps the local record when the fetched item is older (last-write-wins)', async () => {
    mockFetchOnce([])
    const { itemsCollection, updateItemInCollection } = await import('../db')
    await itemsCollection.preload()

    const newerLocal: Item = {
      id: 5,
      name: 'newer',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:10:00.000Z',
    }
    updateItemInCollection(newerLocal)

    const staleFromServer: Item = {
      id: 5,
      name: 'stale',
      createdAt: newerLocal.createdAt,
      updatedAt: '2026-01-01T00:05:00.000Z',
    }
    mockFetchOnce([staleFromServer])
    await itemsCollection.utils.refetch()

    expect(itemsCollection.get(5)).toMatchObject({ name: 'newer' })
  })

  it('overwrites the local record when the fetched item is newer', async () => {
    mockFetchOnce([])
    const { itemsCollection, updateItemInCollection } = await import('../db')
    await itemsCollection.preload()

    updateItemInCollection({
      id: 7,
      name: 'old',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })

    const newer: Item = {
      id: 7,
      name: 'new',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:05:00.000Z',
    }
    mockFetchOnce([newer])
    await itemsCollection.utils.refetch()

    expect(itemsCollection.get(7)).toMatchObject({ name: 'new' })
  })

  it('recovers an update that was missed while a later update on a different item was received', async () => {
    mockFetchOnce([])
    const { itemsCollection, updateItemInCollection } = await import('../db')
    await itemsCollection.preload()

    itemsCollection.utils.writeInsert([
      {
        id: 2,
        name: 'B-stale',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 3,
        name: 'C-stale',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ])

    // Item C's update slips through live during the blip; item B's update
    // (issued earlier) is lost and never arrives over the socket.
    const itemC: Item = {
      id: 3,
      name: 'C-updated',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:10:00.000Z',
    }
    updateItemInCollection(itemC)

    // Reconnect triggers a full gap-fill fetch; the server's response is
    // authoritative and includes B's missed update.
    const itemB: Item = {
      id: 2,
      name: 'B-updated',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:05:00.000Z',
    }
    mockFetchOnce([itemB, itemC])
    await itemsCollection.utils.refetch()

    expect(itemsCollection.get(2)).toMatchObject({ name: 'B-updated' })
    expect(itemsCollection.get(3)).toMatchObject({ name: 'C-updated' })
  })

  it('surfaces an error when the gap-fill fetch fails so retry/backoff can engage', async () => {
    mockFetchOnce([])
    const { itemsCollection, fetchMissedUpdates } = await import('../db')
    await itemsCollection.preload()

    mockFetchOnce([], false)
    vi.useFakeTimers()

    fetchMissedUpdates()

    // Flush past the query library's built-in retry/backoff attempts.
    await vi.advanceTimersByTimeAsync(20_000)

    expect(itemsCollection.utils.isError).toBe(true)
  })
})
