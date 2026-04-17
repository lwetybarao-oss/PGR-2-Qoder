import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calcPrazos, todayNormalized } from '@/lib/prazos';

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

    const today = todayNormalized();

    // Validar data de detenção (se alterada)
    if (body.dataDetencao) {
      const detDate = new Date(body.dataDetencao);
      detDate.setHours(0, 0, 0, 0);
      if (detDate > today) {
        return NextResponse.json({ error: 'A data de detenção não pode ser futura.' }, { status: 400 });
      }
    }

    // Validar data de prorrogação
    if (body.dataProrrogacao) {
      const prorDate = new Date(body.dataProrrogacao);
      prorDate.setHours(0, 0, 0, 0);
      const detDate = new Date(body.dataDetencao || existing.dataDetencao);
      detDate.setHours(0, 0, 0, 0);
      if (prorDate < detDate) {
        return NextResponse.json({ error: 'A data de prorrogação não pode ser anterior à data de detenção.' }, { status: 400 });
      }
      if (prorDate > today) {
        return NextResponse.json({ error: 'A data de prorrogação não pode ser futura.' }, { status: 400 });
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
        dataRemessaSic: body.dataRemessaSic ? new Date(dataRemessaSic) : null,
        dataProrrogacao: body.dataProrrogacao ? new Date(body.dataProrrogacao) : null,
        remessaJgAlteracao: body.remessaJgAlteracao ? new Date(remessaJgAlteracao) : null,
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
