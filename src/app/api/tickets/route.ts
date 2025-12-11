import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const priority = searchParams.get('priority');
  const assignedToId = searchParams.get('assignedToId');
  const q = searchParams.get('q');
  const role = user.role;

  const where: any = {};

  if (role === 'CLIENT') {
    where.createdById = user.id;
  }

  if (status && status !== 'ALL') {
    where.status = status.toUpperCase();
  }

  if (priority && priority !== 'ALL') {
    where.priority = priority.toUpperCase();
  }

  if (assignedToId) {
    where.assignedToId = Number(assignedToId);
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];
  }

  const tickets = await prisma.ticket.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ tickets });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  }

  // Permitimos que tanto CLIENT como AGENT creen tickets. Los clientes crean para sí mismos.
  // Los agentes pueden crear tickets y opcionalmente indicar createdById (por ejemplo crear en nombre de un cliente).
  try {
    const { title, description, priority, createdById, assignedToId } = await req.json();

    if (!title || !description) {
      return NextResponse.json({ message: 'Título y descripción son obligatorios' }, { status: 400 });
    }

    let creatorId: number;
    if (user.role === 'CLIENT') {
      creatorId = user.id;
    } else {
      // AGENT
      creatorId = createdById ?? user.id;
    }

    const ticket = await prisma.ticket.create({
      data: {
        title,
        description,
        priority: (priority as string)?.toUpperCase?.() || 'MEDIUM',
        createdById: creatorId,
        assignedToId: assignedToId ?? undefined,
      },
    });

    return NextResponse.json({ ticket, message: 'Ticket creado correctamente' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al crear ticket' }, { status: 500 });
  }
}
