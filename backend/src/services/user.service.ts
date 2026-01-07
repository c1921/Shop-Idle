import { randomUUID } from 'crypto';
import { pool } from '../db/pool.js';
import type { GameState } from '../types/game.js';
import { defaultState as baseDefaultState } from '../types/game.js';
import type { LinuxDoUser } from './linuxdo.service.js';

export async function ensureUserSave(
    userId: string,
    defaultState: GameState = baseDefaultState,
): Promise<void> {
    const nowState: GameState = {
        ...defaultState,
        inventory: { ...defaultState.inventory },
        customer: {
            ...defaultState.customer,
            lastTickAt: new Date().toISOString(),
        },
        stats: {
            ...defaultState.stats,
            sold: { ...defaultState.stats.sold },
        },
    };

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
        [userId, JSON.stringify(nowState)],
    );
}

export async function upsertLinuxDoIdentity(user: LinuxDoUser): Promise<string> {
    const client = await pool.connect();

    try {
        await client.query('begin');

        const existing = await client.query(
            'select user_id from user_identities where linuxdo_id = $1',
            [user.id],
        );

        let userId: string;

        if (existing.rowCount && existing.rows[0]?.user_id) {
            userId = existing.rows[0].user_id as string;
            await client.query(
                `
        update user_identities
           set username = $2,
               name = $3,
               avatar_template = $4,
               trust_level = $5,
               active = $6,
               silenced = $7,
               updated_at = now()
         where linuxdo_id = $1
        `,
                [
                    user.id,
                    user.username ?? null,
                    user.name ?? null,
                    user.avatar_template ?? null,
                    user.trust_level ?? null,
                    user.active ?? null,
                    user.silenced ?? null,
                ],
            );
        } else {
            userId = randomUUID();
            await client.query('insert into users(id) values($1)', [userId]);
            await client.query(
                `
        insert into user_identities(
          linuxdo_id,
          user_id,
          username,
          name,
          avatar_template,
          trust_level,
          active,
          silenced
        )
        values($1, $2, $3, $4, $5, $6, $7, $8)
        `,
                [
                    user.id,
                    userId,
                    user.username ?? null,
                    user.name ?? null,
                    user.avatar_template ?? null,
                    user.trust_level ?? null,
                    user.active ?? null,
                    user.silenced ?? null,
                ],
            );
        }

        await client.query('commit');
        return userId;
    } catch (err) {
        await client.query('rollback');
        throw err;
    } finally {
        client.release();
    }
}
