import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    let user: any, error: any;
    try {
      const result = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('ativo', true)
        .single();
      user = result.data;
      error = result.error;
    } catch (dbErr: any) {
      console.error('Supabase init error:', dbErr);
      return NextResponse.json(
        { error: 'Erro de configuração do servidor', debug: dbErr?.message || String(dbErr) },
        { status: 500 }
      );
    }

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Credenciais inválidas', debug: error.message }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    // Comparar password com hash bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role }
    });
    response.cookies.set('pgr_session', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    const stack = error instanceof Error ? error.stack : '';
    return NextResponse.json({ error: 'Erro interno do servidor', debug: msg, stack: stack?.split('\n').slice(0, 5) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('pgr_session')?.value;

    if (!sessionId) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, username, email, role, email_notificacoes')
      .eq('id', sessionId)
      .eq('ativo', true)
      .single();

    if (error || !user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true, user });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('pgr_session', '', { maxAge: 0 });
  return response;
}
