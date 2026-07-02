import { createClient } from '@supabase/supabase-js';

// A anon key é pública por desenho do Supabase — a proteção real são as
// políticas RLS no servidor (ver supabase/schema.sql). A service_role
// NUNCA deve aparecer aqui.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;
export const supabaseConfigurado = Boolean(url && key);

export const WHATSAPP = (import.meta.env.VITE_WHATSAPP || '5500000000000').replace(/\D/g, '');
export const zapLink = (msg) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;

// Captura de lead silenciosa — nunca atrapalha a navegação do cliente.
export async function registrarLead(produto, origem = 'site') {
  try {
    if (!supabase) return;
    await supabase.from('leads').insert({ produto, origem, contato: 'clique whatsapp' });
  } catch { /* silencioso por desenho */ }
}
