import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { diffDays, addDays, todayNormalized, classificarUrgencia } from '@/lib/prazos';
import { sendAlertaPrazoEmail, sendResumoDiarioEmail } from '@/lib/email';

const ALERT_THRESHOLD_DAYS = 7;

function formatDatePt(date: Date): string {
  return date.toLocaleDateString('pt-BR');
}

export async function POST(request?: NextRequest) {
  try {
    const today = todayNormalized();
    const todayStr = today.toISOString().split('T')[0];

    const { data: arguidos, error: argError } = await supabase
      .from('arguidos')
      .select('*')
      .eq('ativo', true);

    if (argError) throw argError;

    let alertasCriados = 0;
    const detalhes: { processo: string; nome: string; tipo: string; dias: number; urgencia: string }[] = [];

    // Buscar utilizadores com notificações activas
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('ativo', true)
      .eq('email_notificacoes', true);

    for (const arguido of arguidos || []) {
      // ---- 1º Prazo ----
      const detDate = new Date(arguido.data_detencao);
      const fim1 = addDays(detDate, 90);
      const dias1 = diffDays(today, fim1);

      if (dias1 <= ALERT_THRESHOLD_DAYS) {
        let mensagem: string;
        let urgencia: string;

        if (dias1 < 0) {
          urgencia = 'vencido';
          mensagem = `PRAZO VENCIDO! Prisão preventiva do processo Nº ${arguido.numero_processo} venceu há ${Math.abs(dias1)} dia(s) em ${formatDatePt(fim1)}`;
        } else if (dias1 === 0) {
          urgencia = 'critico';
          mensagem = `URGENTE! Prisão preventiva do processo Nº ${arguido.numero_processo} vence HOJE!`;
        } else if (dias1 <= 3) {
          urgencia = 'critico';
          mensagem = `Prisão preventiva do processo Nº ${arguido.numero_processo} quase a terminar: Faltam ${dias1} dia(s)`;
        } else {
          urgencia = 'alerta';
          mensagem = `Prisão preventiva do processo Nº ${arguido.numero_processo} prazo a terminar: Faltam ${dias1} dia(s)`;
        }

        // Evitar duplicados no mesmo dia
        const { data: exists } = await supabase
          .from('alerta_prazos')
          .select('id')
          .eq('arguido_id', arguido.id)
          .eq('tipo', '1_prazo')
          .gte('criado_em', `${todayStr}T00:00:00`)
          .lte('criado_em', `${todayStr}T23:59:59`)
          .limit(1);

        if (!exists || exists.length === 0) {
          const { error: insertError } = await supabase
            .from('alerta_prazos')
            .insert({ arguido_id: arguido.id, tipo: '1_prazo', mensagem });

          if (!insertError) {
            alertasCriados++;
            detalhes.push({
              processo: arguido.numero_processo,
              nome: arguido.nome_arguido,
              tipo: '1º prazo',
              dias: dias1,
              urgencia
            });

            // Enviar email para cada utilizador notificável
            if (users && users.length > 0) {
              for (const user of users) {
                await sendAlertaPrazoEmail({
                  to: user.email,
                  arguido: {
                    nome: arguido.nome_arguido,
                    processo: arguido.numero_processo,
                    crime: arguido.crime,
                    magistrado: arguido.magistrado_responsavel,
                  },
                  prazo: {
                    tipo: '1º Prazo',
                    dataFim: formatDatePt(fim1),
                    diasRestantes: dias1,
                    urgencia,
                  },
                });
              }
            }
          }
        }
      }

      // ---- 2º Prazo ----
      if (arguido.data_prorrogacao) {
        const prorDate = new Date(arguido.data_prorrogacao);
        const fim2 = addDays(prorDate, 90);
        const dias2 = diffDays(today, fim2);

        if (dias2 <= ALERT_THRESHOLD_DAYS) {
          let mensagem: string;
          let urgencia: string;

          if (dias2 < 0) {
            urgencia = 'vencido';
            mensagem = `PRAZO VENCIDO! 2º prazo do processo Nº ${arguido.numero_processo} venceu há ${Math.abs(dias2)} dia(s) em ${formatDatePt(fim2)}`;
          } else if (dias2 === 0) {
            urgencia = 'critico';
            mensagem = `URGENTE! 2º prazo do processo Nº ${arguido.numero_processo} vence HOJE!`;
          } else if (dias2 <= 3) {
            urgencia = 'critico';
            mensagem = `2º prazo do processo Nº ${arguido.numero_processo} quase a terminar: Faltam ${dias2} dia(s)`;
          } else {
            urgencia = 'alerta';
            mensagem = `2º prazo do processo Nº ${arguido.numero_processo} prazo a terminar: Faltam ${dias2} dia(s)`;
          }

          const { data: exists2 } = await supabase
            .from('alerta_prazos')
            .select('id')
            .eq('arguido_id', arguido.id)
            .eq('tipo', '2_prazo')
            .gte('criado_em', `${todayStr}T00:00:00`)
            .lte('criado_em', `${todayStr}T23:59:59`)
            .limit(1);

          if (!exists2 || exists2.length === 0) {
            const { error: insertError2 } = await supabase
              .from('alerta_prazos')
              .insert({ arguido_id: arguido.id, tipo: '2_prazo', mensagem });

            if (!insertError2) {
              alertasCriados++;
              detalhes.push({
                processo: arguido.numero_processo,
                nome: arguido.nome_arguido,
                tipo: '2º prazo',
                dias: dias2,
                urgencia
              });

              // Enviar email
              if (users && users.length > 0) {
                for (const user of users) {
                  await sendAlertaPrazoEmail({
                    to: user.email,
                    arguido: {
                      nome: arguido.nome_arguido,
                      processo: arguido.numero_processo,
                      crime: arguido.crime,
                      magistrado: arguido.magistrado_responsavel,
                    },
                    prazo: {
                      tipo: '2º Prazo',
                      dataFim: formatDatePt(fim2),
                      diasRestantes: dias2,
                      urgencia,
                    },
                  });
                }
              }
            }
          }
        }
      }
    }

    // Ordenar por urgência
    const prioridade: Record<string, number> = { vencido: 0, critico: 1, alerta: 2 };
    detalhes.sort((a, b) => (prioridade[a.urgencia] || 3) - (prioridade[b.urgencia] || 3) || a.dias - b.dias);

    // Enviar resumo diário ao primeiro admin
    if (users && users.length > 0) {
      const admin = users.find((u: any) => u.role === 'admin') || users[0];
      let prazosVencidos = 0;
      let alertasCriticos = 0;
      for (const d of detalhes) {
        if (d.urgencia === 'vencido') prazosVencidos++;
        if (d.urgencia === 'critico') alertasCriticos++;
      }
      await sendResumoDiarioEmail({
        to: admin.email,
        totalArguidos: arguidos?.length || 0,
        prazosVencidos,
        alertasCriticos,
        detalhes,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Verificação concluída. ${alertasCriados} novo(s) alerta(s) criado(s). Email enviado.`,
      alertasCriados,
      totalArguidosVerificados: arguidos?.length || 0,
      detalhes,
    });
  } catch (error: any) {
    console.error('Error verifying prazos:', error);
    return NextResponse.json({ error: 'Erro ao verificar prazos', details: error.message }, { status: 500 });
  }
}

// Import needed for request type
import { NextRequest } from 'next/server';
