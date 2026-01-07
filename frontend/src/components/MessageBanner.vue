<script setup lang="ts">
type Props = {
  message: string | null
}

defineProps<Props>()
</script>

<template>
  <p v-if="message" class="bg-error/10 px-4 py-3 text-sm font-semibold text-error">
    {{ message }}
  </p>
</template>
