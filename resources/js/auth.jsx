import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, tokenStore } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(Boolean(tokenStore.get()));

    useEffect(() => {
        const handleUnauthorized = () => setUser(null);
        window.addEventListener('pos:unauthorized', handleUnauthorized);

        if (tokenStore.get()) {
            api('/auth/me')
                .then((response) => setUser(response.data))
                .catch(() => tokenStore.clear())
                .finally(() => setIsLoading(false));
        }

        return () => window.removeEventListener('pos:unauthorized', handleUnauthorized);
    }, []);

    const login = useCallback(async (email, password) => {
        const response = await api('/auth/login', { method: 'POST', body: { email, password } });
        tokenStore.set(response.data.token);
        setUser(response.data.user);
    }, []);

    const logout = useCallback(async () => {
        try {
            await api('/auth/logout', { method: 'POST' });
        } finally {
            tokenStore.clear();
            setUser(null);
        }
    }, []);

    /** True when the signed-in user holds the given permission (super admin holds all of them). */
    const can = useCallback((permission) => Boolean(user?.permissions?.includes(permission)), [user]);

    return <AuthContext.Provider value={{ user, isLoading, login, logout, can }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
