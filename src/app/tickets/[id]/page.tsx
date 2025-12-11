'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface Comment {
  id: number;
  message: string;
  createdAt: string;
  author: { name: string; role: 'CLIENT' | 'AGENT' };
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ticket, setTicket] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [status, setStatus] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [assignedToId, setAssignedToId] = useState<number | undefined>(undefined);
  const [message, setMessage] = useState('');
  const [available, setAvailable] = useState<Array<{id:number,title:string}> | null>(null);
  const [editing, setEditing] = useState(false);

  const loadTicket = async () => {
    try {
      const res = await fetch(`/api/tickets/${id}`, { credentials: 'include' });
      console.debug('[TicketDetail] loadTicket status', res.status);
      const data = await res.json();
      console.debug('[TicketDetail] loadTicket body', data);
      if (res.ok) {
        setTicket(data.ticket);
        setStatus(data.ticket.status);
        setPriority(data.ticket.priority);
        setAssignedToId(data.ticket.assignedToId ?? undefined);
        setAvailable(null);
      } else {
        // Si la API devuelve available, guardarla para mostrar enlaces
        if (data?.available) setAvailable(data.available.map((t: any) => ({ id: t.id, title: t.title })));
        setMessage(data.message || 'Error al cargar ticket');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error al cargar ticket');
    }
  };

  const loadComments = async () => {
    try {
      const res = await fetch(`/api/comments/${id}`, { credentials: 'include' });
      console.debug('[TicketDetail] loadComments status', res.status);
      const data = await res.json();
      console.debug('[TicketDetail] loadComments body', data);
      if (res.ok) {
        setComments(data.comments);
      } else {
        // ignore; comments optional
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (id) {
      loadTicket();
      loadComments();
    }
  }, [id]);

  // activar edición si la query param edit=1 está presente
  useEffect(() => {
    const edit = searchParams?.get('edit');
    if (edit === '1') setEditing(true);
  }, [searchParams]);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    const res = await fetch('/api/comments', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId: Number(id), message: newComment }),
    });
    const data = await res.json();
    if (res.ok) {
      setNewComment('');
      loadComments();
    } else {
      setMessage(data.message || 'Error al comentar');
    }
  };

  const handleUpdateTicket = async () => {
    if (!user || user.role !== 'AGENT') return;
    const res = await fetch(`/api/tickets/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, priority, assignedToId }),
    });
    const data = await res.json();
    setMessage(data.message || '');
    if (res.ok) loadTicket();
  };

  const handleDelete = async () => {
    if (!user || user.role !== 'AGENT') return;
    if (!confirm('¿Confirmas eliminar este ticket?')) return;
    const res = await fetch(`/api/tickets/${id}`, { method: 'DELETE', credentials: 'include' });
    const data = await res.json();
    if (res.ok) {
      router.push('/agent/dashboard');
    } else {
      setMessage(data.message || 'Error al eliminar');
    }
  };

  if (!ticket) {
    return (
      <div>
        <p>{message || 'Cargando ticket...'}</p>
        {available && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Tickets disponibles:</h3>
            <ul className="space-y-2">
              {available.map((t) => (
                <li key={t.id}>
                  <a className="text-indigo-600 hover:underline" href={`/tickets/${t.id}?edit=1`}>{t.title} (#{t.id})</a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-slate-800 mb-2">{ticket.title}</h1>
        <p className="text-sm text-slate-600 mb-2">{ticket.description}</p>
        <div className="flex gap-2 mb-2">
          <Badge color="blue">Estado: {ticket.status}</Badge>
          <Badge color="red">Prioridad: {ticket.priority}</Badge>
        </div>
        <p className="text-xs text-slate-500">
          Creado por: {ticket.createdBy.name} - {new Date(ticket.createdAt).toLocaleString()}
        </p>

        {user?.role === 'AGENT' && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Actualizar estado / prioridad</h2>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing((v) => !v)}>{editing ? 'Ocultar' : 'Editar'}</Button>
              </div>
            </div>

            {editing && (
              <div className="flex gap-2 mt-2">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="px-3 py-1 border rounded-lg text-sm"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="px-3 py-1 border rounded-lg text-sm"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </select>
                <input
                  type="number"
                  placeholder="Asignar a (userId)"
                  value={assignedToId ?? ''}
                  onChange={(e) => setAssignedToId(Number(e.target.value) || undefined)}
                  className="px-3 py-1 border rounded-lg text-sm"
                />
                <Button size="sm" onClick={handleUpdateTicket}>
                  Guardar
                </Button>
                <Button size="sm" variant="outline" onClick={handleDelete}>
                  Eliminar
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold mb-2">Comentarios</h2>
        <div className="space-y-2 mb-3">
          {comments.map((c) => (
            <div key={c.id} className="border-b pb-2 last:border-b-0">
              <p className="text-sm text-slate-800">{c.message}</p>
              <p className="text-[11px] text-slate-500">
                {c.author.name} ({c.author.role}) -{' '}
                {new Date(c.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-sm text-slate-500">Aún no hay comentarios.</p>
          )}
        </div>

        <form onSubmit={handleComment} className="space-y-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-400"
            placeholder="Escribe un comentario..."
          />
          <Button type="submit" size="sm">
            Agregar comentario
          </Button>
        </form>
        {message && <p className="text-sm text-slate-600 mt-2">{message}</p>}
      </Card>
    </div>
  );
}
