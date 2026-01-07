<script setup lang="ts">
type Props = {
  isLoading: boolean
  serverVersion: number | null
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()
</script>

<template>
  <header class="flex items-center justify-between">
    <button type="button" class="btn" :disabled="isLoading" @click="emit('refresh')">
      Refresh
    </button>
    <span class="badge badge-outline">v{{ serverVersion ?? '...' }}</span>
  </header>
</template>
