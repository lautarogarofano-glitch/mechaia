import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email requerido' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
  const resendApiKey = process.env.RESEND_API_KEY;

  try {
    let resetLink: string | null = null;

    // Intentar generar link directo si hay service role key
    if (supabaseServiceKey && resendApiKey) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const { data } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email,
        options: { redirectTo: 'https://www.mechaia.app/reset-password' },
      });
      resetLink = data?.properties?.action_link ?? null;
    }

    // Si tenemos link y API key de Resend, enviamos nosotros el email
    if (resetLink && resendApiKey) {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'MechaIA <noreply@mechaia.app>',
          to: [email],
          subject: 'Restablecé tu contraseña - MechaIA',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
              <img src="https://www.mechaia.app/logo.png" alt="MechaIA" style="width: 64px; height: 64px; margin-bottom: 24px;" />
              <h2 style="color: #1e293b; margin-bottom: 8px;">Restablecé tu contraseña</h2>
              <p style="color: #475569; margin-bottom: 24px;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta en MechaIA.
                Clickeá el botón para continuar:
              </p>
              <a href="${resetLink}"
                 style="display: inline-block; background: linear-gradient(to right, #2563eb, #4f46e5); color: white;
                        padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Restablecer contraseña
              </a>
              <p style="color: #94a3b8; font-size: 13px; margin-top: 24px;">
                Si no solicitaste esto, podés ignorar este email.<br/>
                El link expira en 1 hora.
              </p>
            </div>
          `,
        }),
      });
      if (!emailRes.ok) {
        console.error('[send-reset-email] Resend error:', await emailRes.text());
      }
    } else {
      // Fallback: dejar que Supabase envíe via SMTP configurado
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://www.mechaia.app/reset-password',
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err: unknown) {
    const e = err as { message?: string };
    console.error('[send-reset-email] Error:', e?.message);
    return res.status(200).json({ ok: true });
  }
}
