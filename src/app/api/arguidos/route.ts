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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const crime = searchParams.get('crime') || '';
    const magistrado = searchParams.get('magistrado') || '';
    const statusPrazo = searchParams.get('status_prazo') || '';
    const dataInicio = searchParams.get('data_inicio') || '';
    const dataFim = searchParams.get('data_fim') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = { ativo: true };

    if (q) {
      where.OR = [
        { nomeArguido: { contains: q } },
        { numeroProcesso: { contains: q } },
        { crime: { contains: q } },
        { magistradoResponsavel: { contains: q } }
      ];
    }

    if (crime) {
      where.crime = { contains: crime };
    }

    if (magistrado) {
      where.magistradoResponsavel = { contains: magistrado };
    }

    if (dataInicio || dataFim) {
      where.dataDetencao = {};
      if (dataInicio) {
        where.dataDetencao.gte = new Date(dataInicio);
      }
      if (dataFim) {
        where.dataDetencao.lte = new Date(dataFim);
      }
    }

    const [arguidos, total] = await Promise.all([
      db.arguido.findMany({
        where,
        orderBy: { criadoEm: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.arguido.count({ where })
    ]);

    let result = arguidos.map(a => calcPrazos(a));

    if (statusPrazo) {
      result = result.filter(a => a.statusPrazo === statusPrazo);
    }

    return NextResponse.json({
      data: result,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching arguidos:', error);
    return NextResponse.json({ error: 'Erro ao buscar arguidos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      numeroProcesso,
      nomeArguido,
      filiacaoPai,
      filiacaoMae,
      dataDetencao,
      dataRemessaJg,
      dataRegresso,
      crime,
      medidasAplicadas,
      magistradoResponsavel,
      dataRemessaSic,
      dataProrrogacao,
      remessaJgAlteracao,
      observacao1,
      observacao2
    } = body;

    if (!numeroProcesso || !nomeArguido || !dataDetencao || !crime || !magistradoResponsavel) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: Nº do Processo, Nome, Data de Detenção, Crime, Magistrado' },
        { status: 400 }
      );
    }

    const existing = await db.arguido.findUnique({ where: { numeroProcesso } });
    if (existing) {
      return NextResponse.json({ error: 'Já existe um arguido com este número de processo.' }, { status: 400 });
    }

    const detDate = new Date(dataDetencao);
    detDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (detDate > today) {
      return NextResponse.json({ error: 'A data de detenção não pode ser futura.' }, { status: 400 });
    }

    if (dataProrrogacao) {
      const prorDate = new Date(dataProrrogacao);
      prorDate.setHours(0, 0, 0, 0);
      if (prorDate < detDate) {
        return NextResponse.json({ error: 'A data de prorrogação não pode ser anterior à data de detenção.' }, { status: 400 });
      }
      if (prorDate > today) {
        return NextResponse.json({ error: 'A data de prorrogação não pode ser futura.' }, { status: 400 });
      }
    }

    const arguido = await db.arguido.create({
      data: {
        numeroProcesso,
        nomeArguido,
        filiacaoPai: filiacaoPai || null,
        filiacaoMae: filiacaoMae || null,
        dataDetencao: new Date(dataDetencao),
        dataRemessaJg: dataRemessaJg ? new Date(dataRemessaJg) : null,
        dataRegresso: dataRegresso ? new Date(dataRegresso) : null,
        crime,
        medidasAplicadas: medidasAplicadas || null,
        magistradoResponsavel,
        dataRemessaSic: dataRemessaSic ? new Date(dataRemessaSic) : null,
        dataProrrogacao: dataProrrogacao ? new Date(dataProrrogacao) : null,
        remessaJgAlteracao: remessaJgAlteracao ? new Date(remessaJgAlteracao) : null,
        observacao1: observacao1 || null,
        observacao2: observacao2 || null,
      }
    });

    return NextResponse.json({ data: calcPrazos(arguido) }, { status: 201 });
  } catch (error) {
    console.error('Error creating arguido:', error);
    return NextResponse.json({ error: 'Erro ao criar arguido' }, { status: 500 });
  }
}
