'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Role = 'CLIENT' | 'AGENT';

interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  // login devuelve el objeto de respuesta (contiene user y opcional redirectTo)
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar sesión al inicio
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    // DEBUG temporal: imprimir información útil para depurar en el navegador
    try {
      console.debug('[AuthContext] /api/auth/login status', res.status);
      console.debug('[AuthContext] /api/auth/login headers set-cookie', res.headers.get('set-cookie'));
    } catch (e) {
      // ignore
    }

    const contentType = res.headers.get('content-type') || '';

    if (!res.ok) {
      // intentar parsear JSON con mensaje
      if (contentType.includes('application/json')) {
        const data = await res.json();
        console.debug('[AuthContext] login error body', data);
        throw new Error(data.message || 'Error al iniciar sesión');
      }
      // si no es JSON, lanzar genérico
      throw new Error('Error al iniciar sesión');
    }

    if (contentType.includes('application/json')) {
      const data = await res.json();
      console.debug('[AuthContext] login success body', data);
      setUser(data.user);
      return data; // devolver todo (user + redirectTo si existe)
    }

    // Si la respuesta no es JSON, lanzar
    throw new Error('Respuesta inválida del servidor');
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (err) {
      // ignore
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
