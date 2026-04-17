import { NextRequest, NextResponse } from 'next/server';
import { supabase, toCamelCase } from '@/lib/supabase';
import { calcPrazos, todayNormalized } from '@/lib/prazos';

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

    // Build filters
    let query = supabase
      .from('arguidos')
      .select('*')
      .eq('ativo', true);

    if (q) {
      query = query.or(`nome_arguido.ilike.%${q}%,numero_processo.ilike.%${q}%,crime.ilike.%${q}%,magistrado_responsavel.ilike.%${q}%`);
    }

    if (crime) {
      query = query.ilike('crime', `%${crime}%`);
    }

    if (magistrado) {
      query = query.ilike('magistrado_responsavel', `%${magistrado}%`);
    }

    if (dataInicio) {
      query = query.gte('data_detencao', dataInicio);
    }
    if (dataFim) {
      query = query.lte('data_detencao', dataFim);
    }

    // Se há filtro de status_prazo, buscar todos e filtrar na aplicação
    const useStatusFilter = statusPrazo && ['normal', 'alerta', 'critico', 'vencido'].includes(statusPrazo);

    if (useStatusFilter) {
      // Buscar todos sem paginação para filtrar por status calculado
      const { data: allArguidos, error } = await query.order('criado_em', { ascending: false });

      if (error) throw error;

      let resultWithPrazos = (allArguidos || []).map((a: any) => calcPrazos(toCamelCase(a)));

      if (statusPrazo === 'alerta') {
        resultWithPrazos = resultWithPrazos.filter(a =>
          a.statusPrazo === 'alerta' || a.statusPrazo === 'critico'
        );
      } else {
        resultWithPrazos = resultWithPrazos.filter(a => a.statusPrazo === statusPrazo);
      }

      const total = resultWithPrazos.length;
      const totalPages = Math.ceil(total / limit);
      const data = resultWithPrazos.slice((page - 1) * limit, page * limit);

      return NextResponse.json({ data, pagination: { page, limit, total, totalPages } });
    } else {
      // Contar total com os mesmos filtros (query separada)
      let countQuery = supabase
        .from('arguidos')
        .select('*', { count: 'exact', head: true })
        .eq('ativo', true);

      if (q) {
        countQuery = countQuery.or(`nome_arguido.ilike.%${q}%,numero_processo.ilike.%${q}%,crime.ilike.%${q}%,magistrado_responsavel.ilike.%${q}%`);
      }
      if (crime) {
        countQuery = countQuery.ilike('crime', `%${crime}%`);
      }
      if (magistrado) {
        countQuery = countQuery.ilike('magistrado_responsavel', `%${magistrado}%`);
      }
      if (dataInicio) {
        countQuery = countQuery.gte('data_detencao', dataInicio);
      }
      if (dataFim) {
        countQuery = countQuery.lte('data_detencao', dataFim);
      }

      const { count, error: countError } = await countQuery;
      if (countError) throw countError;

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      // Buscar com paginação
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data: arguidos, error } = await query
        .order('criado_em', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const data = (arguidos || []).map((a: any) => calcPrazos(toCamelCase(a)));

      return NextResponse.json({ data, pagination: { page, limit, total, totalPages } });
    }
  } catch (error: any) {
    console.error('Error fetching arguidos:', error);
    return NextResponse.json({ error: 'Erro ao buscar arguidos', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      numeroProcesso, nomeArguido, filiacaoPai, filiacaoMae,
      dataDetencao, dataRemessaJg, dataRegresso, crime,
      medidasAplicadas, magistradoResponsavel, dataRemessaSic,
      dataProrrogacao, remessaJgAlteracao, observacao1, observacao2
    } = body;

    if (!numeroProcesso || !nomeArguido || !dataDetencao || !crime || !magistradoResponsavel) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: Nº do Processo, Nome, Data de Detenção, Crime, Magistrado' },
        { status: 400 }
      );
    }

    // Verificar duplicado
    const { data: existing } = await supabase
      .from('arguidos')
      .select('id')
      .eq('numero_processo', numeroProcesso)
      .single();

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

    const { data: arguido, error } = await supabase
      .from('arguidos')
      .insert({
        numero_processo: numeroProcesso,
        nome_arguido: nomeArguido,
        filiacao_pai: filiacaoPai || null,
        filiacao_mae: filiacaoMae || null,
        data_detencao: dataDetencao,
        data_remessa_jg: dataRemessaJg || null,
        data_regresso: dataRegresso || null,
        crime,
        medidas_aplicadas: medidasAplicadas || null,
        magistrado_responsavel: magistradoResponsavel,
        data_remessa_sic: dataRemessaSic || null,
        data_prorrogacao: dataProrrogacao || null,
        remessa_jg_alteracao: remessaJgAlteracao || null,
        observacao1: observacao1 || null,
        observacao2: observacao2 || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data: calcPrazos(toCamelCase(arguido)) }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating arguido:', error);
    return NextResponse.json({ error: 'Erro ao criar arguido', details: error.message }, { status: 500 });
  }
}
