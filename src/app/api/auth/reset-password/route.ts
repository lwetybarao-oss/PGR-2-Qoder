import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token e nova palavra-passe são obrigatórios.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'A palavra-passe deve ter pelo menos 6 caracteres.' },
        { status: 400 }
      );
    }

    // Buscar token válido
    const { data: resetToken, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single();

    if (tokenError || !resetToken) {
      return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 400 });
    }

    // Verificar se não expirou
    if (new Date(resetToken.expires_at) < new Date()) {
      await supabase
        .from('password_reset_tokens')
        .update({ used: true })
        .eq('id', resetToken.id);

      return NextResponse.json({ error: 'Token expirado. Solicite um novo.' }, { status: 400 });
    }

    // Hash da nova palavra-passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar senha do utilizador
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', resetToken.user_id);

    if (updateError) {
      console.error('Update password error:', JSON.stringify(updateError));
      return NextResponse.json(
        { error: `Erro ao actualizar: ${updateError.message}` },
        { status: 500 }
      );
    }

    // Marcar token como usado
    await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('id', resetToken.id);

    return NextResponse.json({
      success: true,
      message: 'Palavra-passe redefinida com sucesso. Pode agora fazer login.'
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Erro ao redefinir palavra-passe.' }, { status: 500 });
  }
}
