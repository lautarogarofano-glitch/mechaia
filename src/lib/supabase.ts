import { createClient } from '@supabase/supabase-js';

// @ts-ignore - Vite maneja estas variables en build time
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
// @ts-ignore
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseKey);
