export type SKUId = 'apple' | 'bread';

export type SKU = {
    id: SKUId;
    name: string;
    buyCost: number;
    sellPrice: number;
};

export const SKUS: Record<SKUId, SKU> = {
    apple: {
        id: 'apple',
        name: 'Apple',
        buyCost: 2,
        sellPrice: 3,
    },
    bread: {
        id: 'bread',
        name: 'Bread',
        buyCost: 5,
        sellPrice: 8,
    },
};

export type GameState = {
    cash: number;
    inventory: Record<SKUId, number>;
    customer: {
        lastTickAt: string;
        ratePerMinute: number;
        carry: number;
    };
    stats: {
        sold: Record<SKUId, number>;
        revenue: number;
        cost: number;
    };
};

export type RestockPayload = {
    skuId: SKUId;
    qty: number;
};

export type OpType = 'restock';

export type OpPayload = RestockPayload;

export const defaultState: GameState = {
    cash: 50,
    inventory: {
        apple: 0,
        bread: 0,
    },
    customer: {
        lastTickAt: new Date().toISOString(),
        ratePerMinute: 10,
        carry: 0,
    },
    stats: {
        sold: {
            apple: 0,
            bread: 0,
        },
        revenue: 0,
        cost: 0,
    },
};
