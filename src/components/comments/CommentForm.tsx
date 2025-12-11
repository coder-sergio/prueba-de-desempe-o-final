"use client";
import React, { useState } from 'react';

export default function CommentForm({ ticketId, onAdded } : { ticketId: number, onAdded?: () => void }) {
  const [message, setMessage] = useState('');
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message, ticketId, authorId: 1 }) });
    setMessage('');
    onAdded?.();
  }
  return (
    <form onSubmit={submit}>
      <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Comentario" />
      <button type="submit">Enviar</button>
    </form>
  );
}
