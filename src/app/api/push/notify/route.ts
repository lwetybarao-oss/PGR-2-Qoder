import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { supabase } from '@/lib/supabase';

// Configure VAPID
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:pgr@example.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { notification } = body;

    if (!notification) {
      return NextResponse.json({ error: 'Dados da notificação inválidos' }, { status: 400 });
    }

    // Buscar subscrições persistidas no Supabase
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (subError) throw subError;

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ success: true, sent: 0, message: 'Nenhuma subscrição registada.' });
    }

    const payload = JSON.stringify({
      title: notification.title || 'PGR - Alerta de Prazo',
      body: notification.body || 'Novo alerta disponivel.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      url: notification.url || '/?view=alertas',
      tag: notification.tag || 'pgr-alerta',
      urgency: notification.urgency || 'normal',
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub: any) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload,
          {
            TTL: 86400,
            urgency: notification.urgency === 'vencido' ? 'high' : notification.urgency === 'critico' ? 'high' : 'normal',
          }
        )
      )
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    // Clean up expired subscriptions
    const expiredEndpoints: string[] = [];
    results.forEach((result, idx) => {
      if (result.status === 'rejected') {
        const err = result.reason as any;
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          expiredEndpoints.push(subscriptions[idx].id);
        }
      }
    });

    if (expiredEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', expiredEndpoints);
    }

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      total: subscriptions.length,
    });
  } catch (error: any) {
    console.error('Push notify error:', error);
    return NextResponse.json({ error: 'Erro ao enviar notificações', details: error.message }, { status: 500 });
  }
}
