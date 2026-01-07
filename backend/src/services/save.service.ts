import { pool } from '../db/pool.js';
import type { GameState } from '../types/game.js';
import { applyCustomerTick } from './game.service.js';

export type SaveRecord = {
    state: GameState;
    version: number;
    lastSeenAt: string | null;
};

export async function getSave(userId: string, now: Date): Promise<SaveRecord> {
    const client = await pool.connect();

    try {
        await client.query('begin');

        const result = await client.query(
            `
      select state_json, version, last_seen_at
      from saves
      where user_id = $1
      for update
      `,
            [userId],
        );

        const row = result.rows[0];
        const state = row.state_json as GameState;
        const tickedState = applyCustomerTick(state, now);

        await client.query(
            `
      update saves
         set state_json = $2::jsonb,
             updated_at = now()
       where user_id = $1
      `,
            [userId, JSON.stringify(tickedState)],
        );

        await client.query('commit');

        return {
            state: tickedState,
            version: Number(row.version),
            lastSeenAt: row.last_seen_at,
        };
    } catch (err) {
        await client.query('rollback');
        throw err;
    } finally {
        client.release();
    }
}
