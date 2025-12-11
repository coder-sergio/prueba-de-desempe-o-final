import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // Buscamos el usuario por email (no hacemos validaciones de password)
    const user = await prisma.user.findUnique({ where: { email } });

    // DEBUG: imprimir info de depuración en desarrollo
    try {
      console.debug('[auth/login] intento:', { email, userFound: !!user });
    } catch (e) {
      // ignore
    }

    if (!user) {
      return NextResponse.json({ message: 'Credenciales inválidas' }, { status: 401 });
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // si es AGENT, redirigimos al dashboard de agent (útil en dev)
    const redirectTo = user.role === 'AGENT' ? '/agent/dashboard' : undefined;

    const body: any = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
    if (redirectTo) body.redirectTo = redirectTo;

    const res = NextResponse.json(body);

    // Cookie segura httpOnly para el token real
    res.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // en segundos
    });

    return res;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Error en el servidor' }, { status: 500 });
  }
}
