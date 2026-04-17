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

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const arguidos = await db.arguido.findMany({
      where: { ativo: true },
      orderBy: { criadoEm: 'desc' }
    });

    let alertasCriticos = 0;
    let prazosVencidos = 0;
    let totalProrrogados = 0;

    const crimesStats: Record<string, number> = {};

    for (const a of arguidos) {
      const detDate = new Date(a.dataDetencao);
      const dias1 = diffDays(today, addDays(detDate, 90));

      let dias2: number | null = null;
      if (a.dataProrrogacao) {
        dias2 = diffDays(today, addDays(new Date(a.dataProrrogacao), 90));
        totalProrrogados++;
      }

      if (dias1 < 0) prazosVencidos++;
      else if (dias1 <= 7) alertasCriticos++;

      if (dias2 !== null) {
        if (dias2 < 0) prazosVencidos++;
        else if (dias2 <= 7) alertasCriticos++;
      }

      crimesStats[a.crime] = (crimesStats[a.crime] || 0) + 1;
    }

    const crimesArray = Object.entries(crimesStats)
      .map(([crime, count]) => ({ crime, count }))
      .sort((a, b) => b.count - a.count);

    const recentArguidos = arguidos.slice(0, 5).map(a => {
      const detDate = new Date(a.dataDetencao);
      const dias1 = diffDays(today, addDays(detDate, 90));
      let dias2: number | null = null;
      if (a.dataProrrogacao) {
        dias2 = diffDays(today, addDays(new Date(a.dataProrrogacao), 90));
      }
      let status = 'normal';
      if (dias1 < 0 || (dias2 !== null && dias2 < 0)) status = 'vencido';
      else if (dias1 <= 7 || (dias2 !== null && dias2 <= 7)) status = 'alerta';
      return { ...a, diasRestantes1: dias1, diasRestantes2: dias2, statusPrazo: status };
    });

    const recentAlertas = await db.alertaPrazo.findMany({
      where: { lido: false },
      orderBy: { criadoEm: 'desc' },
      take: 5
    });

    return NextResponse.json({
      totalArguidos: arguidos.length,
      totalProrrogados,
      alertasCriticos,
      prazosVencidos,
      crimesStats: crimesArray,
      recentArguidos,
      recentAlertas
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json({ error: 'Erro ao carregar dashboard' }, { status: 500 });
  }
}
