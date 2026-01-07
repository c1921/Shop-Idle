export type GameState = {
  gold: number
}

export type SaveResponse = {
  state: GameState
  version: number
  serverTime: string
  lastSeenAt: string
}

export type OpRequest = {
  opId: string
  baseVersion: number
  type: 'add_gold'
  payload: {
    amount: number
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
