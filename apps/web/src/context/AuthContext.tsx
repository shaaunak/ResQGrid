import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest, getAuthToken, removeAuthToken, setAuthToken } from '../api/client';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  loginAsPersona: (role: UserRole) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  role: UserRole | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const PERSONA_CREDENTIALS: Record<UserRole, { email: string; pass: string; title: string }> = {
  CITIZEN: { email: 'citizen@resqgrid.org', pass: 'Emergency@2026', title: 'Citizen Requester' },
  OPERATOR: { email: 'operator@resqgrid.org', pass: 'Emergency@2026', title: 'Command Center Operator' },
  RESPONDER: { email: 'responder@resqgrid.org', pass: 'Emergency@2026', title: 'Field Responder Captain' },
  COORDINATOR: { email: 'coordinator@resqgrid.org', pass: 'Emergency@2026', title: 'Relief Logistics Coordinator' },
  ADMIN: { email: 'admin@resqgrid.org', pass: 'Emergency@2026', title: 'System Administrator' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getAuthToken());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      const storedToken = getAuthToken();
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const profile = await apiRequest<User>('/auth/me');
        setUser(profile);
      } catch (e) {
        removeAuthToken();
        setTokenState(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (email: string, pass: string): Promise<User> => {
    const res = await apiRequest<{ access_token: string; role: UserRole }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password: pass }),
    });
    setAuthToken(res.access_token);
    setTokenState(res.access_token);

    const profile = await apiRequest<User>('/auth/me');
    setUser(profile);
    return profile;
  };

  const loginAsPersona = async (role: UserRole): Promise<User> => {
    const cred = PERSONA_CREDENTIALS[role];
    return login(cred.email, cred.pass);
  };

  const logout = () => {
    removeAuthToken();
    setTokenState(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        loginAsPersona,
        logout,
        isAuthenticated: !!user,
        role: user ? user.role : null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

