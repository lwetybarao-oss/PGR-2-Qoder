import { NextRequest, NextResponse } from 'next/server';
import { supabase, toCamelCase } from '@/lib/supabase';
import { classificarUrgencia, diffDays, addDays, todayNormalized, calcPrazos } from '@/lib/prazos';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo') || '';
    const lido = searchParams.get('lido') || '';
    const q = searchParams.get('q') || '';

    // ============================================
    // STATS: Calculados em tempo real a partir da tabela arguidos
    // (mesma lógica do Dashboard para garantir consistência)
    // ============================================
    const today = todayNormalized();

    const { data: allArguidos, error: argError } = await supabase
      .from('arguidos')
      .select('*')
      .eq('ativo', true);

    if (argError) throw argError;

    let liveTotal = 0;
    let liveVencidos = 0;
    let liveCriticos = 0;
    let liveAlertas = 0;
    let liveNormal = 0;

    for (const a of (allArguidos || [])) {
      const detDate = new Date(a.data_detencao);
      const dias1 = diffDays(today, addDays(detDate, 90));

      let dias2: number | null = null;
      if (a.data_prorrogacao) {
        dias2 = diffDays(today, addDays(new Date(a.data_prorrogacao), 90));
      }

      const status1 = classificarUrgencia(dias1);
      const status2 = dias2 !== null ? classificarUrgencia(dias2) : null;

      // Usar o pior status entre os dois prazos
      const prioridade: Record<string, number> = { normal: 0, alerta: 1, critico: 2, vencido: 3 };
      const p1 = prioridade[status1] || 0;
      const p2 = status2 ? (prioridade[status2] || 0) : -1;
      const pior = Math.max(p1, p2);

      liveTotal++;

      if (pior >= 3) liveVencidos++;
      else if (pior >= 2) liveCriticos++;
      else if (pior >= 1) liveAlertas++;
      else liveNormal++;
    }

    // ============================================
    // LISTA: Registros da tabela alerta_prazos
    // ============================================
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

    // Stats calculados em tempo real (iguais ao Dashboard)
    const stats = {
      total: liveTotal,
      vencidos: liveVencidos,
      criticos: liveCriticos,
      alertas: liveAlertas,
      normal: liveNormal,
      naoLidos: filtered.filter((a: any) => !a.lido).length,
      lidos: filtered.filter((a: any) => a.lido).length,
    };

    return NextResponse.json({ data: filtered, stats });
  } catch (error: any) {
    console.error('Error fetching alertas:', error);
    return NextResponse.json({ error: 'Erro ao buscar alertas', details: error.message }, { status: 500 });
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

    return NextResponse.json({ error: 'Acção inválida' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating alertas:', error);
    return NextResponse.json({ error: 'Erro ao atualizar alertas', details: error.message }, { status: 500 });
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
    return NextResponse.json({ error: 'Erro ao remover alertas', details: error.message }, { status: 500 });
  }
}
