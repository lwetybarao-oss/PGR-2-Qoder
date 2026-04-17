import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

// Configure VAPID
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:pgr@example.com';

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

// In-memory subscription store (matches subscribe route)
// In production, these would be stored in the database
const subscriptions: Map<string, { endpoint: string; keys: { p256dh: string; auth: string } }> = new Map();

// Import from subscribe - we share the same store via a module
// For now, notifications can be sent to manually registered subscriptions

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptions: subs, notification } = body;

    if (!subs || !Array.isArray(subs) || subs.length === 0) {
      return NextResponse.json({ error: 'Nenhuma subscrição fornecida' }, { status: 400 });
    }

    if (!notification) {
      return NextResponse.json({ error: 'Dados da notificação inválidos' }, { status: 400 });
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
      subs.map((sub: any) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          payload,
          {
            TTL: 86400, // 24 hours
            urgency: notification.urgency === 'vencido' ? 'high' : notification.urgency === 'critico' ? 'high' : 'normal',
          }
        )
      )
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    // Clean up failed subscriptions (expired endpoints)
    results.forEach((result, idx) => {
      if (result.status === 'rejected') {
        const err = result.reason as any;
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          // Subscription expired - would remove from DB in production
          console.log(`Expired subscription removed: ${subs[idx].endpoint.slice(0, 50)}...`);
        }
      }
    });

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      total: subs.length,
    });
  } catch (error) {
    console.error('Push notify error:', error);
    return NextResponse.json({ error: 'Erro ao enviar notificações' }, { status: 500 });
  }
}
