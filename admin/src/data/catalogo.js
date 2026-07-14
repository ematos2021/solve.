// ─────────────────────────────────────────────────────────────────
// CATÁLOGO DE ITENS DO ORÇAMENTO — monte propostas sem digitar.
// Ajuste aqui os preços sugeridos (eles continuam editáveis item a
// item dentro de cada proposta). secao: 'mensal' ou 'unico'.
// ─────────────────────────────────────────────────────────────────

export const CATALOGO = [
  // ── Subscrição mensal: licenças de uso ──
  { secao: 'mensal', grupo: 'Licenças de uso', descricao: 'Licença de uso — PRIME', detalhe: 'Sistema de gestão integrada (SGI): auditorias, NCs, indicadores e produção', valor: 1490 },
  { secao: 'mensal', grupo: 'Licenças de uso', descricao: 'Licença de uso — GOqualy', detalhe: 'Métricas e rastreabilidade da qualidade de importados', valor: 1190 },
  { secao: 'mensal', grupo: 'Licenças de uso', descricao: 'Licença de uso — EasyOEE', detalhe: 'OEE em tempo real com apontamento no chão de fábrica', valor: 990 },
  { secao: 'mensal', grupo: 'Licenças de uso', descricao: 'Licença de uso — SGA', detalhe: 'Gestão ambiental: resíduos, manifestos e licenças (ISO 14001)', valor: 890 },
  { secao: 'mensal', grupo: 'Licenças de uso', descricao: 'Licença de uso — SIG Comércio', detalhe: 'Gestão comercial: vendas, estoque e financeiro', valor: 490 },
  { secao: 'mensal', grupo: 'Licenças de uso', descricao: 'Usuários adicionais', detalhe: 'Pacote de acessos além do incluído no plano (valor por usuário)', valor: 45 },

  // ── Subscrição mensal: infraestrutura e serviços recorrentes ──
  { secao: 'mensal', grupo: 'Infraestrutura e suporte', descricao: 'Infraestrutura em nuvem + SLA', detalhe: 'Hospedagem dedicada, backups diários e suporte em horário comercial', valor: 350 },
  { secao: 'mensal', grupo: 'Infraestrutura e suporte', descricao: 'SLA Premium — suporte prioritário', detalhe: 'Atendimento prioritário via WhatsApp com resposta em até 4h úteis', valor: 290 },
  { secao: 'mensal', grupo: 'Infraestrutura e suporte', descricao: 'Manutenção evolutiva — pacote de horas', detalhe: 'Banco de 5 horas/mês para melhorias e ajustes (valor do pacote)', valor: 750 },

  // ── Investimento único: implantação e serviços ──
  { secao: 'unico', grupo: 'Implantação', descricao: 'Implantação e configuração', detalhe: 'Setup do ambiente, parametrização e carga inicial', valor: 3500 },
  { secao: 'unico', grupo: 'Implantação', descricao: 'Migração de dados', detalhe: 'Importação de planilhas/sistema legado com validação', valor: 1800 },
  { secao: 'unico', grupo: 'Implantação', descricao: 'Treinamento de equipe', detalhe: 'Turma de até 10 pessoas, remoto, com material de apoio (valor por turma)', valor: 900 },
  { secao: 'unico', grupo: 'Implantação', descricao: 'Treinamento presencial', detalhe: 'Turma de até 10 pessoas nas dependências do cliente + deslocamento (valor por dia)', valor: 1800 },

  // ── Investimento único: sob medida ──
  { secao: 'unico', grupo: 'Sob medida', descricao: 'Customização — hora técnica', detalhe: 'Desenvolvimento de ajustes e relatórios específicos (valor por hora)', valor: 180 },
  { secao: 'unico', grupo: 'Sob medida', descricao: 'Módulo sob medida', detalhe: 'Levantamento, desenvolvimento e homologação de módulo exclusivo', valor: 8500 },
  { secao: 'unico', grupo: 'Sob medida', descricao: 'Integração com sistema externo', detalhe: 'API/planilha/ERP — inclui mapeamento e testes', valor: 2900 },
  { secao: 'unico', grupo: 'Sob medida', descricao: 'Licenças adicionais permanentes', detalhe: 'Aquisição definitiva, acesso nominativo (valor por licença)', valor: 1170 },
];

// Sugestões de objeto da proposta (aparecem ao focar o campo)
export const OBJETOS_SUGERIDOS = [
  'Licenciamento, implantação e treinamento do sistema PRIME — gestão integrada da qualidade.',
  'Licenciamento e implantação do GOqualy — rastreabilidade da qualidade de importados.',
  'Licenciamento e implantação do EasyOEE — monitoramento de OEE em tempo real.',
  'Licenciamento e implantação do SGA — gestão ambiental e conformidade ISO 14001.',
  'Licenciamento e implantação do SIG Comércio — gestão comercial completa.',
  'Upgrade de licenciamento: ampliação de usuários e infraestrutura em nuvem.',
  'Sistema de gestão e atendimento sob medida, incluindo implantação, treinamento e suporte.',
];
