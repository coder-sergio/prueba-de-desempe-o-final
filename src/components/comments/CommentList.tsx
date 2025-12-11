import React from 'react';

export default function CommentList({ comments }: { comments: any[] }) {
  return (
    <ul>
      {comments.map((c) => (
        <li key={c.id}><strong>{c.author?.name}</strong>: {c.message}</li>
      ))}
    </ul>
  );
}
