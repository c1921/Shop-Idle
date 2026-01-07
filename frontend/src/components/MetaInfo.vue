<script setup lang="ts">
import type { GameState } from '../types'

type Props = {
  serverState: GameState | null
  serverVersion: number | null
  serverTime: string | null
  lastSeenAt: string | null
  formatNumber: (value: number | undefined) => string
  formatDateTime: (value: string | null | undefined) => string
}

defineProps<Props>()
</script>

<template>
  <section class="card bg-base-200">
    <div class="card-body grid gap-3 p-6 md:grid-cols-2">
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
    </div>
  </section>
</template>
