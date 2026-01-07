<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchSave, postOp } from './api'
import type { GameState } from './types'

const serverState = ref<GameState | null>(null)
const serverVersion = ref<number | null>(null)

const isLoading = ref(false)
const isSubmitting = ref(false)
const uiMessage = ref<string | null>(null)

const loadSave = async () => {
  isLoading.value = true
  uiMessage.value = null
  try {
    const save = await fetchSave()
    serverState.value = save.state
    serverVersion.value = save.version
  } catch (error) {
    uiMessage.value = error instanceof Error ? error.message : 'Failed to load save.'
  } finally {
    isLoading.value = false
  }
}

const addGold = async () => {
  if (serverVersion.value === null || serverState.value === null) {
    await loadSave()
    return
  }

  isSubmitting.value = true
  uiMessage.value = null

  try {
    const response = await postOp({
      opId: crypto.randomUUID(),
      baseVersion: serverVersion.value,
      type: 'add_gold',
      payload: { amount: 5 },
    })

    if (response.status === 'conflict') {
      console.log('Version conflict, refreshing from server.', response.data)
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

onMounted(() => {
  void loadSave()
})
</script>

<template>
  <main class="app">
    <h1>Shop Idle</h1>

    <section class="panel">
      <p class="stat">
        <span>Gold</span>
        <strong>{{ serverState?.gold ?? '...' }}</strong>
      </p>
      <p class="stat">
        <span>Version</span>
        <strong>{{ serverVersion ?? '...' }}</strong>
      </p>
    </section>

    <button type="button" class="action" :disabled="isLoading || isSubmitting" @click="addGold">
      +5 Gold
    </button>

    <p v-if="uiMessage" class="message">{{ uiMessage }}</p>
  </main>
</template>

<style scoped>
.app {
  max-width: 420px;
  margin: 4rem auto;
  padding: 2rem;
  display: grid;
  gap: 1.5rem;
  text-align: center;
  border-radius: 16px;
  border: 1px solid #e6e6e6;
}

.panel {
  display: grid;
  gap: 0.75rem;
}

.stat {
  display: flex;
  justify-content: space-between;
  font-size: 1.1rem;
  margin: 0;
}

.action {
  border: none;
  border-radius: 10px;
  padding: 0.85rem 1.25rem;
  background: #222222;
  color: #ffffff;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 150ms ease, opacity 150ms ease;
}

.action:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.action:not(:disabled):hover {
  transform: translateY(-1px);
}

.message {
  margin: 0;
  color: #c62828;
}
</style>
