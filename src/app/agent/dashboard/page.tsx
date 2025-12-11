'use client';

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TicketCard, Ticket } from '@/components/tickets/TicketCard';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function AgentDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [message, setMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL'|'OPEN'|'IN_PROGRESS'|'RESOLVED'|'CLOSED'>('ALL');
  const [filterPriority, setFilterPriority] = useState<'ALL'|'LOW'|'MEDIUM'|'HIGH'>('ALL');
  const [query, setQuery] = useState('');
  const [agents, setAgents] = useState<Array<{id:number,name:string}>>([]);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'AGENT')) {
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

  const loadAgents = async () => {
    const res = await fetch('/api/users', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setAgents(data.agents || []);
    }
  };

  useEffect(() => {
    if (user) {
      loadAgents();
      loadTickets();
    }
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

  const applyFilters = async () => {
    const params = new URLSearchParams();
    if (filterStatus && filterStatus !== 'ALL') params.set('status', filterStatus);
    if (filterPriority && filterPriority !== 'ALL') params.set('priority', filterPriority);
    if (query) params.set('q', query);
    const res = await fetch('/api/tickets?' + params.toString(), { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setTickets(data.tickets);
    }
  };

  // Apply filters automatically when they change
  useEffect(() => {
    if (user) {
      applyFilters();
    }
  }, [filterStatus, filterPriority, query, user]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-indigo-700">Mis Tickets</h1>
          <p className="text-sm text-slate-500">
            Hola, {user.name}. Crea y revisa el estado de tus tickets de soporte.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="danger" onClick={async () => { await logout(); router.push('/login'); }}>
            Salir
          </Button>
        </div>
      </header>

      <Card>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold">Crear nuevo ticket</h2>
          <div className="flex items-center gap-2">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="px-2 py-1 border rounded">
              <option value="ALL">Todos</option>
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as any)} className="px-2 py-1 border rounded">
              <option value="ALL">Todas las prioridades</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
            <input placeholder="Buscar..." value={query} onChange={(e) => setQuery(e.target.value)} className="px-2 py-1 border rounded" />
          </div>
        </div>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="text-sm text-slate-700">Título *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="text-sm text-slate-700">Descripción *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="text-sm text-slate-700">Prioridad</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-400"
            >
              <option value="LOW">Baja</option>
              <option value="MEDIUM">Media</option>
              <option value="HIGH">Alta</option>
            </select>
          </div>
          {message && <p className="text-sm text-slate-600">{message}</p>}
          <Button type="submit">Crear Ticket</Button>
        </form>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {tickets.map((t) => (
          <TicketCard
            key={t.id}
            ticket={t}
            onDeleted={(id) => setTickets((prev) => prev.filter((x) => x.id !== id))}
            onUpdated={(updated) => setTickets((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))}
          />
        ))}
      </div>
    </div>
  );
}
