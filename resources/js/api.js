const BASE = '/api/v1';
const TOKEN_KEY = 'pos_token';

export const tokenStore = {
    get: () => localStorage.getItem(TOKEN_KEY),
    set: (token) => localStorage.setItem(TOKEN_KEY, token),
    clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
    constructor(message, status, errors) {
        super(message);
        this.status = status;
        this.errors = errors ?? {};
    }
}

export async function api(path, { method = 'GET', body, params } = {}) {
    const query = params
        ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null))
        : '';

    const response = await fetch(`${BASE}${path}${query}`, {
        method,
        headers: {
            Accept: 'application/json',
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            ...(tokenStore.get() ? { Authorization: `Bearer ${tokenStore.get()}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 204) {
        return null;
    }

    const payload = await response.json().catch(() => ({}));

    if (response.status === 401 && tokenStore.get()) {
        tokenStore.clear();
        window.dispatchEvent(new Event('pos:unauthorized'));
    }

    if (!response.ok) {
        throw new ApiError(payload.message ?? 'Something went wrong', response.status, payload.errors);
    }

    return payload;
}
