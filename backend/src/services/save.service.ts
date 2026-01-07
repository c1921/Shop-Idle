import { pool } from '../db/pool.js';
import type { GameState } from '../types/game.js';

export type SaveRecord = {
    state: GameState;
    version: number;
    lastSeenAt: string | null;
};

export async function getSave(userId: string): Promise<SaveRecord> {
    const result = await pool.query(
        `
    select state_json, version, last_seen_at
    from saves
    where user_id = $1
    `,
        [userId],
    );

    const row = result.rows[0];

    return {
        state: row.state_json as GameState,
        version: Number(row.version),
        lastSeenAt: row.last_seen_at,
    };
}
