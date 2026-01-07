import type { GameState, OpPayload, OpType, SKUId } from '../types/game.js';
import { SKUS } from '../types/game.js';
import { BadRequestError } from '../utils/errors.js';

const SKU_IDS: SKUId[] = ['apple', 'bread'];
const MAX_OFFLINE_MINUTES = 60 * 8;

function normalizeNumber(value: unknown, fallback: number): number {
    return Number.isFinite(value as number) ? Number(value) : fallback;
}

function normalizeState(state: GameState, now: Date): GameState {
    const raw = state as unknown as {
        cash?: number;
        gold?: number;
        inventory?: Partial<Record<SKUId, number>>;
        customer?: { lastTickAt?: string; ratePerMinute?: number; carry?: number };
        stats?: { sold?: Partial<Record<SKUId, number>>; revenue?: number; cost?: number };
    };

    return {
        cash: normalizeNumber(raw.cash, normalizeNumber(raw.gold, 0)),
        inventory: {
            apple: normalizeNumber(raw.inventory?.apple, 0),
            bread: normalizeNumber(raw.inventory?.bread, 0),
        },
        customer: {
            lastTickAt:
                typeof raw.customer?.lastTickAt === 'string'
                    ? raw.customer.lastTickAt
                    : now.toISOString(),
            ratePerMinute: normalizeNumber(raw.customer?.ratePerMinute, 1),
            carry: normalizeNumber(raw.customer?.carry, 0),
        },
        stats: {
            sold: {
                apple: normalizeNumber(raw.stats?.sold?.apple, 0),
                bread: normalizeNumber(raw.stats?.sold?.bread, 0),
            },
            revenue: normalizeNumber(raw.stats?.revenue, 0),
            cost: normalizeNumber(raw.stats?.cost, 0),
        },
    };
}

export function applyCustomerTick(state: GameState, now: Date): GameState {
    const normalized = normalizeState(state, now);
    const nowMs = now.getTime();
    const lastMs = new Date(normalized.customer.lastTickAt).getTime();

    if (!Number.isFinite(nowMs) || !Number.isFinite(lastMs)) {
        return {
            ...normalized,
            customer: {
                ...normalized.customer,
                lastTickAt: now.toISOString(),
            },
        };
    }

    const elapsedMinutes = Math.min(
        Math.max(0, (nowMs - lastMs) / 60000),
        MAX_OFFLINE_MINUTES,
    );

    const totalCustomers =
        normalized.customer.ratePerMinute * elapsedMinutes + normalized.customer.carry;
    const arrivals = Math.floor(totalCustomers);
    const carry = totalCustomers - arrivals;

    let cash = normalized.cash;
    const inventory: Record<SKUId, number> = { ...normalized.inventory };
    const sold: Record<SKUId, number> = { ...normalized.stats.sold };
    let revenue = normalized.stats.revenue;

    for (let i = 0; i < arrivals; i += 1) {
        const available = SKU_IDS.filter((skuId) => (inventory[skuId] ?? 0) > 0);

        if (available.length === 0) {
            continue;
        }

        const chosen = available[Math.floor(Math.random() * available.length)];
        const price = SKUS[chosen].sellPrice;

        inventory[chosen] = (inventory[chosen] ?? 0) - 1;
        sold[chosen] = (sold[chosen] ?? 0) + 1;
        cash += price;
        revenue += price;
    }

    return {
        ...normalized,
        cash,
        inventory,
        customer: {
            ...normalized.customer,
            lastTickAt: now.toISOString(),
            carry,
        },
        stats: {
            ...normalized.stats,
            sold,
            revenue,
        },
    };
}

export function applyOp(
    state: GameState,
    type: OpType,
    payload: OpPayload,
): GameState {
    if (type === 'restock') {
        const skuId = (payload as { skuId?: SKUId }).skuId;
        const qty = Number((payload as { qty?: number }).qty ?? 0);

        if (!skuId || !SKUS[skuId]) {
            throw new BadRequestError('invalid_sku');
        }

        if (!Number.isFinite(qty) || qty <= 0 || !Number.isInteger(qty)) {
            throw new BadRequestError('invalid_qty');
        }

        const cost = SKUS[skuId].buyCost * qty;

        if (state.cash < cost) {
            throw new BadRequestError('insufficient_cash');
        }

        return {
            ...state,
            cash: state.cash - cost,
            inventory: {
                ...state.inventory,
                [skuId]: (state.inventory[skuId] ?? 0) + qty,
            },
            stats: {
                ...state.stats,
                cost: state.stats.cost + cost,
            },
        };
    }

    throw new BadRequestError('unknown_op_type');
}
