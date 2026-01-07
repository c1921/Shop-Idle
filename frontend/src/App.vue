<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { fetchSave, postOp } from './api'
import type { GameState, SKUId } from './types'

const AUTO_REFRESH_MS = 1000

const SKUS = [
  { id: 'apple' as const, name: 'Apple', buyCost: 2, sellPrice: 3 },
  { id: 'bread' as const, name: 'Bread', buyCost: 5, sellPrice: 8 },
]

const serverState = ref<GameState | null>(null)
const serverVersion = ref<number | null>(null)
const serverTime = ref<string | null>(null)
const lastSeenAt = ref<string | null>(null)

const restockQty = ref<Record<SKUId, number>>({
  apple: 1,
  bread: 1,
})

const isLoading = ref(false)
const isRefreshing = ref(false)
const isSubmitting = ref(false)
const uiMessage = ref<string | null>(null)

const formatNumber = (value: number | undefined) => {
  if (!Number.isFinite(value ?? NaN)) return '...'
  return new Intl.NumberFormat().format(value ?? 0)
}

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return '...'
  return new Date(value).toLocaleString()
}

const isInsufficientCash = (skuId: SKUId) => {
  if (!serverState.value) return false
  const qty = Number(restockQty.value[skuId] ?? 0)
  if (!Number.isFinite(qty) || qty <= 0) return false
  const sku = SKUS.find((item) => item.id === skuId)
  if (!sku) return false
  return serverState.value.cash < sku.buyCost * qty
}

const loadSave = async (options: { silent?: boolean } = {}) => {
  const silent = options.silent === true
  if (silent) {
    isRefreshing.value = true
  } else {
    isLoading.value = true
    uiMessage.value = null
  }
  try {
    const save = await fetchSave()
    serverState.value = save.state
    serverVersion.value = save.version
    serverTime.value = save.serverTime
    lastSeenAt.value = save.lastSeenAt
  } catch (error) {
    if (!silent) {
      uiMessage.value = error instanceof Error ? error.message : 'Failed to load save.'
    }
  } finally {
    if (silent) {
      isRefreshing.value = false
    } else {
      isLoading.value = false
    }
  }
}

const restock = async (skuId: SKUId) => {
  if (serverVersion.value === null || serverState.value === null) {
    await loadSave()
    return
  }

  const qty = Number(restockQty.value[skuId] ?? 0)
  if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) {
    uiMessage.value = 'Please enter a valid restock quantity.'
    return
  }

  isSubmitting.value = true
  uiMessage.value = null

  try {
    const response = await postOp({
      opId: crypto.randomUUID(),
      baseVersion: serverVersion.value,
      type: 'restock',
      payload: { skuId, qty },
    })

    if (response.status === 'conflict') {
      await loadSave()
      return
    }

    serverState.value = response.data.state
    serverVersion.value = response.data.version
  } catch (error) {
    uiMessage.value = error instanceof Error ? error.message : 'Failed to submit op.'
  } finally {
    isSubmitting.value = false
  }
}

let refreshTimer: number | undefined

onMounted(() => {
  setTimeout(() => window.HSStaticMethods.autoInit(), 100)
  void loadSave()
  refreshTimer = window.setInterval(() => {
    if (document.hidden || isRefreshing.value || isSubmitting.value || isLoading.value) {
      return
    }
    void loadSave({ silent: true })
  }, AUTO_REFRESH_MS)
})

onUnmounted(() => {
  if (refreshTimer !== undefined) {
    window.clearInterval(refreshTimer)
  }
})
</script>

