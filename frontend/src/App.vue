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
  <main class="app">
    <header class="hero">
      <div>
        <p class="eyebrow">Shop Idle</p>
        <h1>Mini Market</h1>
        <p class="subtext">Restock fast, sell steadily, check in anytime.</p>
      </div>
      <button type="button" class="ghost" :disabled="isLoading" @click="() => loadSave()">
        Refresh
      </button>
    </header>

    <section class="summary">
      <div class="tile">
        <span>Cash</span>
        <strong>{{ formatNumber(serverState?.cash) }}</strong>
      </div>
      <div class="tile">
        <span>Revenue</span>
        <strong>{{ formatNumber(serverState?.stats?.revenue) }}</strong>
      </div>
      <div class="tile">
        <span>Cost</span>
        <strong>{{ formatNumber(serverState?.stats?.cost) }}</strong>
      </div>
    </section>

    <section class="grid">
      <article v-for="sku in SKUS" :key="sku.id" class="card">
        <div class="card-head">
          <div>
            <h3>{{ sku.name }}</h3>
            <p>Buy {{ sku.buyCost }} · Sell {{ sku.sellPrice }}</p>
          </div>
          <div class="badge">SKU</div>
        </div>
        <div class="card-body">
          <p class="statline">
            <span>Stock</span>
            <strong>{{ formatNumber(serverState?.inventory?.[sku.id]) }}</strong>
          </p>
          <p class="statline">
            <span>Sold</span>
            <strong>{{ formatNumber(serverState?.stats?.sold?.[sku.id]) }}</strong>
          </p>
        </div>
        <div class="restock">
          <input
            v-model.number="restockQty[sku.id]"
            type="number"
            min="1"
            step="1"
            inputmode="numeric"
          />
          <button
            type="button"
            :disabled="isLoading || isSubmitting || isInsufficientCash(sku.id)"
            :class="{ 'is-insufficient': isInsufficientCash(sku.id) }"
            @click="restock(sku.id)"
          >
            Restock
          </button>
        </div>
      </article>
    </section>

    <section class="meta">
      <div class="meta-row">
        <span>Customer rate</span>
        <strong>{{ formatNumber(serverState?.customer?.ratePerMinute) }}/min</strong>
      </div>
      <div class="meta-row">
        <span>Carry</span>
        <strong>{{ serverState ? serverState.customer.carry.toFixed(2) : '...' }}</strong>
      </div>
      <div class="meta-row">
        <span>Last tick</span>
        <strong>{{ formatDateTime(serverState?.customer?.lastTickAt) }}</strong>
      </div>
      <div class="meta-row">
        <span>Server time</span>
        <strong>{{ formatDateTime(serverTime) }}</strong>
      </div>
      <div class="meta-row">
        <span>Version</span>
        <strong>{{ serverVersion ?? '...' }}</strong>
      </div>
      <div class="meta-row">
        <span>Last seen</span>
        <strong>{{ formatDateTime(lastSeenAt) }}</strong>
      </div>
    </section>

    <p v-if="uiMessage" class="message">{{ uiMessage }}</p>
  </main>
</template>

<style scoped>
.app {
  max-width: 980px;
  margin: 3.5rem auto 5rem;
  padding: 0 1.5rem;
  display: grid;
  gap: 2rem;
}

.hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
}

.eyebrow {
  margin: 0;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--muted);
}

h1 {
  margin: 0.35rem 0 0.5rem;
  font-size: clamp(2.4rem, 3vw, 3.2rem);
  letter-spacing: -0.02em;
}

.subtext {
  margin: 0;
  color: var(--muted);
  font-size: 1rem;
}

.ghost {
  border-radius: 999px;
  padding: 0.65rem 1.4rem;
  border: 1px solid var(--line);
  background: transparent;
  color: var(--text);
  font-weight: 600;
}

.summary {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.tile {
  padding: 1.25rem 1.5rem;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid var(--line);
  display: grid;
  gap: 0.35rem;
}

.tile span {
  color: var(--muted);
  font-size: 0.9rem;
}

.tile strong {
  font-size: 1.6rem;
}

.grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.card {
  padding: 1.5rem;
  border-radius: 20px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.9);
  display: grid;
  gap: 1.2rem;
  box-shadow: var(--shadow);
}

.card-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.card-head h3 {
  margin: 0 0 0.25rem;
  font-size: 1.3rem;
}

.card-head p {
  margin: 0;
  color: var(--muted);
  font-size: 0.95rem;
}

.badge {
  align-self: flex-start;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.card-body {
  display: grid;
  gap: 0.5rem;
}

.statline {
  margin: 0;
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
}

.restock {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.75rem;
}

.restock input {
  padding: 0.6rem 0.75rem;
  border-radius: 10px;
  border: 1px solid var(--line);
  font-size: 0.95rem;
}

.restock button {
  border-radius: 10px;
  border: none;
  padding: 0.65rem 1.1rem;
  background: var(--accent);
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
}

.restock button.is-insufficient {
  background: #c0c0c0;
  color: #f8f8f8;
  cursor: not-allowed;
}

.restock button:disabled {
  opacity: 1;
  cursor: default;
}

.meta {
  border-radius: 18px;
  border: 1px solid var(--line);
  padding: 1.25rem 1.5rem;
  background: rgba(255, 255, 255, 0.7);
  display: grid;
  gap: 0.5rem;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
}

.message {
  margin: 0;
  color: var(--danger);
  font-weight: 600;
}

@media (max-width: 720px) {
  .hero {
    flex-direction: column;
    align-items: stretch;
  }

  .ghost {
    width: fit-content;
  }
}
</style>
