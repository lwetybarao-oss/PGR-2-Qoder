import { NextRequest, NextResponse } from 'next/server';
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

function calcPrazos(arguido: any) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const detDate = new Date(arguido.dataDetencao);
  const fim1Prazo = addDays(detDate, 90);
  const diasRestantes1 = diffDays(today, fim1Prazo);

  let fim2Prazo: Date | null = null;
  let diasRestantes2: number | null = null;

  if (arguido.dataProrrogacao) {
    const prorDate = new Date(arguido.dataProrrogacao);
    fim2Prazo = addDays(prorDate, 90);
    diasRestantes2 = diffDays(today, fim2Prazo);
  }

  let statusPrazo = 'normal';
  if (diasRestantes1 < 0 || (diasRestantes2 !== null && diasRestantes2 < 0)) {
    statusPrazo = 'vencido';
  } else if (diasRestantes1 <= 7 || (diasRestantes2 !== null && diasRestantes2 <= 7)) {
    statusPrazo = 'alerta';
  }

  return {
    ...arguido,
    fim1Prazo,
    fim2Prazo,
    diasRestantes1,
    diasRestantes2,
    statusPrazo
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const arguido = await db.arguido.findUnique({
      where: { id },
      include: { alertas: { orderBy: { criadoEm: 'desc' } } }
    });

    if (!arguido) {
      return NextResponse.json({ error: 'Arguido não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ data: calcPrazos(arguido) });
  } catch (error) {
    console.error('Error fetching arguido:', error);
    return NextResponse.json({ error: 'Erro ao buscar arguido' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await db.arguido.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Arguido não encontrado' }, { status: 404 });
    }

    if (body.numeroProcesso && body.numeroProcesso !== existing.numeroProcesso) {
      const dup = await db.arguido.findUnique({ where: { numeroProcesso: body.numeroProcesso } });
      if (dup) {
        return NextResponse.json({ error: 'Já existe um arguido com este número de processo.' }, { status: 400 });
      }
    }

    if (body.dataProrrogacao) {
      const prorDate = new Date(body.dataProrrogacao);
      const detDate = new Date(body.dataDetencao || existing.dataDetencao);
      if (prorDate < detDate) {
        return NextResponse.json({ error: 'A data de prorrogação não pode ser anterior à data de detenção.' }, { status: 400 });
      }
    }

    const updated = await db.arguido.update({
      where: { id },
      data: {
        numeroProcesso: body.numeroProcesso,
        nomeArguido: body.nomeArguido,
        filiacaoPai: body.filiacaoPai || null,
        filiacaoMae: body.filiacaoMae || null,
        dataDetencao: body.dataDetencao ? new Date(body.dataDetencao) : undefined,
        dataRemessaJg: body.dataRemessaJg ? new Date(body.dataRemessaJg) : null,
        dataRegresso: body.dataRegresso ? new Date(body.dataRegresso) : null,
        crime: body.crime,
        medidasAplicadas: body.medidasAplicadas || null,
        magistradoResponsavel: body.magistradoResponsavel,
        dataRemessaSic: body.dataRemessaSic ? new Date(body.dataRemessaSic) : null,
        dataProrrogacao: body.dataProrrogacao ? new Date(body.dataProrrogacao) : null,
        remessaJgAlteracao: body.remessaJgAlteracao ? new Date(body.remessaJgAlteracao) : null,
        observacao1: body.observacao1 || null,
        observacao2: body.observacao2 || null,
      }
    });

    return NextResponse.json({ data: calcPrazos(updated) });
  } catch (error) {
    console.error('Error updating arguido:', error);
    return NextResponse.json({ error: 'Erro ao atualizar arguido' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await db.arguido.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Arguido não encontrado' }, { status: 404 });
    }

    await db.arguido.update({
      where: { id },
      data: { ativo: false }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting arguido:', error);
    return NextResponse.json({ error: 'Erro ao remover arguido' }, { status: 500 });
  }
}
