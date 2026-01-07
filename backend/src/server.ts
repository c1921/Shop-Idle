import 'dotenv/config';
import { loadEnv } from './config/env.js';
import { buildApp } from './app.js';

async function start() {
    const env = loadEnv();
    const app = buildApp();

    await app.listen({
        port: env.port,
        host: '0.0.0.0',
    });

    console.log(`Server running at http://localhost:${env.port}`);
}

start().catch((err) => {
    console.error(err);
    process.exit(1);
});
