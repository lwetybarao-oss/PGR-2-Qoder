import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calcPrazos, classificarUrgencia, todayNormalized } from '@/lib/prazos';

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

    // Se há filtro de status_prazo, precisamos buscar todos e filtrar na aplicação
    // (o status é calculado, não está na BD)
    const useStatusFilter = statusPrazo && ['normal', 'alerta', 'critico', 'vencido'].includes(statusPrazo);

    // Se filtramos por status, buscar sem paginação primeiro para ter contagens correctas
    const allArguidos = useStatusFilter
      ? await db.arguido.findMany({
          where,
          orderBy: { criadoEm: 'desc' },
        })
      : [];

    let resultWithPrazos = useStatusFilter
      ? allArguidos.map(a => calcPrazos(a))
      : [];

    // Aplicar filtro de status ANTES da paginação
    if (useStatusFilter) {
      if (statusPrazo === 'alerta') {
        // "alerta" no filtro inclui critico e alerta (0-7 dias, não vencido)
        resultWithPrazos = resultWithPrazos.filter(a =>
          a.statusPrazo === 'alerta' || a.statusPrazo === 'critico'
        );
      } else {
        resultWithPrazos = resultWithPrazos.filter(a => a.statusPrazo === statusPrazo);
      }
    }

    const total = useStatusFilter
      ? resultWithPrazos.length
      : await db.arguido.count({ where });

    const totalPages = Math.ceil(total / limit);

    // Paginação aplicada APÓS o filtro de status
    let data: any[];
    if (useStatusFilter) {
      data = resultWithPrazos.slice((page - 1) * limit, page * limit);
    } else {
      const [arguidos] = await Promise.all([
        db.arguido.findMany({
          where,
          orderBy: { criadoEm: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
      ]);
      data = arguidos.map(a => calcPrazos(a));
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages
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
    const today = todayNormalized();

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
