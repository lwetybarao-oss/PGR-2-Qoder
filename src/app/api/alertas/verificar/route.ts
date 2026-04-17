import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { diffDays, addDays, todayNormalized, classificarUrgencia } from '@/lib/prazos';

const ALERT_THRESHOLD_DAYS = 7;

function formatDatePt(date: Date): string {
  return date.toLocaleDateString('pt-BR');
}

export async function POST() {
  try {
    const today = todayNormalized();

    const arguidos = await db.arguido.findMany({
      where: { ativo: true }
    });

    let alertasCriados = 0;
    const detalhes: { processo: string; tipo: string; dias: number; urgencia: string }[] = [];

    for (const arguido of arguidos) {
      // ---- 1º Prazo ----
      const detDate = new Date(arguido.dataDetencao);
      const fim1 = addDays(detDate, 90);
      const dias1 = diffDays(today, fim1);

      if (dias1 <= ALERT_THRESHOLD_DAYS) {
        let mensagem: string;
        let urgencia: string;

        if (dias1 < 0) {
          urgencia = 'vencido';
          mensagem = `PRAZO VENCIDO! Prisão preventiva do processo Nº ${arguido.numeroProcesso} venceu há ${Math.abs(dias1)} dia(s) em ${formatDatePt(fim1)}`;
        } else if (dias1 === 0) {
          urgencia = 'critico';
          mensagem = `URGENTE! Prisão preventiva do processo Nº ${arguido.numeroProcesso} vence HOJE!`;
        } else if (dias1 <= 3) {
          urgencia = 'critico';
          mensagem = `Prisão preventiva do processo Nº ${arguido.numeroProcesso} quase a terminar: Faltam ${dias1} dia(s)`;
        } else {
          urgencia = 'alerta';
          mensagem = `Prisão preventiva do processo Nº ${arguido.numeroProcesso} prazo a terminar: Faltam ${dias1} dia(s)`;
        }

        // Evitar duplicados no mesmo dia
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        const exists = await db.alertaPrazo.findFirst({
          where: {
            arguidoId: arguido.id,
            tipo: '1_prazo',
            criadoEm: { gte: startOfDay, lte: endOfDay }
          }
        });

        if (!exists) {
          await db.alertaPrazo.create({
            data: {
              arguidoId: arguido.id,
              tipo: '1_prazo',
              mensagem
            }
          });
          alertasCriados++;
          detalhes.push({ processo: arguido.numeroProcesso, tipo: '1º prazo', dias: dias1, urgencia });
        }
      }

      // ---- 2º Prazo ----
      if (arguido.dataProrrogacao) {
        const prorDate = new Date(arguido.dataProrrogacao);
        const fim2 = addDays(prorDate, 90);
        const dias2 = diffDays(today, fim2);

        if (dias2 <= ALERT_THRESHOLD_DAYS) {
          let mensagem: string;
          let urgencia: string;

          if (dias2 < 0) {
            urgencia = 'vencido';
            mensagem = `PRAZO VENCIDO! 2º prazo do processo Nº ${arguido.numeroProcesso} venceu há ${Math.abs(dias2)} dia(s) em ${formatDatePt(fim2)}`;
          } else if (dias2 === 0) {
            urgencia = 'critico';
            mensagem = `URGENTE! 2º prazo do processo Nº ${arguido.numeroProcesso} vence HOJE!`;
          } else if (dias2 <= 3) {
            urgencia = 'critico';
            mensagem = `2º prazo do processo Nº ${arguido.numeroProcesso} quase a terminar: Faltam ${dias2} dia(s)`;
          } else {
            urgencia = 'alerta';
            mensagem = `2º prazo do processo Nº ${arguido.numeroProcesso} prazo a terminar: Faltam ${dias2} dia(s)`;
          }

          const startOfDay = new Date(today);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(today);
          endOfDay.setHours(23, 59, 59, 999);

          const exists = await db.alertaPrazo.findFirst({
            where: {
              arguidoId: arguido.id,
              tipo: '2_prazo',
              criadoEm: { gte: startOfDay, lte: endOfDay }
            }
          });

          if (!exists) {
            await db.alertaPrazo.create({
              data: {
                arguidoId: arguido.id,
                tipo: '2_prazo',
                mensagem
              }
            });
            alertasCriados++;
            detalhes.push({ processo: arguido.numeroProcesso, tipo: '2º prazo', dias: dias2, urgencia });
          }
        }
      }
    }

    // Ordenar por urgência (mais grave primeiro) e depois por dias
    const prioridade: Record<string, number> = { vencido: 0, critico: 1, alerta: 2 };
    detalhes.sort((a, b) => (prioridade[a.urgencia] || 3) - (prioridade[b.urgencia] || 3) || a.dias - b.dias);

    return NextResponse.json({
      success: true,
      message: `Verificação concluída. ${alertasCriados} novo(s) alerta(s) criado(s).`,
      alertasCriados,
      totalArguidosVerificados: arguidos.length,
      detalhes,
    });
  } catch (error) {
    console.error('Error verifying prazos:', error);
    return NextResponse.json({ error: 'Erro ao verificar prazos' }, { status: 500 });
  }
}
