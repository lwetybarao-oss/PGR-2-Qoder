import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calcPrazos, diffDays, addDays, todayNormalized, classificarUrgencia } from '@/lib/prazos';

export async function GET() {
  try {
    const today = todayNormalized();

    const arguidos = await db.arguido.findMany({
      where: { ativo: true },
      orderBy: { criadoEm: 'desc' }
    });

    // Contar ARGUIDOS (não prazos) — cada arguido conta 1x no máximo
    let prazosVencidos = 0;      // arguidos com pelo menos 1 prazo vencido
    let alertasCriticos = 0;     // arguidos com pelo menos 1 prazo em alerta/critico (0-7 dias, não vencido)
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

      // Classificar cada prazo individualmente
      const status1 = classificarUrgencia(dias1);
      const status2 = dias2 !== null ? classificarUrgencia(dias2) : null;

      // Verificar se TEM algum prazo vencido (conta o arguido 1x)
      if (status1 === 'vencido' || status2 === 'vencido') {
        prazosVencidos++;
      }
      // Verificar se TEM algum prazo em alerta/critico (conta o arguido 1x)
      else if (status1 === 'critico' || status1 === 'alerta' || status2 === 'critico' || status2 === 'alerta') {
        alertasCriticos++;
      }

      crimesStats[a.crime] = (crimesStats[a.crime] || 0) + 1;
    }

    const crimesArray = Object.entries(crimesStats)
      .map(([crime, count]) => ({ crime, count }))
      .sort((a, b) => b.count - a.count);

    // Recent arguidos com prazos calculados
    const recentArguidos = arguidos.slice(0, 5).map(a => calcPrazos(a));

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
