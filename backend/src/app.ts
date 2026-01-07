import Fastify from 'fastify';
import { dbPlugin } from './plugins/db.js';
import { healthRoutes } from './routes/health.js';
import { saveRoutes } from './routes/save.js';
import { opsRoutes } from './routes/ops.js';
import { BadRequestError, VersionConflictError } from './utils/errors.js';

export function buildApp() {
    const app = Fastify({ logger: true });

    app.register(dbPlugin);
    app.register(healthRoutes);
    app.register(saveRoutes);
    app.register(opsRoutes);

    app.setErrorHandler((err, _req, reply) => {
        if (err instanceof VersionConflictError) {
            return reply
                .code(409)
                .send({ error: 'version_conflict', serverVersion: err.serverVersion });
        }

        if (err instanceof BadRequestError) {
            return reply.code(400).send({ error: err.error });
        }

        app.log.error(err);
        return reply.code(500).send({ error: 'internal_error' });
    });

    return app;
}
