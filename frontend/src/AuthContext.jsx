import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './client.js';

const AuthContext = createContext(null);
const TOKEN_KEY = 'pawcare-token';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    let active = true;
    if (!token) {
      setUser(null);
      setLoading(false);
      return undefined;
    }
    api
      .me(token)
      .then(({ user: profile }) => {
        if (active) setUser(profile);
      })
      .catch(() => {
        if (active) {
          localStorage.removeItem(TOKEN_KEY);
          setToken('');
          setUser(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  // Stores the session. Only called once the email is verified.
  function startSession({ user: nextUser, token: nextToken }) {
    localStorage.setItem(TOKEN_KEY, nextToken);
    setUser(nextUser);
    setToken(nextToken);
  }

  // Unverified accounts get a token but no session, so the code screen can show first.
  async function login(payload) {
    const result = await api.login(payload);
    if (result.user.emailVerified) startSession(result);
    return result;
  }

  // Creates the account without signing in.
  async function register(payload) {
    return api.register(payload);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken('');
    setUser(null);
  }

  const value = useMemo(
    () => ({ token, user, loading, login, register, logout, setUser, startSession }),
    [token, user, loading]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}