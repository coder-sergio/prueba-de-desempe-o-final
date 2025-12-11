import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getUserFromRequest } from '@/lib/auth';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  console.debug('[api/tickets/[id]] GET id', params.id, 'parsed', id);

  let ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      comments: {
        include: { author: true },
        orderBy: { createdAt: 'asc' },
      },
      createdBy: true,
      assignedTo: true,
    },
  });

  // Si no lo encontró, intentar con parseInt y findFirst (fallback para entornos dev)
  if (!ticket) {
    const parsed = parseInt(resolvedParams.id, 10);
    if (!Number.isNaN(parsed)) {
      ticket = await prisma.ticket.findFirst({
        where: { id: parsed },
        include: {
          comments: { include: { author: true }, orderBy: { createdAt: 'asc' } },
          createdBy: true,
          assignedTo: true,
        },
      });
      console.debug('[api/tickets/[id]] fallback findFirst parsed', parsed, 'result', !!ticket);
    }
  }

  console.debug('[api/tickets/[id]] found ticket', ticket);

  if (!ticket) {
    // En desarrollo devolvemos también la lista de tickets disponibles para debug
    try {
      const all = await prisma.ticket.findMany({ select: { id: true, title: true }, orderBy: { createdAt: 'desc' } });
      return NextResponse.json({ message: 'Ticket no encontrado', available: all }, { status: 404 });
    } catch (e) {
      return NextResponse.json({ message: 'Ticket no encontrado' }, { status: 404 });
    }
  }

  if (user.role === 'CLIENT' && ticket.createdById !== user.id) {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  return NextResponse.json({ ticket });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== 'AGENT') {
    return NextResponse.json({ message: 'Solo agentes pueden actualizar tickets' }, { status: 403 });
  }

  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  const body = await req.json();
  const { status, priority, assignedToId } = body;

  // Validaciones básicas para devolver errores claros
  const allowedStatus = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  const allowedPriority = ['LOW', 'MEDIUM', 'HIGH'];

  if (status && !allowedStatus.includes(String(status).toUpperCase())) {
    return NextResponse.json({ message: 'Estado inválido', detail: { allowedStatus } }, { status: 400 });
  }

  if (priority && !allowedPriority.includes(String(priority).toUpperCase())) {
    return NextResponse.json({ message: 'Prioridad inválida', detail: { allowedPriority } }, { status: 400 });
  }

  const assignedToIdNum = assignedToId == null ? undefined : Number(assignedToId);
  if (assignedToId != null && Number.isNaN(assignedToIdNum)) {
    return NextResponse.json({ message: 'assignedToId debe ser un número o null' }, { status: 400 });
  }

  try {
    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        status: status?.toUpperCase(),
        priority: priority?.toUpperCase(),
        assignedToId: assignedToIdNum ?? undefined,
      },
    });

    return NextResponse.json({ ticket, message: 'Ticket actualizado correctamente' });
  } catch (error) {
    console.error('[api/tickets/[id]] PUT error', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ message: 'Ticket no encontrado' }, { status: 404 });
    }
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ message: 'Error al actualizar ticket', error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getUserFromRequest(req);
  if (!user || user.role !== 'AGENT') {
    return NextResponse.json({ message: 'Solo agentes pueden eliminar tickets' }, { status: 403 });
  }

  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  try {
    await prisma.ticket.delete({ where: { id } });
    return NextResponse.json({ message: 'Ticket eliminado' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error al eliminar ticket' }, { status: 500 });
  }
}
