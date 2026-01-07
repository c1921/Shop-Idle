import { createHmac, timingSafeEqual } from 'crypto';

type JwtPayload = {
    sub: string;
    iat: number;
    exp: number;
    [key: string]: unknown;
};

function base64UrlEncode(input: string | Buffer): string {
    return Buffer.from(input)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
}

function base64UrlDecode(input: string): Buffer {
    let base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    if (pad) {
        base64 += '='.repeat(4 - pad);
    }
    return Buffer.from(base64, 'base64');
}

export function signJwt(
    payload: Omit<JwtPayload, 'iat' | 'exp'>,
    secret: string,
    expiresInSeconds: number,
): string {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'HS256', typ: 'JWT' };
    const body: JwtPayload = {
        ...payload,
        iat: now,
        exp: now + expiresInSeconds,
    };

    const headerPart = base64UrlEncode(JSON.stringify(header));
    const payloadPart = base64UrlEncode(JSON.stringify(body));
    const data = `${headerPart}.${payloadPart}`;
    const signature = base64UrlEncode(
        createHmac('sha256', secret).update(data).digest(),
    );

    return `${data}.${signature}`;
}

export function verifyJwt(token: string, secret: string): JwtPayload | null {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerPart, payloadPart, signaturePart] = parts;
    const data = `${headerPart}.${payloadPart}`;
    const expected = base64UrlEncode(
        createHmac('sha256', secret).update(data).digest(),
    );

    const sigBuffer = Buffer.from(signaturePart);
    const expectedBuffer = Buffer.from(expected);

    if (
        sigBuffer.length !== expectedBuffer.length ||
        !timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
        return null;
    }

    try {
        const payload = JSON.parse(base64UrlDecode(payloadPart).toString('utf8'));
        if (typeof payload?.sub !== 'string') return null;
        if (typeof payload?.exp !== 'number') return null;
        if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
        return payload as JwtPayload;
    } catch {
        return null;
    }
}

export type { JwtPayload };
