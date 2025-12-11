"use client";
import React, { useState } from 'react';

export default function TicketForm({ onCreated } : { onCreated?: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/tickets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, description, createdById: 1 }) });
    setTitle('');
    setDescription('');
    onCreated?.();
  }

  return (
    <form onSubmit={submit}>
      <div>
        <input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <textarea placeholder="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <button type="submit">Crear ticket</button>
    </form>
  );
}
