'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TicketCard, Ticket } from '@/components/tickets/TicketCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function ClientDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'CLIENT')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const loadTickets = async () => {
    const res = await fetch('/api/tickets', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setTickets(data.tickets);
    }
  };

  useEffect(() => {
    if (user) loadTickets();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    const res = await fetch('/api/tickets', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, priority }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(data.message);
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      loadTickets();
    } else {
      setMessage(data.message || 'Error al crear ticket');
    }
  };

  if (!user) return null;

  return (
    <main className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Mis Tickets</h1>
          <p className="text-sm text-slate-600">
            Hola, {user.name}. Crea y revisa el estado de tus tickets de soporte.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="danger"
            onClick={async () => {
              await logout();
              router.push('/login');
            }}
          >
            Salir
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <h2 className="font-semibold mb-3">Crear nuevo ticket</h2>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="text-sm text-slate-700">Título *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-md bg-white text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-slate-700">Descripción *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 h-28 px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-slate-700">Prioridad</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
            >
              <option value="LOW">Baja</option>
              <option value="MEDIUM">Media</option>
              <option value="HIGH">Alta</option>
            </select>
          </div>
          {message && <p className="text-sm text-slate-500">{message}</p>}
          <Button type="submit">Crear Ticket</Button>
        </form>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {tickets.map((t) => (
          <TicketCard key={t.id} ticket={t} />
        ))}
      </div>
    </main>
  );
}
