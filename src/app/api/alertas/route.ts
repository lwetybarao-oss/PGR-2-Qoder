import { NextRequest, NextResponse } from 'next/server';
import { supabase, toCamelCase } from '@/lib/supabase';
import { classificarUrgencia, diffDays, addDays, todayNormalized, calcPrazos } from '@/lib/prazos';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo') || '';
    const lido = searchParams.get('lido') || '';
    const q = searchParams.get('q') || '';

    let query = supabase
      .from('alerta_prazos')
      .select('*, arguido:arguidos(id, nome_arguido, numero_processo, data_detencao, data_prorrogacao)')
      .order('criado_em', { ascending: false });

    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    if (lido === 'true') {
      query = query.eq('lido', true);
    } else if (lido === 'false') {
      query = query.eq('lido', false);
    }

    const { data: alertas, error } = await query;
    if (error) throw error;

    const today = todayNormalized();

    const alertasWithUrgency = (alertas || []).map((a: any) => {
      let dias: number | null = null;

      if (a.arguido) {
        const arguido = a.arguido;
        if (a.tipo === '1_prazo') {
          dias = diffDays(today, addDays(new Date(arguido.data_detencao), 90));
        } else if (a.tipo === '2_prazo' && arguido.data_prorrogacao) {
          dias = diffDays(today, addDays(new Date(arguido.data_prorrogacao), 90));
        }
      }

      if (dias === null) {
        if (a.mensagem.includes('VENCIDO')) dias = -1;
        else if (a.mensagem.includes('HOJE')) dias = 0;
        else if (a.mensagem.includes('Faltam')) {
          const match = a.mensagem.match(/Faltam\s+(\d+)/);
          dias = match ? parseInt(match[1]) : 5;
        } else {
          dias = 99;
        }
      }

      const urgencia = classificarUrgencia(dias);
      const result = toCamelCase(a);
      result.urgencia = urgencia;
      result.diasRestantes = dias;
      return result;
    });

    // Filtrar por texto
    let filtered = alertasWithUrgency;
    if (q) {
      filtered = filtered.filter((a: any) =>
        a.mensagem.toLowerCase().includes(q.toLowerCase())
      );
    }

    const stats = {
      total: filtered.length,
      naoLidos: filtered.filter((a: any) => !a.lido).length,
      lidos: filtered.filter((a: any) => a.lido).length,
      vencidos: filtered.filter((a: any) => a.urgencia === 'vencido').length,
      criticos: filtered.filter((a: any) => a.urgencia === 'critico').length,
    };

    return NextResponse.json({ data: filtered, stats });
  } catch (error: any) {
    console.error('Error fetching alertas:', error);
    return NextResponse.json({ error: 'Erro ao buscar alertas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, action } = body;

    if (action === 'mark_read' && ids && ids.length > 0) {
      const { error } = await supabase
        .from('alerta_prazos')
        .update({ lido: true })
        .in('id', ids);

      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating alertas:', error);
    return NextResponse.json({ error: 'Erro ao atualizar alertas' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !ids.length) {
      return NextResponse.json({ error: 'IDs não informados' }, { status: 400 });
    }

    const { error } = await supabase
      .from('alerta_prazos')
      .delete()
      .in('id', ids);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting alertas:', error);
    return NextResponse.json({ error: 'Erro ao remover alertas' }, { status: 500 });
  }
}
