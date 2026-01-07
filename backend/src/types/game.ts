export type GameState = {
    gold: number;
};

export type AddGoldPayload = {
    amount: number;
};

export type OpType = 'add_gold';

export type OpPayload = AddGoldPayload;

export const defaultState: GameState = {
    gold: 0,
};
