import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { addDays, diffDays, todayNormalized, classificarUrgencia } from '@/lib/prazos';

function formatDatePt(date: Date): string {
  return date.toLocaleDateString('pt-BR');
}

export async function GET() {
  try {
    const today = todayNormalized();

    const { data: arguidos, error } = await supabase
      .from('arguidos')
      .select('*')
      .eq('ativo', true)
      .order('criado_em', { ascending: false });

    if (error) throw error;

    const rows: string[][] = [];
    rows.push(['Nº Processo', 'Nome', 'Crime', 'Magistrado', 'Data Detenção', 'Fim 1º Prazo', 'Dias Restantes 1º Prazo', 'Fim 2º Prazo', 'Dias Restantes 2º Prazo', 'Status']);

    for (const a of (arguidos || [])) {
      const detDate = new Date(a.data_detencao);
      const fim1 = addDays(detDate, 90);
      const dias1 = diffDays(today, fim1);
      const status1 = classificarUrgencia(dias1);

      let fim2Str = '';
      let dias2Str = '';
      let status = status1;

      if (a.data_prorrogacao) {
        const fim2 = addDays(new Date(a.data_prorrogacao), 90);
        const dias2 = diffDays(today, fim2);
        const status2 = classificarUrgencia(dias2);
        fim2Str = formatDatePt(fim2);
        dias2Str = String(dias2);

        // Usar o pior status entre os dois prazos
        const prioridade: Record<string, number> = { normal: 0, alerta: 1, critico: 2, vencido: 3 };
        if ((prioridade[status2] || 0) > (prioridade[status] || 0)) {
          status = status2;
        }
      }

      // Incluir se o pior status não é "normal" (ou seja, <= 7 dias ou vencido)
      if (status !== 'normal') {
        let statusLabel: string;
        switch (status) {
          case 'vencido': statusLabel = 'Vencido'; break;
          case 'critico': statusLabel = 'Crítico'; break;
          case 'alerta': statusLabel = 'Alerta'; break;
          default: statusLabel = 'Normal';
        }

        rows.push([
          a.numero_processo,
          a.nome_arguido,
          a.crime,
          a.magistrado_responsavel,
          formatDatePt(detDate),
          formatDatePt(fim1),
          String(dias1),
          fim2Str,
          dias2Str,
          statusLabel
        ]);
      }
    }

    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="prazos-proximos.csv"'
      }
    });
  } catch (error) {
    console.error('Error generating CSV:', error);
    return NextResponse.json({ error: 'Erro ao gerar relatório' }, { status: 500 });
  }
}
