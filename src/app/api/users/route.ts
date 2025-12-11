import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  // Solo agentes o administradores pueden listar agentes
  if (user.role !== 'AGENT') {
    return NextResponse.json({ message: 'No autorizado' }, { status: 403 });
  }

  const agents = await prisma.user.findMany({ where: { role: 'AGENT' }, select: { id: true, name: true, email: true } });
  return NextResponse.json({ agents });
}
