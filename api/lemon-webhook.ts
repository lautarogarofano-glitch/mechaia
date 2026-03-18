import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHmac } from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PLAN_LIMITS: Record<string, number | null> = {
  base: 150,
  turbo: null, // ilimitado
};

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const rawBody = await getRawBody(req);
  const signature = req.headers['x-signature'] as string;

  // Verificar firma del webhook
  const hmac = createHmac('sha256', process.env.LEMONSQUEEZY_WEBHOOK_SECRET!);
  const digest = hmac.update(rawBody).digest('hex');
  if (signature !== digest) {
    return res.status(400).json({ error: 'Firma inválida' });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody.toString());
  } catch {
    return res.status(400).json({ error: 'Payload inválido' });
  }

  const eventName: string = payload.meta?.event_name;
  const attrs = payload.data?.attributes;
  const customData = payload.meta?.custom_data;
  const userId: string | undefined = customData?.user_id;
  const plan: string = customData?.plan || 'base';

  try {
    switch (eventName) {
      case 'subscription_created': {
        if (!userId) break;
        await supabase.from('subscriptions').upsert({
          user_id: userId,
          lemon_subscription_id: payload.data?.id,
          lemon_customer_id: String(attrs?.customer_id),
          plan,
          status: 'active',
          messages_used: 0,
          messages_limit: PLAN_LIMITS[plan],
          current_period_start: attrs?.renews_at ? new Date(attrs.created_at).toISOString() : null,
          current_period_end: attrs?.renews_at ? new Date(attrs.renews_at).toISOString() : null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
        break;
      }

      case 'subscription_updated':
      case 'subscription_resumed':
      case 'subscription_unpaused': {
        if (!userId) break;
        const lsStatus = attrs?.status;
        const ourStatus = lsStatus === 'active' ? 'active'
          : lsStatus === 'cancelled' ? 'cancelled'
          : lsStatus === 'expired' ? 'inactive'
          : lsStatus === 'past_due' ? 'past_due'
          : lsStatus;

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          lemon_subscription_id: payload.data?.id,
          lemon_customer_id: String(attrs?.customer_id),
          plan,
          status: ourStatus,
          messages_limit: PLAN_LIMITS[plan],
          current_period_end: attrs?.renews_at ? new Date(attrs.renews_at).toISOString() : null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
        break;
      }

      case 'subscription_cancelled': {
        if (!userId) break;
        await supabase.from('subscriptions')
          .update({ status: 'cancelled', updated_at: new Date().toISOString() })
          .eq('user_id', userId);
        break;
      }

      case 'subscription_expired': {
        if (!userId) break;
        await supabase.from('subscriptions')
          .update({ status: 'inactive', updated_at: new Date().toISOString() })
          .eq('user_id', userId);
        break;
      }

      case 'subscription_payment_success': {
        // Nuevo período: resetear contador de mensajes
        if (!userId) break;
        await supabase.from('subscriptions')
          .update({ messages_used: 0, status: 'active', updated_at: new Date().toISOString() })
          .eq('user_id', userId);
        break;
      }

      case 'subscription_payment_failed': {
        if (!userId) break;
        await supabase.from('subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('user_id', userId);
        break;
      }
    }

    res.status(200).json({ received: true });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Webhook handler error:', err?.message);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
}
