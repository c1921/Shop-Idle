import 'dotenv/config';
import { loadEnv } from './config/env.js';
import { buildApp } from './app.js';
import { ensureDemoUser, DEMO_USER_ID } from './services/demoUser.service.js';
import { defaultState } from './types/game.js';

async function start() {
    const env = loadEnv();
    const app = buildApp();

    await ensureDemoUser(DEMO_USER_ID, defaultState);

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
