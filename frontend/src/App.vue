<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { clearAuthToken, getAuthToken, setAuthToken } from './auth'
import { fetchSave, postOp } from './api'
import type { GameState, SKUId } from './types'
import HeaderBar from './components/HeaderBar.vue'
import LoginView from './components/LoginView.vue'
import SummaryCards from './components/SummaryCards.vue'
import SkuTable from './components/SkuTable.vue'
import MetaInfo from './components/MetaInfo.vue'
import MessageBanner from './components/MessageBanner.vue'

const AUTO_REFRESH_MS = 1000

const SKUS = [
  { id: 'apple' as const, name: 'Apple', buyCost: 2, sellPrice: 3 },
  { id: 'bread' as const, name: 'Bread', buyCost: 5, sellPrice: 8 },
]

const serverState = ref<GameState | null>(null)
const serverVersion = ref<number | null>(null)
const serverTime = ref<string | null>(null)
const lastSeenAt = ref<string | null>(null)
const authToken = ref<string | null>(getAuthToken())
const loginUrl = '/auth/linuxdo/login'
const isAuthed = computed(() => Boolean(authToken.value))
const currentPath = ref<string>(window.location.pathname)
const isLoginPage = computed(() => currentPath.value === '/login')

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
  if (!authToken.value) {
    if (!silent) {
      uiMessage.value = 'Please log in to load your save.'
    }
    return
  }
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
const updatePath = () => {
  currentPath.value = window.location.pathname
}
const ensureLoginRoute = () => {
  if (!authToken.value && window.location.pathname !== '/login') {
    window.history.replaceState({}, '', '/login')
    updatePath()
  }
}
const onPopState = () => {
  updatePath()
  ensureLoginRoute()
}

const logout = () => {
  clearAuthToken()
  authToken.value = null
  window.history.replaceState({}, '', '/login')
  updatePath()
}

onMounted(() => {
  setTimeout(() => window.HSStaticMethods.autoInit(), 100)
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')
  if (token) {
    setAuthToken(token)
    authToken.value = token
    window.history.replaceState({}, '', '/')
    updatePath()
  } else if (authToken.value && window.location.pathname === '/login') {
    window.history.replaceState({}, '', '/')
    updatePath()
  }
  ensureLoginRoute()
  void loadSave()
  refreshTimer = window.setInterval(() => {
    if (document.hidden || isRefreshing.value || isSubmitting.value || isLoading.value) {
      return
    }
    void loadSave({ silent: true })
  }, AUTO_REFRESH_MS)
  window.addEventListener('popstate', onPopState)
})

onUnmounted(() => {
  if (refreshTimer !== undefined) {
    window.clearInterval(refreshTimer)
  }
  window.removeEventListener('popstate', onPopState)
})
</script>

<template>
  <LoginView v-if="!isAuthed && isLoginPage" :login-url="loginUrl" />

  <main v-else class="min-h-screen bg-base-100 text-base-content">
    <div class="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 pb-12 pt-8">
      <div v-if="isAuthed" class="flex items-center justify-end">
        <button type="button" class="btn btn-ghost btn-sm" @click="logout">Logout</button>
      </div>

      <HeaderBar :is-loading="isLoading" :server-version="serverVersion" @refresh="loadSave()" />

      <SummaryCards :server-state="serverState" :format-number="formatNumber" />

      <SkuTable
        :skus="SKUS"
        :server-state="serverState"
        :restock-qty="restockQty"
        :is-loading="isLoading"
        :is-submitting="isSubmitting"
        :is-insufficient-cash="isInsufficientCash"
        :format-number="formatNumber"
        @update-qty="(skuId, qty) => (restockQty[skuId] = qty)"
        @restock="restock"
      />

      <MetaInfo
        :server-state="serverState"
        :server-version="serverVersion"
        :server-time="serverTime"
        :last-seen-at="lastSeenAt"
        :format-number="formatNumber"
        :format-date-time="formatDateTime"
      />

      <MessageBanner :message="uiMessage" />
    </div>
  </main>
</template>
