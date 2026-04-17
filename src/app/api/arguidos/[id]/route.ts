import { NextRequest, NextResponse } from 'next/server';
import { supabase, toCamelCase } from '@/lib/supabase';
import { calcPrazos, todayNormalized } from '@/lib/prazos';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: arguido, error } = await supabase
      .from('arguidos')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !arguido) {
      return NextResponse.json({ error: 'Arguido não encontrado' }, { status: 404 });
    }

    // Buscar alertas relacionados
    const { data: alertas } = await supabase
      .from('alerta_prazos')
      .select('*')
      .eq('arguido_id', id)
      .order('criado_em', { ascending: false });

    const result = toCamelCase(arguido);
    result.alertas = (alertas || []).map((a: any) => toCamelCase(a));

    return NextResponse.json({ data: calcPrazos(result) });
  } catch (error: any) {
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

    // Verificar se existe
    const { data: existing, error: findError } = await supabase
      .from('arguidos')
      .select('*')
      .eq('id', id)
      .single();

    if (findError || !existing) {
      return NextResponse.json({ error: 'Arguido não encontrado' }, { status: 404 });
    }

    // Verificar duplicado de número de processo
    if (body.numeroProcesso && body.numeroProcesso !== existing.numero_processo) {
      const { data: dup } = await supabase
        .from('arguidos')
        .select('id')
        .eq('numero_processo', body.numeroProcesso)
        .single();

      if (dup) {
        return NextResponse.json({ error: 'Já existe um arguido com este número de processo.' }, { status: 400 });
      }
    }

    const today = todayNormalized();

    if (body.dataDetencao) {
      const detDate = new Date(body.dataDetencao);
      detDate.setHours(0, 0, 0, 0);
      if (detDate > today) {
        return NextResponse.json({ error: 'A data de detenção não pode ser futura.' }, { status: 400 });
      }
    }

    if (body.dataProrrogacao) {
      const prorDate = new Date(body.dataProrrogacao);
      prorDate.setHours(0, 0, 0, 0);
      const detDate = new Date(body.dataDetencao || existing.data_detencao);
      detDate.setHours(0, 0, 0, 0);
      if (prorDate < detDate) {
        return NextResponse.json({ error: 'A data de prorrogação não pode ser anterior à data de detenção.' }, { status: 400 });
      }
      if (prorDate > today) {
        return NextResponse.json({ error: 'A data de prorrogação não pode ser futura.' }, { status: 400 });
      }
    }

    const { data: updated, error } = await supabase
      .from('arguidos')
      .update({
        numero_processo: body.numeroProcesso ?? existing.numero_processo,
        nome_arguido: body.nomeArguido ?? existing.nome_arguido,
        filiacao_pai: body.filiacaoPai ?? existing.filiacao_pai,
        filiacao_mae: body.filiacaoMae ?? existing.filiacao_mae,
        data_detencao: body.dataDetencao ? new Date(body.dataDetencao).toISOString() : existing.data_detencao,
        data_remessa_jg: body.dataRemessaJg ? new Date(body.dataRemessaJg).toISOString() : existing.data_remessa_jg,
        data_regresso: body.dataRegresso ? new Date(body.dataRegresso).toISOString() : existing.data_regresso,
        crime: body.crime ?? existing.crime,
        medidas_aplicadas: body.medidasAplicadas ?? existing.medidas_aplicadas,
        magistrado_responsavel: body.magistradoResponsavel ?? existing.magistrado_responsavel,
        data_remessa_sic: body.dataRemessaSic ? new Date(body.dataRemessaSic).toISOString() : existing.data_remessa_sic,
        data_prorrogacao: body.dataProrrogacao ? new Date(body.dataProrrogacao).toISOString() : existing.data_prorrogacao,
        remessa_jg_alteracao: body.remessaJgAlteracao ? new Date(body.remessaJgAlteracao).toISOString() : existing.remessa_jg_alteracao,
        observacao1: body.observacao1 ?? existing.observacao1,
        observacao2: body.observacao2 ?? existing.observacao2,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data: calcPrazos(toCamelCase(updated)) });
  } catch (error: any) {
    console.error('Error updating arguido:', error);
    return NextResponse.json({ error: 'Erro ao atualizar arguido', details: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: existing, error: findError } = await supabase
      .from('arguidos')
      .select('id')
      .eq('id', id)
      .single();

    if (findError || !existing) {
      return NextResponse.json({ error: 'Arguido não encontrado' }, { status: 404 });
    }

    const { error } = await supabase
      .from('arguidos')
      .update({ ativo: false })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting arguido:', error);
    return NextResponse.json({ error: 'Erro ao remover arguido' }, { status: 500 });
  }
}
