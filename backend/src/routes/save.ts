import type { FastifyPluginAsync } from 'fastify';
import { getSave } from '../services/save.service.js';
import type { SaveResponse } from '../types/http.js';
import { getUserIdFromRequest } from '../utils/auth.js';

export const saveRoutes: FastifyPluginAsync = async (app) => {
    app.get('/save', async (req, reply) => {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return reply.code(401).send({ error: 'unauthorized' });
        }

        try {
            const now = new Date();
            const save = await getSave(userId, now);

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
