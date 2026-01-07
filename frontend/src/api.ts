import type { OpConflictResponse, OpRequest, OpResponse, SaveResponse } from './types'

export async function fetchSave(): Promise<SaveResponse> {
  const response = await fetch('/api/save')
  if (!response.ok) {
    throw new Error(`GET /api/save failed: ${response.status}`)
  }
  return response.json() as Promise<SaveResponse>
}

export async function postOp(
  request: OpRequest,
): Promise<{ status: 'ok'; data: OpResponse } | { status: 'conflict'; data: OpConflictResponse }> {
  const response = await fetch('/api/ops', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (response.status === 409) {
    return {
      status: 'conflict',
      data: (await response.json()) as OpConflictResponse,
    }
  }

  if (!response.ok) {
    throw new Error(`POST /api/ops failed: ${response.status}`)
  }

  return {
    status: 'ok',
    data: (await response.json()) as OpResponse,
  }
}
