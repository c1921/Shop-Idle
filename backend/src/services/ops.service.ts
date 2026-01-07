import { pool } from '../db/pool.js';
import type { GameState } from '../types/game.js';
import type { OpRequest, OpResponse } from '../types/http.js';
import { applyCustomerTick, applyOp } from './game.service.js';
import { VersionConflictError } from '../utils/errors.js';

export async function applyOpWithTx(
    userId: string,
    opRequest: OpRequest,
): Promise<OpResponse> {
    const client = await pool.connect();

    try {
        await client.query('begin');

        const cur = await client.query(
            `
      select state_json, version
      from saves
      where user_id = $1
      for update
      `,
            [userId],
        );

        const curVersion = Number(cur.rows[0].version);
        const now = new Date();
        const state = cur.rows[0].state_json as GameState;
        const tickedState = applyCustomerTick(state, now);

        const opCheck = await client.query(
            'select 1 from ops where op_id = $1',
            [opRequest.opId],
        );

        if ((opCheck.rowCount ?? 0) > 0) {
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
                version: curVersion,
            };
        }

        if (curVersion !== opRequest.baseVersion) {
            throw new VersionConflictError(curVersion);
        }

        const newState = applyOp(tickedState, opRequest.type, opRequest.payload);
        const newVersion = curVersion + 1;

        await client.query(
            `
      update saves
         set state_json = $2::jsonb,
             version = $3,
             last_seen_at = now(),
             updated_at = now()
       where user_id = $1
      `,
            [userId, JSON.stringify(newState), newVersion],
        );

        await client.query(
            'insert into ops(op_id, user_id) values($1, $2)',
            [opRequest.opId, userId],
        );

        await client.query('commit');

        return {
            state: newState,
            version: newVersion,
        };
    } catch (err: any) {
        await client.query('rollback');

        if (err?.code === '23505') {
            const cur = await client.query(
                'select state_json, version from saves where user_id = $1',
                [userId],
            );

            return {
                state: cur.rows[0].state_json as GameState,
                version: Number(cur.rows[0].version),
            };
        }

        throw err;
    } finally {
        client.release();
    }
}
