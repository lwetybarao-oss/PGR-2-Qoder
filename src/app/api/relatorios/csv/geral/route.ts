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

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const arguidos = await db.arguido.findMany({
      where: { ativo: true },
      orderBy: { criadoEm: 'desc' }
    });

    const rows: string[][] = [];
    rows.push(['Nº Processo', 'Nome', 'Filiação Pai', 'Filiação Mãe', 'Data Detenção', 'Data Remessa JG', 'Crime', 'Medidas Aplicadas', 'Magistrado', 'Data Remessa SIC', 'Data Prorrogação', 'Fim 1º Prazo', 'Dias Restantes', 'Fim 2º Prazo', 'Dias Restantes 2º', 'Status', 'Observações']);

    for (const a of arguidos) {
      const detDate = new Date(a.dataDetencao);
      const fim1 = addDays(detDate, 90);
      const dias1 = diffDays(today, fim1);

      let fim2Str = '';
      let dias2Str = '';
      let status = 'Normal';

      if (dias1 < 0) status = 'Vencido';
      else if (dias1 <= 7) status = 'Alerta';

      if (a.dataProrrogacao) {
        const fim2 = addDays(new Date(a.dataProrrogacao), 90);
        const dias2 = diffDays(today, fim2);
        fim2Str = formatDatePt(fim2);
        dias2Str = String(dias2);
        if (dias2 < 0) status = 'Vencido';
        else if (dias2 <= 7) status = 'Alerta';
      }

      rows.push([
        a.numeroProcesso,
        a.nomeArguido,
        a.filiacaoPai || '',
        a.filiacaoMae || '',
        formatDatePt(detDate),
        a.dataRemessaJg ? formatDatePt(new Date(a.dataRemessaJg)) : '',
        a.crime,
        a.medidasAplicadas || '',
        a.magistradoResponsavel,
        a.dataRemessaSic ? formatDatePt(new Date(a.dataRemessaSic)) : '',
        a.dataProrrogacao ? formatDatePt(new Date(a.dataProrrogacao)) : '',
        formatDatePt(fim1),
        String(dias1),
        fim2Str,
        dias2Str,
        status,
        [a.observacao1, a.observacao2].filter(Boolean).join(' | ')
      ]);
    }

    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="relatorio-geral.csv"'
      }
    });
  } catch (error) {
    console.error('Error generating CSV:', error);
    return NextResponse.json({ error: 'Erro ao gerar relatório' }, { status: 500 });
  }
}
