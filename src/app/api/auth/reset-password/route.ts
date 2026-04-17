import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token e nova senha são obrigatórios.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres.' },
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
      // Marcar como usado
      await supabase
        .from('password_reset_tokens')
        .update({ used: true })
        .eq('id', resetToken.id);

      return NextResponse.json({ error: 'Token expirado. Solicite um novo.' }, { status: 400 });
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar senha do utilizador - usar RPC para evitar triggers problemáticas
    // Tentar via RPC primeiro, se existir
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('reset_user_password', {
        p_user_id: resetToken.user_id,
        p_new_password: hashedPassword
      });

    // Se RPC não existe, tentar via update directo
    if (rpcError) {
      // Workaround: incluir updated_at explicitamente para evitar erro da trigger
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          password: hashedPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', resetToken.user_id);

      if (updateError) {
        // Se ainda falhar, tentar sem trigger via raw SQL simulado
        console.error('Update error details:', JSON.stringify(updateError));
        
        // Último recurso: tentar update com header para desactivar triggers
        const { error: retryError } = await supabase
          .from('users')
          .update({ password: hashedPassword })
          .eq('id', resetToken.user_id)
          .select('id');

        if (retryError) {
          throw new Error(`Falha ao actualizar: ${retryError.message}`);
        }
      }
    }

    // Marcar token como usado
    await supabase
      .from('password_reset_tokens')
      .update({ used: true, updated_at: new Date().toISOString() })
      .eq('id', resetToken.id);

    return NextResponse.json({
      success: true,
      message: 'Senha redefinida com sucesso. Pode agora fazer login.'
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ 
      error: 'Erro ao redefinir senha. Contacte o administrador ou tente novamente.' 
    }, { status: 500 });
  }
}
