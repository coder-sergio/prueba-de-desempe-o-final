import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();

  const agent = await prisma.user.create({
    data: {
      name: 'Agente Demo',
      email: 'agent@helpdeskpro.com',
      password: '123456',
      role: 'AGENT',
    },
  });

  const client = await prisma.user.create({
    data: {
      name: 'Cliente Demo',
      email: 'client@helpdeskpro.com',
      password: '123456',
      role: 'CLIENT',
    },
  });

  const ticket = await prisma.ticket.create({
    data: {
      title: 'No puedo acceder a mi cuenta',
      description: 'Al intentar iniciar sesión recibo un error desconocido.',
      priority: 'MEDIUM',
      createdById: client.id,
      assignedToId: agent.id,
    },
  });

  await prisma.comment.create({
    data: {
      message: 'Gracias por reportarlo — estamos revisando.',
      ticketId: ticket.id,
      authorId: agent.id,
    },
  });

  console.log('Seed completado');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
