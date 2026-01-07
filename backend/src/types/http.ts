import type { GameState, OpPayload, OpType } from './game.js';

export type SaveResponse = {
    state: GameState;
    version: number;
    serverTime: string;
    lastSeenAt: string | null;
};

export type OpRequest = {
    opId: string;
    baseVersion: number;
    type: OpType;
    payload: OpPayload;
};

export type OpResponse = {
    state: GameState;
    version: number;
};

export type ErrorResponse = {
    error: string;
    serverVersion?: number;
};
