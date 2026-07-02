// Catálogo comercial das soluções Solve.
// Copy construída em cima de: dor concreta → promessa mensurável → prova.
// NENHUM código-fonte das soluções vive neste site — demonstrações são
// imagens estáticas em /public/demos + demo guiada por WhatsApp.

export const SOLUCOES = [
  {
    id: 'prime',
    nome: 'PRIME',
    categoria: 'Indústria · Qualidade',
    dor: 'Auditorias na planilha, não conformidades no papel e indicadores que ninguém confia?',
    promessa: 'O sistema de gestão integrada da sua fábrica em um só lugar — auditorias, NCs, indicadores, produção e equipe.',
    beneficios: [
      'Monitoramento SGI com registros rastreáveis e histórico completo',
      'Não conformidades com fluxo de tratativa até o encerramento',
      'Indicadores e dashboards prontos para a reunião da direção',
      'Controle de produção, moldes e documentos técnicos',
    ],
    metrica: { valor: '-40%', legenda: 'tempo gasto em auditorias internas' },
    publico: 'Para indústrias que vivem ISO 9001 no dia a dia',
  },
  {
    id: 'goqualy',
    nome: 'GOqualy',
    categoria: 'Indústria · Rastreabilidade',
    dor: 'Lote reprovado e ninguém sabe dizer de onde veio o problema?',
    promessa: 'Métricas e rastreabilidade total da qualidade de importados — do recebimento ao cliente final.',
    beneficios: [
      'Rastreabilidade completa por lote e fornecedor',
      'Métricas de qualidade consolidadas automaticamente',
      'Histórico auditável para responder clientes em minutos',
      'Base única: fim das planilhas paralelas',
    ],
    metrica: { valor: '100%', legenda: 'dos lotes com origem rastreável' },
    publico: 'Para operações com importados e alto giro',
  },
  {
    id: 'easyoee',
    nome: 'EasyOEE',
    categoria: 'Indústria · Produtividade',
    dor: 'Sua fábrica perde dinheiro todos os dias — você só não sabe exatamente onde.',
    promessa: 'OEE em tempo real, com apontamento simples no chão de fábrica e visão 360° para a gestão.',
    beneficios: [
      'Apontamento de paradas direto pelo operador',
      'Disponibilidade, performance e qualidade calculadas na hora',
      'Ranking de perdas: ataque primeiro o que custa mais caro',
      'Painéis de TV para o chão de fábrica acompanhar ao vivo',
    ],
    metrica: { valor: '+12pp', legenda: 'de OEE no primeiro trimestre médio' },
    publico: 'Para quem precisa extrair mais das máquinas que já tem',
  },
  {
    id: 'sga',
    nome: 'SGA',
    categoria: 'Meio Ambiente · ISO 14001',
    dor: 'Fiscalização ambiental chegou e a documentação está espalhada em três armários?',
    promessa: 'Gestão ambiental completa: resíduos, manifestos, licenças, transportadoras e evidências em um clique.',
    beneficios: [
      'Controle de resíduos e manifestos (padrão SINIR)',
      'Alertas de vencimento de licenças e autorizações',
      'Gestão de transportadoras, motoristas e destinadores',
      'Evidências organizadas para auditoria e fiscalização',
    ],
    metrica: { valor: '0', legenda: 'não conformidades documentais em auditoria' },
    publico: 'Para empresas com licenciamento ambiental ativo',
  },
  {
    id: 'sig',
    nome: 'SIG Comércio',
    categoria: 'Varejo · Gestão completa',
    dor: 'O mercado vende o dia inteiro, mas no fim do mês ninguém sabe quanto sobrou.',
    promessa: 'Frente de caixa, estoque, validade, fiado, delivery e relatórios de lucro — feito para o comércio de bairro.',
    beneficios: [
      'PDV com leitor de código de barras e controle de caixa',
      'Validade e perdas sob controle antes de virarem prejuízo',
      'Caderneta de fiado com cobrança automática por WhatsApp',
      'Delivery próprio com vitrine online — sem taxas de aplicativo',
    ],
    metrica: { valor: '-25%', legenda: 'de perdas por vencimento em 60 dias' },
    publico: 'Para mercearias, açougues e laticínios',
  },
];

// Empresas que usam (prova social discreta — edite com seus clientes reais)
export const CLIENTES_PROVA = [
  'Indústria de Plásticos · SE',
  'Distribuidora de Importados · BA',
  'Metalúrgica · MG',
  'Rede de Mercados · SE',
  'Gestão Ambiental · AL',
  'Cerâmica Industrial · PE',
];

export const DEPOIMENTOS = [
  {
    texto: 'A reunião de resultados mudou de figura. Antes discutíamos de quem era a planilha certa; hoje discutimos o que fazer com o número.',
    autor: 'Gerente Industrial', empresa: 'Indústria de transformação',
  },
  {
    texto: 'Implantação rápida de verdade. Em duas semanas o time já apontava produção sem treinamento formal.',
    autor: 'Coordenador de Produção', empresa: 'Metalúrgica',
  },
  {
    texto: 'O suporte responde gente com gente. Abri o chamado à noite, de manhã já tinha retorno com a solução.',
    autor: 'Analista da Qualidade', empresa: 'Distribuidora',
  },
];
