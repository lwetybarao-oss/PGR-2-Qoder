import { NextResponse } from 'next/server';
import { supabase, toCamelCase } from '@/lib/supabase';
import { addDays, diffDays, todayNormalized, classificarUrgencia, calcPrazos } from '@/lib/prazos';

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
    rows.push(['Nº Processo', 'Nome', 'Crime', 'Magistrado', 'Data Detenção', 'Fim 1º Prazo', 'Dias Vencidos 1º', 'Fim 2º Prazo', 'Dias Vencidos 2º']);

    for (const a of (arguidos || [])) {
      const calc = calcPrazos(toCamelCase(a));

      // Incluir se qualquer prazo está vencido (dias < 0)
      const vencido1 = calc.diasRestantes1 < 0;
      const vencido2 = calc.diasRestantes2 !== null && calc.diasRestantes2 < 0;

      if (vencido1 || vencido2) {
        const detDate = new Date(a.data_detencao);
        const fim1 = addDays(detDate, 90);

        let fim2Str = '';
        let dias2Str = '';

        if (a.data_prorrogacao && vencido2) {
          const fim2 = addDays(new Date(a.data_prorrogacao), 90);
          fim2Str = formatDatePt(fim2);
          dias2Str = String(Math.abs(calc.diasRestantes2!));
        }

        rows.push([
          a.numero_processo,
          a.nome_arguido,
          a.crime,
          a.magistrado_responsavel,
          formatDatePt(detDate),
          vencido1 ? formatDatePt(fim1) : '',
          vencido1 ? String(Math.abs(calc.diasRestantes1)) : '',
          fim2Str,
          dias2Str
        ]);
      }
    }

    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="prazos-vencidos.csv"'
      }
    });
  } catch (error) {
    console.error('Error generating CSV:', error);
    return NextResponse.json({ error: 'Erro ao gerar relatório' }, { status: 500 });
  }
}
