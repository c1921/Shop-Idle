export type EnvConfig = {
    port: number;
    databaseUrl: string;
    linuxdoClientId: string;
    linuxdoClientSecret: string;
    linuxdoRedirectUri: string;
    jwtSecret: string;
    frontendUrl: string;
    nodeEnv: string;
};

let cachedEnv: EnvConfig | null = null;

export function loadEnv(): EnvConfig {
    if (cachedEnv) return cachedEnv;

    const portRaw = process.env.PORT;
    const port = portRaw ? Number(portRaw) : 3000;
    if (!Number.isFinite(port)) {
        throw new Error('Invalid PORT');
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        throw new Error('Missing DATABASE_URL');
    }

    const linuxdoClientId = process.env.LINUXDO_CLIENT_ID;
    if (!linuxdoClientId) {
        throw new Error('Missing LINUXDO_CLIENT_ID');
    }

    const linuxdoClientSecret = process.env.LINUXDO_CLIENT_SECRET;
    if (!linuxdoClientSecret) {
        throw new Error('Missing LINUXDO_CLIENT_SECRET');
    }

    const linuxdoRedirectUri = process.env.LINUXDO_REDIRECT_URI;
    if (!linuxdoRedirectUri) {
        throw new Error('Missing LINUXDO_REDIRECT_URI');
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error('Missing JWT_SECRET');
    }

    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
        throw new Error('Missing FRONTEND_URL');
    }

    const nodeEnv = process.env.NODE_ENV ?? 'development';

    if (nodeEnv !== 'development') {
        if (linuxdoRedirectUri.startsWith('http://')) {
            throw new Error('LINUXDO_REDIRECT_URI must use https in production');
        }
        if (frontendUrl.startsWith('http://')) {
            throw new Error('FRONTEND_URL must use https in production');
        }
    }

    cachedEnv = {
        port,
        databaseUrl,
        linuxdoClientId,
        linuxdoClientSecret,
        linuxdoRedirectUri,
        jwtSecret,
        frontendUrl,
        nodeEnv,
    };
    return cachedEnv;
}
