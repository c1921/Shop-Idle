import { loadEnv } from '../config/env.js';

const AUTHORIZE_URL = 'https://connect.linux.do/oauth2/authorize';
const TOKEN_URL = 'https://connect.linux.do/oauth2/token';
const USERINFO_URL = 'https://connect.linux.do/api/user';

export type LinuxDoUser = {
    id: string;
    username?: string;
    name?: string;
    avatar_template?: string;
    trust_level?: number;
    active?: boolean;
    silenced?: boolean;
};

type TokenResponse = {
    access_token?: string;
    token_type?: string;
    expires_in?: number;
    refresh_token?: string;
    scope?: string;
};

export function buildAuthorizeUrl(state: string): string {
    const env = loadEnv();
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: env.linuxdoClientId,
        redirect_uri: env.linuxdoRedirectUri,
        state,
        scope: 'user',
    });
    return `${AUTHORIZE_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
    const env = loadEnv();
    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: env.linuxdoRedirectUri,
        client_id: env.linuxdoClientId,
        client_secret: env.linuxdoClientSecret,
    });

    const response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
        },
        body,
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Token exchange failed: ${response.status} ${text}`);
    }

    const data = (await response.json()) as TokenResponse;
    if (!data.access_token) {
        throw new Error('Token exchange missing access_token');
    }

    return data.access_token;
}

export async function fetchLinuxDoUser(accessToken: string): Promise<LinuxDoUser> {
    const response = await fetch(USERINFO_URL, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`UserInfo failed: ${response.status} ${text}`);
    }

    const data = (await response.json()) as LinuxDoUser;
    if (!data?.id) {
        throw new Error('UserInfo missing id');
    }

    return data;
}
