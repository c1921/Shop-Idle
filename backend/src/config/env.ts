export type EnvConfig = {
    port: number;
    databaseUrl: string;
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

    cachedEnv = { port, databaseUrl };
    return cachedEnv;
}
