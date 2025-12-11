'use client';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';

export interface Ticket {
  id: number;
  title: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
}

const statusColor = {
  OPEN: 'blue',
  IN_PROGRESS: 'yellow',
  RESOLVED: 'green',
  CLOSED: 'gray',
} as const;

const priorityColor = {
  LOW: 'green',
  MEDIUM: 'yellow',
  HIGH: 'red',
} as const;

export const TicketCard = ({ ticket, onDeleted, onUpdated }: { ticket: Ticket; onDeleted?: (id: number) => void; onUpdated?: (t: Ticket) => void }) => {
  const { user } = useAuth();
  const href = user?.role === 'AGENT' ? `/tickets/${ticket.id}?edit=1` : `/tickets/${ticket.id}`;
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusLocal, setStatusLocal] = useState(ticket.status);
  const [priorityLocal, setPriorityLocal] = useState(ticket.priority);
  const [comment, setComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [comments, setComments] = useState<Array<{id: number, message: string, createdAt: string, author: {name: string, role: string}}>>([]);

  const loadComments = async () => {
    try {
      const res = await fetch(`/api/comments/${ticket.id}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error('Error loading comments', err);
    }
  };

  useEffect(() => {
    loadComments();
  }, [ticket.id]);

  const handleDelete = async () => {
    if (!user || user.role !== 'AGENT') return;
    if (!confirm('¿Confirmas eliminar este ticket?')) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/tickets/${ticket.id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (res.ok) {
        onDeleted?.(ticket.id);
      } else {
        alert(data.message || 'Error al eliminar ticket');
      }
    } catch (err) {
      console.error(err);
      alert('Error al eliminar ticket');
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!user || user.role !== 'AGENT') return;
    try {
      setSaving(true);
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusLocal, priority: priorityLocal }),
      });
      const data = await res.json();
      if (res.ok) {
        onUpdated?.(data.ticket);
      } else {
        console.error('[TicketCard] update failed', res.status, data);
        alert((data && data.message) ? `${data.message} (status ${res.status})` : `Error al actualizar ticket (status ${res.status})`);
      }
    } catch (err) {
      console.error(err);
      alert('Error al actualizar ticket');
    } finally {
      setSaving(false);
    }
  };

  const handleComment = async () => {
    if (!user || user.role !== 'AGENT' || !comment.trim()) return;
    try {
      setCommenting(true);
      const res = await fetch('/api/comments', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticket.id, message: comment }),
      });
      const data = await res.json();
      if (res.ok) {
        setComment('');
        loadComments();
      } else {
        alert(data.message || 'Error al agregar comentario');
      }
    } catch (err) {
      console.error(err);
      alert('Error al agregar comentario');
    } finally {
      setCommenting(false);
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow p-4 border border-slate-100 mb-4`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-slate-900 mb-1">{ticket.title}</h3>
          <p className="text-xs text-slate-500">
            Creado: {new Date(ticket.createdAt).toLocaleString()}
          </p>
          <div className="mt-2 flex gap-2">
            <Badge color={statusColor[ticket.status]}>Estado: {ticket.status}</Badge>
            <Badge color={priorityColor[ticket.priority]}>Prioridad: {ticket.priority}</Badge>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {user?.role === 'AGENT' && (
            <div className="flex items-center gap-2 flex-wrap">
              <select value={statusLocal} onChange={(e) => setStatusLocal(e.target.value as any)} className="px-2 py-1 border border-slate-300 rounded text-sm bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none">
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
              <select value={priorityLocal} onChange={(e) => setPriorityLocal(e.target.value as any)} className="px-2 py-1 border border-slate-300 rounded text-sm bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none">
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
              <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
              <Button size="sm" variant="danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {user?.role === 'AGENT' && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="flex gap-2">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Escribe un comentario..."
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-400"
              onKeyPress={(e) => { if (e.key === 'Enter') handleComment(); }}
            />
            <Button size="sm" onClick={handleComment} disabled={commenting || !comment.trim()}>
              {commenting ? 'Enviando...' : 'Comentar'}
            </Button>
          </div>
          {comments.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold text-slate-600">Comentarios:</p>
              {comments.map((c) => (
                <div key={c.id} className="bg-slate-50 rounded-lg p-2">
                  <p className="text-sm text-slate-800">{c.message}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {c.author.name} ({c.author.role}) - {new Date(c.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
