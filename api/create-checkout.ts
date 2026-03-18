import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_IDS: Record<string, string> = {
  base: process.env.STRIPE_PRICE_BASE!,
  turbo: process.env.STRIPE_PRICE_TURBO!,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No autorizado' });

  const token = authHeader.split(' ')[1];
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Token inválido' });

  const { plan } = req.body;
  if (!plan || !PRICE_IDS[plan]) return res.status(400).json({ error: 'Plan inválido' });

  try {
    // Buscar o crear customer de Stripe
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let customerId = sub?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
      success_url: `${process.env.APP_URL}?checkout=success`,
      cancel_url: `${process.env.APP_URL}?checkout=cancelled`,
      metadata: { user_id: user.id, plan },
      subscription_data: { metadata: { user_id: user.id, plan } },
    });

    res.status(200).json({ url: session.url });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Stripe error:', err?.message);
    res.status(500).json({ error: 'Error creando sesión de pago' });
  }
}
