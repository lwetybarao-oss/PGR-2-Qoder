import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { addDays, diffDays, todayNormalized } from '@/lib/prazos';

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

      let fim2Str = '';
      let dias2Str = '';

      let status = 'Normal';
      if (dias1 < 0) status = 'Vencido';
      else if (dias1 <= 7) status = 'Alerta';

      if (a.data_prorrogacao) {
        const fim2 = addDays(new Date(a.data_prorrogacao), 90);
        const dias2 = diffDays(today, fim2);
        fim2Str = formatDatePt(fim2);
        dias2Str = String(dias2);

        if (dias2 < 0) status = 'Vencido';
        else if (dias2 <= 7) status = 'Alerta';
      }

      if (dias1 <= 14 || (a.data_prorrogacao && diffDays(today, addDays(new Date(a.data_prorrogacao), 90)) <= 14)) {
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
          status
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
