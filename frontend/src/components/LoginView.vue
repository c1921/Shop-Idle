<script setup lang="ts">
type Props = {
  loginUrl: string
}

defineProps<Props>()
</script>

<template>
  <main class="min-h-screen bg-base-100 text-base-content">
    <div class="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6">
      <div class="w-full rounded-box border border-base-300 bg-base-200 p-8 text-center">
        <h1 class="text-2xl font-semibold">Shop Idle</h1>
        <p class="mt-2 text-sm opacity-80">登录后即可读取与保存你的进度。</p>
        <a class="btn btn-primary mt-6" :href="loginUrl">使用 LinuxDO 登录</a>
      </div>
    </div>
  </main>
</template>
