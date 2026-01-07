import type { FastifyPluginAsync } from 'fastify';
import type { Pool } from 'pg';
import { pool } from '../db/pool.js';

declare module 'fastify' {
    interface FastifyInstance {
        db: Pool;
    }
}

export const dbPlugin: FastifyPluginAsync = async (app) => {
    app.decorate('db', pool);
};