<template>
  <main class="min-h-screen bg-base-100 text-base-content">
    <div class="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 pb-12 pt-8">
      <header class="flex items-center justify-between">
        <button type="button" class="btn" :disabled="isLoading" @click="() => loadSave()">
          Refresh
        </button>
        <span class="badge badge-outline">v{{ serverVersion ?? '...' }}</span>
      </header>

      <section class="grid gap-4 md:grid-cols-3">
        <div class="rounded-box bg-base-200 p-5">
          <p class="text-xs uppercase tracking-wide text-base-content/60">Cash</p>
          <p class="mt-2 text-2xl font-semibold">{{ formatNumber(serverState?.cash) }}</p>
        </div>
        <div class="rounded-box bg-base-200 p-5">
          <p class="text-xs uppercase tracking-wide text-base-content/60">Revenue</p>
          <p class="mt-2 text-2xl font-semibold">{{ formatNumber(serverState?.stats?.revenue) }}</p>
        </div>
        <div class="rounded-box bg-base-200 p-5">
          <p class="text-xs uppercase tracking-wide text-base-content/60">Cost</p>
          <p class="mt-2 text-2xl font-semibold">{{ formatNumber(serverState?.stats?.cost) }}</p>
        </div>
      </section>

      <section class="rounded-box w-full overflow-x-auto bg-base-200 p-4">
        <table class="table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Buy</th>
              <th>Sell</th>
              <th>Stock</th>
              <th>Sold</th>
              <th>Qty</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sku in SKUS" :key="sku.id" class="row-hover">
              <td class="font-semibold">{{ sku.name }}</td>
              <td>{{ sku.buyCost }}</td>
              <td>{{ sku.sellPrice }}</td>
              <td>{{ formatNumber(serverState?.inventory?.[sku.id]) }}</td>
              <td>{{ formatNumber(serverState?.stats?.sold?.[sku.id]) }}</td>
              <td class="w-32">
                <input
                  v-model.number="restockQty[sku.id]"
                  type="number"
                  min="1"
                  step="1"
                  inputmode="numeric"
                  class="input h-9 w-full text-sm"
                />
              </td>
              <td>
                <button
                  type="button"
                  class="btn h-9 px-3 text-sm"
                  :disabled="isLoading || isSubmitting || isInsufficientCash(sku.id)"
                  :class="
                    // 注意：发送中/加载中保持主按钮样式，避免禁用样式闪烁；仅余额不足时变灰。
                    isInsufficientCash(sku.id)
                      ? 'bg-base-300 text-base-content/40'
                      : 'bg-primary text-primary-content disabled:bg-primary disabled:text-primary-content disabled:opacity-100'
                  "
                  @click="restock(sku.id)"
                >
                  Restock
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="rounded-box grid gap-3 bg-base-200 p-6 md:grid-cols-2">
        <div class="flex items-center justify-between gap-3 rounded-field bg-base-100 px-3 py-2 text-sm">
          <span class="text-base-content/70">Customer rate</span>
          <span class="font-semibold">{{ formatNumber(serverState?.customer?.ratePerMinute) }}/min</span>
        </div>
        <div class="flex items-center justify-between gap-3 rounded-field bg-base-100 px-3 py-2 text-sm">
          <span class="text-base-content/70">Carry</span>
          <span class="font-semibold">{{ serverState ? serverState.customer.carry.toFixed(2) : '...' }}</span>
        </div>
        <div class="flex items-center justify-between gap-3 rounded-field bg-base-100 px-3 py-2 text-sm">
          <span class="text-base-content/70">Last tick</span>
          <span class="font-semibold">{{ formatDateTime(serverState?.customer?.lastTickAt) }}</span>
        </div>
        <div class="flex items-center justify-between gap-3 rounded-field bg-base-100 px-3 py-2 text-sm">
          <span class="text-base-content/70">Server time</span>
          <span class="font-semibold">{{ formatDateTime(serverTime) }}</span>
        </div>
        <div class="flex items-center justify-between gap-3 rounded-field bg-base-100 px-3 py-2 text-sm">
          <span class="text-base-content/70">Version</span>
          <span class="font-semibold">{{ serverVersion ?? '...' }}</span>
        </div>
        <div class="flex items-center justify-between gap-3 rounded-field bg-base-100 px-3 py-2 text-sm">
          <span class="text-base-content/70">Last seen</span>
          <span class="font-semibold">{{ formatDateTime(lastSeenAt) }}</span>
        </div>
      </section>

      <p
        v-if="uiMessage"
        class="bg-error/10 px-4 py-3 text-sm font-semibold text-error"
      >
        {{ uiMessage }}
      </p>
    </div>
  </main>
</template>
