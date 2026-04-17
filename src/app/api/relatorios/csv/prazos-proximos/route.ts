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
    rows.push(['Nº Processo', 'Nome', 'Crime', 'Magistrado', 'Data Detenção', 'Fim 1º Prazo', 'Dias Restantes 1º Prazo', 'Fim 2º Prazo', 'Dias Restantes 2º Prazo', 'Status']);

    for (const a of arguidos) {
      const detDate = new Date(a.dataDetencao);
      const fim1 = addDays(detDate, 90);
      const dias1 = diffDays(today, fim1);

      let fim2Str = '';
      let dias2Str = '';

      let status = 'Normal';
      if (dias1 < 0) {
        status = 'Vencido';
      } else if (dias1 <= 7) {
        status = 'Alerta';
      }

      if (a.dataProrrogacao) {
        const fim2 = addDays(new Date(a.dataProrrogacao), 90);
        const dias2 = diffDays(today, fim2);
        fim2Str = formatDatePt(fim2);
        dias2Str = String(dias2);

        if (dias2 < 0) status = 'Vencido';
        else if (dias2 <= 7) status = 'Alerta';
      }

      if (dias1 <= 14 || (a.dataProrrogacao && diffDays(today, addDays(new Date(a.dataProrrogacao), 90)) <= 14)) {
        rows.push([
          a.numeroProcesso,
          a.nomeArguido,
          a.crime,
          a.magistradoResponsavel,
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
