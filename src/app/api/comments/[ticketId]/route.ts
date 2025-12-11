import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

interface Params {
  params: Promise<{ ticketId: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const resolvedParams = await params;
  const ticketId = Number(resolvedParams.ticketId);

  const comments = await prisma.comment.findMany({
    where: { ticketId },
    include: { author: true },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ comments });
}
