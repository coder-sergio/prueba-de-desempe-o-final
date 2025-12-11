import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  try {
    const { ticketId, message } = await req.json();

    if (!ticketId || !message) {
      return NextResponse.json({ message: 'ticketId y mensaje requeridos' }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        message,
        ticketId: Number(ticketId),
        authorId: user.id,
      },
    });

    return NextResponse.json({ comment, message: 'Comentario agregado' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al agregar comentario' }, { status: 500 });
  }
}
