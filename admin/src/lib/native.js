/*
 * Ponte com o aparelho (Capacitor). Tudo aqui é opcional:
 * no navegador `nativo` é false e cada função cai no comportamento web de sempre.
 * Assim o mesmo código roda em http://localhost:5205, na Vercel e dentro do APK.
 */
import { Capacitor, registerPlugin } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export const nativo = Capacitor.isNativePlatform();
export const plataforma = Capacitor.getPlatform();   // 'android' | 'ios' | 'web'

// Marca no <html> antes da primeira pintura, para o CSS diferenciar app de navegador
if (nativo) document.documentElement.classList.add('app-nativo', `app-${plataforma}`);

/* ─────────────── Sessão do Supabase ───────────────
 * No navegador o localStorage basta. Dentro do app, a WebView pode ser limpa
 * pelo sistema quando o aparelho fica sem espaço — e o sócio seria deslogado
 * do nada. Preferences grava em SharedPreferences (Android) / UserDefaults (iOS),
 * que sobrevivem a isso. O supabase-js aceita storage assíncrono.
 */
export const authStorage = nativo ? {
  getItem: async (key) => (await Preferences.get({ key })).value,
  setItem: async (key, value) => { await Preferences.set({ key, value }); },
  removeItem: async (key) => { await Preferences.remove({ key }); },
} : undefined;

/* ─────────────── Botão "voltar" do Android ───────────────
 * Sem isto, qualquer toque em "voltar" fecha o app — inclusive com um modal aberto.
 * Cada camada visual (modal, preview de proposta, gaveta do menu) empilha um
 * handler; o "voltar" desmonta a camada do topo. Só sai do app quando a pilha
 * está vazia e já estamos na tela inicial.
 */
const pilhaVoltar = [];

/** Registra uma camada fechável. Devolve a função de baixa (use no cleanup do efeito). */
export function aoVoltar(handler) {
  pilhaVoltar.push(handler);
  return () => {
    const i = pilhaVoltar.lastIndexOf(handler);
    if (i >= 0) pilhaVoltar.splice(i, 1);
  };
}

/* ─────────────── Impressão / PDF ───────────────
 * window.print() não existe na WebView do Android (é um no-op silencioso).
 * O plugin nativo SolvePrinter usa o serviço de impressão do sistema, que já
 * traz "Salvar como PDF" e respeita o mesmo @media print do desktop.
 * Se ele não estiver disponível (iOS, build antigo), exportamos o documento
 * como HTML e abrimos a folha de compartilhamento.
 */
const SolvePrinter = registerPlugin('SolvePrinter');

export async function imprimirDocumento(nomeArquivo = 'proposta') {
  if (!nativo) { window.print(); return; }

  const nome = nomeArquivo.replace(/[^\w.-]+/g, '-');
  try {
    await SolvePrinter.print({ name: nome });
    return;
  } catch {
    // segue para o plano B
  }

  try {
    const html = htmlAutonomo(nome);
    const arquivo = `${nome}.html`;
    await Filesystem.writeFile({
      path: arquivo, data: html, directory: Directory.Cache, encoding: Encoding.UTF8,
    });
    const { uri } = await Filesystem.getUri({ path: arquivo, directory: Directory.Cache });
    await Share.share({ title: nome, files: [uri], dialogTitle: 'Enviar proposta' });
  } catch (e) {
    console.error('[imprimir]', e);
    alert('Não foi possível abrir a impressão neste aparelho.');
  }
}

/** Empacota a cópia de impressão (.print-doc) num HTML que se sustenta sozinho. */
function htmlAutonomo(titulo) {
  const doc = document.querySelector('.print-doc');
  const estilos = [...document.styleSheets]
    .flatMap(f => { try { return [...f.cssRules].map(r => r.cssText); } catch { return []; } })
    .join('\n');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titulo}</title><style>${estilos}
/* fora do app, o documento é a página inteira */
.print-doc { display:block !important; visibility:visible !important; position:static !important; }
body { background:#fff; }
</style></head><body><div class="print-doc">${doc ? doc.innerHTML : ''}</div></body></html>`;
}

/* ─────────────── Inicialização ─────────────── */

/**
 * Ajustes que só fazem sentido dentro do app. Chamado uma vez, no App.jsx.
 * @param {object} acoes
 * @param {() => boolean} acoes.aoVoltarRaiz  fecha algo da tela? devolve true; senão false (e o app fecha)
 * @param {(ativo: boolean) => void} acoes.aoMudarEstado  app foi para frente/fundo
 */
export function iniciarNativo({ aoVoltarRaiz, aoMudarEstado } = {}) {
  if (!nativo) return () => {};

  const inscricoes = [];

  (async () => {
    try {
      await StatusBar.setStyle({ style: Style.Dark });          // ícones claros sobre o fundo preto
      if (plataforma === 'android') {
        await StatusBar.setOverlaysWebView({ overlay: false });  // conteúdo não passa por baixo do relógio
        await StatusBar.setBackgroundColor({ color: '#0a0a0b' });
      }
    } catch { /* status bar indisponível — não é motivo para travar o app */ }
    try { await SplashScreen.hide(); } catch { /* idem */ }
  })();

  // Teclado: rola o campo focado para a área visível (a WebView não faz sozinha)
  Keyboard.addListener('keyboardDidShow', () => {
    const el = document.activeElement;
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }).then(h => inscricoes.push(h)).catch(() => {});

  CapApp.addListener('backButton', () => {
    const topo = pilhaVoltar[pilhaVoltar.length - 1];
    if (topo) { topo(); return; }
    if (aoVoltarRaiz && aoVoltarRaiz()) return;
    CapApp.exitApp();
  }).then(h => inscricoes.push(h)).catch(() => {});

  CapApp.addListener('appStateChange', ({ isActive }) => {
    aoMudarEstado?.(isActive);
  }).then(h => inscricoes.push(h)).catch(() => {});

  return () => inscricoes.forEach(h => h.remove?.());
}
