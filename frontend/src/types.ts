export type SKUId = 'apple' | 'bread'

export type GameState = {
  cash: number
  inventory: Record<SKUId, number>
  customer: {
    lastTickAt: string
    ratePerMinute: number
    carry: number
  }
  stats: {
    sold: Record<SKUId, number>
    revenue: number
    cost: number
  }
}

export type SaveResponse = {
  state: GameState
  version: number
  serverTime: string
  lastSeenAt: string | null
}

export type OpRequest = {
  opId: string
  baseVersion: number
  type: 'restock'
  payload: {
    skuId: SKUId
    qty: number
  }
}

export type OpResponse = {
  state: GameState
  version: number
}

export type OpConflictResponse = {
  error: 'version_conflict'
  serverVersion: number
}
