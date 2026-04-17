import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendResetPasswordEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email, username } = await request.json();

    if (!email && !username) {
      return NextResponse.json(
        { error: 'Forneça o email ou nome de utilizador.' },
        { status: 400 }
      );
    }

    // Buscar utilizador
    let query = supabase
      .from('users')
      .select('*')
      .eq('ativo', true);

    if (email) {
      query = query.eq('email', email);
    } else {
      query = query.eq('username', username);
    }

    const { data: user, error } = await query.single();

    if (error || !user) {
      // Não revelar se o utilizador existe (segurança)
      return NextResponse.json({
        success: true,
        message: 'Se o email/utilizador existir, receberá um link de redefinição.'
      });
    }

    // Gerar token seguro
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Invalidar tokens anteriores
    await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('user_id', user.id)
      .eq('used', false);

    // Guardar novo token
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) throw tokenError;

    // Enviar email
    await sendResetPasswordEmail({
      to: user.email,
      name: user.name || user.username,
      token,
    });

    return NextResponse.json({
      success: true,
      message: 'Email de redefinição enviado com sucesso.'
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Erro ao processar pedido' }, { status: 500 });
  }
}
