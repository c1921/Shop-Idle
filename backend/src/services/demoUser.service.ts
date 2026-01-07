import { pool } from '../db/pool.js';
import type { GameState } from '../types/game.js';

export const DEMO_USER_ID = '11111111-1111-1111-1111-111111111111';

export async function ensureDemoUser(
    userId: string,
    defaultState: GameState,
): Promise<void> {
    await pool.query(
        'insert into users(id) values($1) on conflict do nothing',
        [userId],
    );

    await pool.query(
        `
    insert into saves(user_id, state_json, version)
    values($1, $2::jsonb, 0)
    on conflict (user_id) do nothing
    `,
        [userId, JSON.stringify(defaultState)],
    );
}
