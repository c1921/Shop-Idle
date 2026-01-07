import type { FastifyPluginAsync } from 'fastify';
import { loadEnv } from '../config/env.js';
import {
    buildAuthorizeUrl,
    exchangeCodeForToken,
    fetchLinuxDoUser,
} from '../services/linuxdo.service.js';
import { consumeOauthState, issueOauthState } from '../services/oauthState.service.js';
import { ensureUserSave, upsertLinuxDoIdentity } from '../services/user.service.js';
import { signJwt } from '../utils/jwt.js';

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

export const authRoutes: FastifyPluginAsync = async (app) => {
    app.get('/auth/linuxdo/login', async (_req, reply) => {
        const state = issueOauthState();
        const authorizeUrl = buildAuthorizeUrl(state);
        return reply.redirect(authorizeUrl);
    });

    app.get('/auth/linuxdo/callback', async (req, reply) => {
        const { code, state } = (req.query ?? {}) as {
            code?: string;
            state?: string;
        };

        if (!code || !state) {
            return reply.code(400).send({ error: 'invalid_request' });
        }

        if (!consumeOauthState(state)) {
            return reply.code(401).send({ error: 'invalid_state' });
        }

        try {
            const accessToken = await exchangeCodeForToken(code);
            const linuxdoUser = await fetchLinuxDoUser(accessToken);
            const userId = await upsertLinuxDoIdentity(linuxdoUser);
            await ensureUserSave(userId);

            const env = loadEnv();
            const token = signJwt({ sub: userId }, env.jwtSecret, ACCESS_TOKEN_TTL_SECONDS);
            const redirectUrl = new URL('/auth/callback', env.frontendUrl);
            redirectUrl.searchParams.set('token', token);

            return reply.redirect(redirectUrl.toString());
        } catch (err) {
            req.log.error({ err }, 'linuxdo oauth callback failed');
            return reply.code(500).send({ error: 'oauth_failed' });
        }
    });
};
