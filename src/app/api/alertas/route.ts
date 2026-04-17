import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
            numeroProcesso: true
          }
        }
      },
      orderBy: { criadoEm: 'desc' }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const alertasWithUrgency = alertas.map(a => {
      let urgencia = 'normal';
      if (a.mensagem.includes('VENCIDO')) urgencia = 'vencido';
      else if (a.mensagem.includes('HOJE') || a.mensagem.includes('3')) urgencia = 'critico';
      else if (a.mensagem.includes('Faltam')) urgencia = 'alerta';
      return { ...a, urgencia };
    });

    const stats = {
      total: alertas.length,
      naoLidos: alertas.filter(a => !a.lido).length,
      lidos: alertas.filter(a => a.lido).length,
      vencidos: alertasWithUrgency.filter(a => a.urgencia === 'vencido').length,
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
