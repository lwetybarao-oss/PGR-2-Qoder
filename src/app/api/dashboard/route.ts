import { NextResponse } from 'next/server';
import { supabase, toCamelCase } from '@/lib/supabase';
import { calcPrazos, diffDays, addDays, todayNormalized, classificarUrgencia } from '@/lib/prazos';

export async function GET() {
  try {
    const today = todayNormalized();

    const { data: arguidos, error } = await supabase
      .from('arguidos')
      .select('*')
      .eq('ativo', true)
      .order('criado_em', { ascending: false });

    if (error) throw error;

    let prazosVencidos = 0;
    let alertasCriticos = 0;
    let totalProrrogados = 0;

    const crimesStats: Record<string, number> = {};

    for (const a of (arguidos || [])) {
      const detDate = new Date(a.data_detencao);
      const dias1 = diffDays(today, addDays(detDate, 90));

      let dias2: number | null = null;
      if (a.data_prorrogacao) {
        dias2 = diffDays(today, addDays(new Date(a.data_prorrogacao), 90));
        totalProrrogados++;
      }

      const status1 = classificarUrgencia(dias1);
      const status2 = dias2 !== null ? classificarUrgencia(dias2) : null;

      if (status1 === 'vencido' || status2 === 'vencido') {
        prazosVencidos++;
      } else if (status1 === 'critico' || status1 === 'alerta' || status2 === 'critico' || status2 === 'alerta') {
        alertasCriticos++;
      }

      crimesStats[a.crime] = (crimesStats[a.crime] || 0) + 1;
    }

    const crimesArray = Object.entries(crimesStats)
      .map(([crime, count]) => ({ crime, count }))
      .sort((a, b) => b.count - a.count);

    const recentArguidos = (arguidos || []).slice(0, 5).map(a => calcPrazos(toCamelCase(a)));

    const { data: recentAlertas } = await supabase
      .from('alerta_prazos')
      .select('*')
      .eq('lido', false)
      .order('criado_em', { ascending: false })
      .limit(5);

    return NextResponse.json({
      totalArguidos: arguidos?.length || 0,
      totalProrrogados,
      alertasCriticos,
      prazosVencidos,
      crimesStats: crimesArray,
      recentArguidos,
      recentAlertas: (recentAlertas || []).map((a: any) => toCamelCase(a)),
    });
  } catch (error: any) {
    console.error('Error fetching dashboard:', error);
    return NextResponse.json({ error: 'Erro ao carregar dashboard' }, { status: 500 });
  }
}
