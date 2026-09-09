import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('tms_user'));
      if (u && u.role) u.role = String(u.role).toLowerCase().trim();
      return u;
    } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('tms_token'));

  const login = useCallback(async (email, password) => {
    const data = await api.login(email, password);
    const normalizedUser = {
      ...data.user,
      role: (data.user?.role || '').toLowerCase().trim()
    };
    localStorage.setItem('tms_token', data.token);
    localStorage.setItem('tms_user', JSON.stringify(normalizedUser));
    setToken(data.token);
    setUser(normalizedUser);
    return normalizedUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('tms_token');
    localStorage.removeItem('tms_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
