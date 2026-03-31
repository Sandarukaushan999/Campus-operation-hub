import { createContext, useContext, useMemo, useState } from "react";

const STORAGE_KEY = "campus_auth_session";

const AuthContext = createContext(null);

const getStoredSession = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AppProviders = ({ children }) => {
  const [session, setSession] = useState(() => getStoredSession());

  const login = (authData) => {
    const next = {
      token: authData.token,
      user: {
        id: authData.userId,
        fullName: authData.fullName,
        email: authData.email,
        role: authData.role,
      },
    };
    setSession(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(session?.token),
      token: session?.token ?? null,
      user: session?.user ?? null,
      login,
      logout,
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used inside AppProviders");
  }
  return context;
};

export const authStorageKey = STORAGE_KEY;