import type { GameState, OpPayload, OpType } from '../types/game.js';
import { BadRequestError } from '../utils/errors.js';

export function applyOp(
    state: GameState,
    type: OpType,
    payload: OpPayload,
): GameState {
    if (type === 'add_gold') {
        const amount = Number((payload as { amount?: number }).amount ?? 0);

        if (!Number.isFinite(amount) || amount <= 0) {
            throw new BadRequestError('invalid_amount');
        }

        return {
            ...state,
            gold: state.gold + amount,
        };
    }

    throw new BadRequestError('unknown_op_type');
}
