<script setup lang="ts">
import type { GameState } from '../types'

type Props = {
  serverState: GameState | null
  formatNumber: (value: number | undefined) => string
}

defineProps<Props>()
</script>

<template>
  <section class="grid gap-4 md:grid-cols-3">
    <div class="card bg-base-200">
      <div class="card-body p-5">
        <p class="text-xs uppercase tracking-wide text-base-content/60">Cash</p>
        <p class="mt-2 text-2xl font-semibold">{{ formatNumber(serverState?.cash) }}</p>
      </div>
    </div>
    <div class="card bg-base-200">
      <div class="card-body p-5">
        <p class="text-xs uppercase tracking-wide text-base-content/60">Revenue</p>
        <p class="mt-2 text-2xl font-semibold">{{ formatNumber(serverState?.stats?.revenue) }}</p>
      </div>
    </div>
    <div class="card bg-base-200">
      <div class="card-body p-5">
        <p class="text-xs uppercase tracking-wide text-base-content/60">Cost</p>
        <p class="mt-2 text-2xl font-semibold">{{ formatNumber(serverState?.stats?.cost) }}</p>
      </div>
    </div>
  </section>
</template>
