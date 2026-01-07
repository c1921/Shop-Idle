import type { FastifyPluginAsync } from 'fastify';
import { applyOpWithTx } from '../services/ops.service.js';
import { DEMO_USER_ID } from '../services/demoUser.service.js';
import type { OpRequest, OpResponse } from '../types/http.js';
import type { OpPayload, OpType } from '../types/game.js';
import { BadRequestError, VersionConflictError } from '../utils/errors.js';

export const opsRoutes: FastifyPluginAsync = async (app) => {
    app.post('/ops', async (req, reply) => {
        const body = (req.body ?? {}) as Partial<OpRequest>;

        const opId = body?.opId as string;
        const baseVersion = Number((body as { baseVersion?: number }).baseVersion);
        const type = body?.type as string;
        const payload = (body?.payload ?? {}) as OpPayload;

        if (!opId || !Number.isFinite(baseVersion) || !type) {
            return reply.code(400).send({ error: 'invalid_request' });
        }

        try {
            const result: OpResponse = await applyOpWithTx(DEMO_USER_ID, {
                opId,
                baseVersion,
                type: type as OpType,
                payload,
            });

            return reply.send(result);
        } catch (err) {
            if (err instanceof VersionConflictError) {
                return reply
                    .code(409)
                    .send({ error: 'version_conflict', serverVersion: err.serverVersion });
            }

            if (err instanceof BadRequestError) {
                return reply.code(400).send({ error: err.error });
            }

            req.log.error(err);
            return reply.code(500).send({ error: 'internal_error' });
        }
    });
};
