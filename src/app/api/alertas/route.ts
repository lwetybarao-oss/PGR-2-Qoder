import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { classificarUrgencia, diffDays, addDays, todayNormalized, calcPrazos } from '@/lib/prazos';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo') || '';
    const lido = searchParams.get('lido') || '';
    const q = searchParams.get('q') || '';

    const where: any = {};

    if (tipo) {
      where.tipo = tipo;
    }

    if (lido === 'true') {
      where.lido = true;
    } else if (lido === 'false') {
      where.lido = false;
    }

    if (q) {
      where.mensagem = { contains: q };
    }

    const alertas = await db.alertaPrazo.findMany({
      where,
      include: {
        arguido: {
          select: {
            id: true,
            nomeArguido: true,
            numeroProcesso: true,
            dataDetencao: true,
            dataProrrogacao: true,
          }
        }
      },
      orderBy: { criadoEm: 'desc' }
    });

    // Calcular urgência CORRECTAMENTE: baseada nos dias actuais do arguido,
    // NÃO no texto da mensagem (como fazia antes - era frágil e impreciso).
    // Isto coincide com a lógica do Django (core/views.py AlertasView).
    const today = todayNormalized();

    const alertasWithUrgency = alertas.map(a => {
      let dias: number | null = null;

      if (a.arguido) {
        const arguido = a.arguido;
        if (a.tipo === '1_prazo') {
          dias = diffDays(today, addDays(new Date(arguido.dataDetencao), 90));
        } else if (a.tipo === '2_prazo' && arguido.dataProrrogacao) {
          dias = diffDays(today, addDays(new Date(arguido.dataProrrogacao), 90));
        }
      }

      // Fallback: se não conseguiu calcular do arguido, tenta inferir da mensagem
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

      return {
        ...a,
        urgencia,
        diasRestantes: dias,
      };
    });

    const stats = {
      total: alertas.length,
      naoLidos: alertas.filter(a => !a.lido).length,
      lidos: alertas.filter(a => a.lido).length,
      vencidos: alertasWithUrgency.filter(a => a.urgencia === 'vencido').length,
      criticos: alertasWithUrgency.filter(a => a.urgencia === 'critico').length,
    };

    return NextResponse.json({ data: alertasWithUrgency, stats });
  } catch (error) {
    console.error('Error fetching alertas:', error);
    return NextResponse.json({ error: 'Erro ao buscar alertas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, action } = body;

    if (action === 'mark_read' && ids && ids.length > 0) {
      await db.alertaPrazo.updateMany({
        where: { id: { in: ids } },
        data: { lido: true }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
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

    await db.alertaPrazo.deleteMany({
      where: { id: { in: ids } }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting alertas:', error);
    return NextResponse.json({ error: 'Erro ao remover alertas' }, { status: 500 });
  }
}
