import type { FastifyPluginAsync } from 'fastify';
import { getSave } from '../services/save.service.js';
import { DEMO_USER_ID } from '../services/demoUser.service.js';
import type { SaveResponse } from '../types/http.js';

export const saveRoutes: FastifyPluginAsync = async (app) => {
    app.get('/save', async (req, reply) => {
        try {
            const now = new Date();
            const save = await getSave(DEMO_USER_ID, now);

            const response: SaveResponse = {
                state: save.state,
                version: save.version,
                serverTime: now.toISOString(),
                lastSeenAt: save.lastSeenAt,
            };

            return reply.send(response);
        } catch (err) {
            req.log.error(err);
            return reply.code(500).send({ error: 'internal_error' });
        }
    });
};
