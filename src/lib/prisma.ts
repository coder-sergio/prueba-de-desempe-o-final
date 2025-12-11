// Load Prisma client robustly to support environments where the client is exported
// as a named or default export (different Prisma build/packaging variations).
let PrismaClient: any;
try {
  // Try to require the package at runtime to handle CJS/ESM interop.
  // Using require keeps TypeScript compilation happy across module systems.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pkg = require('@prisma/client');
  PrismaClient = pkg?.PrismaClient ?? pkg?.default ?? pkg;
} catch (e) {
  PrismaClient = undefined;
}

const globalForPrisma = global as unknown as { prisma?: any };

let prismaInstance: any;
try {
  prismaInstance = globalForPrisma.prisma ?? new PrismaClient();
  // Test simple para asegurar que el cliente se inicializó correctamente
  // (no await aquí para no bloquear el módulo)
} catch (e) {
  console.error('PrismaClient falló al inicializar, usando fallback en memoria:', (e as any)?.message ?? String(e));
  // Fallback en memoria (solo para desarrollo si no hay DB disponible)
  const users: any[] = [
    { id: 1, name: 'Cliente Demo', email: 'client@helpdeskpro.com', password: '123456', role: 'CLIENT' },
    { id: 2, name: 'Agente Demo', email: 'agent@helpdeskpro.com', password: '12345678', role: 'AGENT' },
  ];
  let ticketId = 1;
  const tickets: any[] = [
    {
      id: ticketId,
      title: 'No puedo acceder a mi cuenta',
      description: 'Al intentar iniciar sesión recibo un error desconocido.',
      priority: 'MEDIUM',
      status: 'OPEN',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: 1,
      assignedToId: 2,
      comments: [],
    },
  ];
  let commentId = 1;
  const comments: any[] = [
    { id: commentId, message: 'Gracias por reportarlo — estamos revisando.', createdAt: new Date(), ticketId: 1, authorId: 2 },
  ];

  prismaInstance = {
    user: {
      findUnique: async ({ where }: any) => {
        if (where.email) return users.find((u) => u.email === where.email) ?? null;
        if (where.id) return users.find((u) => u.id === where.id) ?? null;
        return null;
      },
      findFirst: async () => users[0] ?? null,
      findMany: async ({ where, select }: any) => {
        let filtered = users;
        if (where?.role) filtered = users.filter((u) => u.role === where.role);
        if (select) return filtered.map((u: any) => {
          const obj: any = {};
          Object.keys(select).forEach((k) => { if (select[k]) obj[k] = u[k]; });
          return obj;
        });
        return filtered;
      },
      create: async ({ data }: any) => {
        const id = users.length + 1;
        const u = { id, ...data };
        users.push(u);
        return u;
      },
      deleteMany: async () => ({ count: (users.length = 0) }),
    },
    ticket: {
      findMany: async ({ where }: any) => {
        let filtered = tickets;
        
        if (where?.createdById) {
          filtered = filtered.filter((t) => t.createdById === where.createdById);
        }
        
        if (where?.status) {
          filtered = filtered.filter((t) => t.status === where.status);
        }
        
        if (where?.priority) {
          filtered = filtered.filter((t) => t.priority === where.priority);
        }
        
        if (where?.assignedToId) {
          filtered = filtered.filter((t) => t.assignedToId === where.assignedToId);
        }
        
        if (where?.OR) {
          // Search in title or description
          filtered = filtered.filter((t) => {
            return where.OR.some((condition: any) => {
              if (condition.title?.contains) {
                return t.title.toLowerCase().includes(condition.title.contains.toLowerCase());
              }
              if (condition.description?.contains) {
                return t.description.toLowerCase().includes(condition.description.contains.toLowerCase());
              }
              return false;
            });
          });
        }
        
        return filtered;
      },
      create: async ({ data }: any) => {
        ticketId += 1;
        const t = { id: ticketId, createdAt: new Date(), updatedAt: new Date(), status: 'OPEN', comments: [], ...data };
        tickets.push(t);
        return t;
      },
      findUnique: async ({ where }: any) => tickets.find((t) => t.id === where.id) ?? null,
      update: async ({ where, data }: any) => {
        const t = tickets.find((tk) => tk.id === where.id);
        if (!t) throw new Error('Not found');
        Object.assign(t, data, { updatedAt: new Date() });
        return t;
      },
      delete: async ({ where }: any) => {
        const idx = tickets.findIndex((tk) => tk.id === where.id);
        if (idx === -1) throw new Error('Not found');
        const [d] = tickets.splice(idx, 1);
        return d;
      },
    },
    comment: {
      create: async ({ data }: any) => {
        commentId += 1;
        const c = { id: commentId, createdAt: new Date(), ...data };
        comments.push(c);
        return c;
      },
      findMany: async ({ where, include }: any) => {
        const filtered = comments.filter((c) => c.ticketId === where.ticketId);
        if (include?.author) {
          return filtered.map((c) => ({
            ...c,
            author: users.find((u) => u.id === c.authorId) || { id: c.authorId, name: 'Unknown', role: 'CLIENT' },
          }));
        }
        return filtered;
      },
      deleteMany: async () => ({ count: (comments.length = 0) }),
    },
    $disconnect: async () => {},
  };
}

export const prisma = prismaInstance;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
