import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function diffDays(date1: Date, date2: Date): number {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDatePt(date: Date): string {
  return date.toLocaleDateString('pt-BR');
}

export async function POST() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const limite = addDays(today, 7);

    const arguidos = await db.arguido.findMany({
      where: { ativo: true }
    });

    let alertasCriados = 0;

    for (const arguido of arguidos) {
      // 1º prazo
      const detDate = new Date(arguido.dataDetencao);
      const fim1 = addDays(detDate, 90);
      const dias1 = diffDays(today, fim1);

      if (dias1 <= 7) {
        let mensagem: string;
        if (dias1 < 0) {
          mensagem = `PRAZO VENCIDO! Prisão preventiva do processo Nº ${arguido.numeroProcesso} venceu há ${Math.abs(dias1)} dia(s) em ${formatDatePt(fim1)}`;
        } else if (dias1 === 0) {
          mensagem = `URGENTE! Prisão preventiva do processo Nº ${arguido.numeroProcesso} vence HOJE!`;
        } else {
          mensagem = `Prisão preventiva do processo Nº ${arguido.numeroProcesso} quase a terminar: Faltam ${dias1} dia(s)`;
        }

        // Avoid duplicates on same day
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
        }
      }

      // 2º prazo
      if (arguido.dataProrrogacao) {
        const prorDate = new Date(arguido.dataProrrogacao);
        const fim2 = addDays(prorDate, 90);
        const dias2 = diffDays(today, fim2);

        if (dias2 <= 7) {
          let mensagem: string;
          if (dias2 < 0) {
            mensagem = `PRAZO VENCIDO! 2º prazo do processo Nº ${arguido.numeroProcesso} venceu há ${Math.abs(dias2)} dia(s) em ${formatDatePt(fim2)}`;
          } else if (dias2 === 0) {
            mensagem = `URGENTE! 2º prazo do processo Nº ${arguido.numeroProcesso} vence HOJE!`;
          } else {
            mensagem = `2º prazo do processo Nº ${arguido.numeroProcesso} quase a terminar: Faltam ${dias2} dia(s)`;
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
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Verificação concluída. ${alertasCriados} novo(s) alerta(s) criado(s).`
    });
  } catch (error) {
    console.error('Error verifying prazos:', error);
    return NextResponse.json({ error: 'Erro ao verificar prazos' }, { status: 500 });
  }
}
