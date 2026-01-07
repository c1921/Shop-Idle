<script setup lang="ts">
import type { GameState, SKUId } from '../types'

type Sku = {
  id: SKUId
  name: string
  buyCost: number
  sellPrice: number
}

type Props = {
  skus: Sku[]
  serverState: GameState | null
  restockQty: Record<SKUId, number>
  isLoading: boolean
  isSubmitting: boolean
  isInsufficientCash: (skuId: SKUId) => boolean
  formatNumber: (value: number | undefined) => string
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'update-qty', skuId: SKUId, qty: number): void
  (e: 'restock', skuId: SKUId): void
}>()

const onQtyInput = (skuId: SKUId, event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update-qty', skuId, Number(target.value))
}
</script>

<template>
  <section class="card bg-base-200">
    <div class="card-body w-full overflow-x-auto p-4">
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
          <tr v-for="sku in skus" :key="sku.id" class="row-hover">
            <td class="font-semibold">{{ sku.name }}</td>
            <td>{{ sku.buyCost }}</td>
            <td>{{ sku.sellPrice }}</td>
            <td>{{ formatNumber(serverState?.inventory?.[sku.id]) }}</td>
            <td>{{ formatNumber(serverState?.stats?.sold?.[sku.id]) }}</td>
            <td class="w-32">
              <input
                :value="restockQty[sku.id]"
                type="number"
                min="1"
                step="1"
                inputmode="numeric"
                class="input h-9 w-full text-sm"
                @input="onQtyInput(sku.id, $event)"
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
                @click="emit('restock', sku.id)"
              >
                Restock
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
