import { createClient } from '@supabase/supabase-js';

// Mesmo Supabase do site público. Só a anon key — o acesso administrativo
// vem do login com usuário role='admin', validado pelas políticas RLS.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;
export const supabaseConfigurado = Boolean(url && key);

export const brl = (v) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const dataBR = (iso) => {
  if (!iso) return '—';
  const s = String(iso).slice(0, 10).split('-');
  return s.length === 3 ? `${s[2]}/${s[1]}/${s[0]}` : iso;
};
export const dtBR = (iso) => iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
export const hoje = () => new Date().toISOString().slice(0, 10);
export const diasAte = (iso) => {
  if (!iso) return null;
  return Math.round((new Date(iso + 'T00:00:00') - new Date(hoje() + 'T00:00:00')) / 86400000);
};
