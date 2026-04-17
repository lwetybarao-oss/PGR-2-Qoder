import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// In-memory store for push subscriptions (production: use DB table)
const subscriptions: Map<string, { endpoint: string; keys: { p256dh: string; auth: string } }> = new Map();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, keys, userId } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: 'Dados de subscrição inválidos' }, { status: 400 });
    }

    const subKey = userId || endpoint;
    subscriptions.set(subKey, { endpoint, keys: { p256dh: keys.p256dh, auth: keys.auth } });

    return NextResponse.json({ success: true, message: 'Subscrição registada com sucesso' });
  } catch (error) {
    console.error('Push subscribe error:', error);
    return NextResponse.json({ error: 'Erro ao registar subscrição' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    if (endpoint) {
      subscriptions.delete(endpoint);
    } else {
      subscriptions.clear();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    return NextResponse.json({ error: 'Erro ao remover subscrição' }, { status: 500 });
  }
}
