'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('client@helpdeskpro.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      // Después de login, pedir /api/auth/me otra vez o usar ctx
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user.role === 'CLIENT') router.push('/client/dashboard');
      else router.push('/agent/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <Card>
        <h1 className="text-xl font-bold text-slate-800 mb-4 text-center">HelpDeskPro Login</h1>
        <form onSubmit={handleSubmit} className="space-y-3 w-80">
          <div>
            <label className="text-sm text-slate-700">Email</label>
            <input
              type="email"
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white text-black focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-slate-700">Contraseña</label>
            <input
              type="password"
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm bg-white text-black focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Iniciar sesión'}
          </Button>
          <p className="text-[11px] text-slate-500 mt-1">
            Usa client@helpdeskpro.com / 123456 o agent@helpdeskpro.com / 123456
          </p>
        </form>
      </Card>
    </div>
  );
}
