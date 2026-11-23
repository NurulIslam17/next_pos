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

export async function api(path, { method = 'GET', body, params, responseType } = {}) {
    const query = params
        ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null))
        : '';
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

    const response = await fetch(`${BASE}${path}${query}`, {
        method,
        headers: {
            Accept: responseType === 'blob' ? 'application/pdf' : 'application/json',
            ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
            ...(tokenStore.get() ? { Authorization: `Bearer ${tokenStore.get()}` } : {}),
        },
        body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401 && tokenStore.get()) {
        tokenStore.clear();
        window.dispatchEvent(new Event('pos:unauthorized'));
    }

    if (response.status === 204) {
        return null;
    }

    if (responseType === 'blob') {
        if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new ApiError(payload.message ?? 'Something went wrong', response.status, payload.errors);
        }

        const blob = await response.blob();
        const disposition = response.headers.get('content-disposition');
        const filename = disposition?.match(/filename="?([^";]+)"?/i)?.[1];

        if (filename) {
            blob.filename = decodeURIComponent(filename);
        }

        return blob;
    }

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new ApiError(payload.message ?? 'Something went wrong', response.status, payload.errors);
    }

    return payload;
}
