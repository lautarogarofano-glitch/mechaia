import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const VARIANT_IDS: Record<string, string> = {
  base: process.env.LEMONSQUEEZY_VARIANT_BASE!,
  turbo: process.env.LEMONSQUEEZY_VARIANT_TURBO!,
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
  if (!plan || !VARIANT_IDS[plan]) return res.status(400).json({ error: 'Plan inválido' });

  try {
    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: user.email,
              custom: {
                user_id: user.id,
                plan,
              },
            },
            product_options: {
              redirect_url: `${process.env.APP_URL}?checkout=success`,
            },
          },
          relationships: {
            store: {
              data: { type: 'stores', id: process.env.LEMONSQUEEZY_STORE_ID },
            },
            variant: {
              data: { type: 'variants', id: VARIANT_IDS[plan] },
            },
          },
        },
      }),
    });

    const data = await response.json();
    const url = data?.data?.attributes?.url;

    if (!url) {
      console.error('LemonSqueezy error:', JSON.stringify(data));
      return res.status(500).json({ error: 'Error creando sesión de pago' });
    }

    res.status(200).json({ url });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Checkout error:', err?.message);
    res.status(500).json({ error: 'Error creando sesión de pago' });
  }
}
