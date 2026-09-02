import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({ loading: true, authenticated: false, user: null });

  const refresh = async () => {
    try {
      const data = await authApi.me();
      setAuth({ loading: false, ...data });
    } catch {
      setAuth({ loading: false, authenticated: false, user: null });
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const logout = async () => {
    await authApi.logout();
    await refresh();
  };

  return <AuthContext.Provider value={{ ...auth, refresh, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
