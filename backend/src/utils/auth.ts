import type { FastifyRequest } from 'fastify';
import { loadEnv } from '../config/env.js';
import { verifyJwt } from './jwt.js';

export function getUserIdFromRequest(req: FastifyRequest): string | null {
    const header = req.headers.authorization;
    if (!header) return null;
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) return null;

    const { jwtSecret } = loadEnv();
    const payload = verifyJwt(token, jwtSecret);
    return payload?.sub ?? null;
}
