import { randomBytes } from 'crypto';

const STATE_TTL_MS = 5 * 60 * 1000;
const stateStore = new Map<string, number>();

function cleanup(now: number) {
    for (const [key, expiresAt] of stateStore.entries()) {
        if (expiresAt <= now) {
            stateStore.delete(key);
        }
    }
}

export function issueOauthState(): string {
    const now = Date.now();
    cleanup(now);
    const state = randomBytes(16).toString('hex');
    stateStore.set(state, now + STATE_TTL_MS);
    return state;
}

export function consumeOauthState(state: string): boolean {
    const now = Date.now();
    cleanup(now);
    const expiresAt = stateStore.get(state);
    if (!expiresAt) return false;
    stateStore.delete(state);
    return expiresAt > now;
}
