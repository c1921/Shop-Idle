import pg from 'pg';
import { loadEnv } from '../config/env.js';

const { Pool } = pg;

const { databaseUrl } = loadEnv();

export const pool = new Pool({
    connectionString: databaseUrl,
});
