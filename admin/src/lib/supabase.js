import { createClient } from '@supabase/supabase-js';
import { criarClienteDemo, resetDemo } from './demo';

// Mesmo Supabase do site público. Só a anon key — o acesso administrativo
// vem do login com usuário role='admin', validado pelas políticas RLS.
// Sem .env configurado, entra em MODO DEMO: dados de exemplo no navegador.
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const demoMode = !(url && key);
export const supabase = demoMode ? criarClienteDemo() : createClient(url, key);
export const supabaseConfigurado = true;
export { resetDemo };

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

// Primeiro nome (para exibir responsáveis de forma curta)
export const nomeCurto = (perfil) => {
  const n = (perfil?.nome || '').trim();
  return n ? n.split(/\s+/)[0] : '—';
};

// Código de proposta no padrão PRO<ano>/<revisão>/<sequência>
export const codigoOrcamento = (o) => {
  if (!o) return '';
  const ano = String(o.data || o.created_at || '').slice(0, 4) || new Date().getFullYear();
  return `PRO${ano}/${String(o.revisao ?? 0).padStart(2, '0')}/${String(o.numero ?? 0).padStart(4, '0')}`;
};
