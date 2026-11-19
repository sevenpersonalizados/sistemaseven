/**
 * SEVEN PERSONALIZADOS — STORAGE & DATA SERVICE (SUPABASE CLOUD + LOCAL CACHE)
 * Gerenciador unificado de persistência sincronizado em tempo real com Supabase
 */

const SUPABASE_CONFIG = {
  url: 'https://mblpfzwqsobgvdugkgjp.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ibHBmendxc29iZ3ZkdWdrZ2pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ1OTUyNjUsImV4cCI6MjExMDE3MTI2NX0.J5P4FwCwZni8GfY8J7RGi00Fght1xYhAszIVBon-VeQ'
};

const STORAGE_KEYS = {
  CRM_CARDS: 'seven_crm_cards_v1',
  ENCOMENDAS: 'seven_encomendas_v1',
  ESTOQUE: 'seven_estoque_v1',
  DESPESAS: 'seven_despesas_v1',
  PROPOSTAS: 'seven_propostas_v1',
  FILAMENTOS: 'seven_filamentos_v1',
  CALC_3D_CONFIG: 'seven_calc_3d_config_v1',
  CALC_3D_HISTORICO: 'seven_calc_3d_historico_v1',
  CALC_LASER_CONFIG: 'seven_calc_laser_config_v1',
  CALC_LASER_HISTORICO: 'seven_calc_laser_historico_v1',
  FINANCEIRO_LANCAMENTOS: 'seven_financeiro_lancamentos_v1',
  CONFIG: 'seven_config_v1',
  SUPABASE_SETTINGS: 'seven_supabase_config_v1'
};

// Sementes Iniciais Ricas para Seven Personalizados
const INITIAL_DATA = {
  config: {
    id: 'main',
    nomeEmpresa: 'Seven Personalizados',
    slogan: 'Personalização a Laser, Impressão 3D e Brindes Exclusivos',
    telefone: '(11) 98765-4321',
    whatsapp: '5511987654321',
    email: 'contato@sevenpersonalizados.com.br',
    chavePix: 'contato@sevenpersonalizados.com.br',
    endereco: 'Rua das Indústrias Criativas, 77 — SP',
    categorias_producao: ['3D', 'Gravação laser', 'Corte laser', 'Corte e Gravação'],
    categorias_despesa: ['Matéria-Prima', 'Insumos 3D', 'Manutenção Máquinas', 'Custos Fixos (Luz/Água/Aluguel)', 'Embalagens & Envios', 'Marketing & Anúncios', 'Pró-Labore / Sócios', 'Impostos & Taxas', 'Outros'],
    categorias_receita: ['Venda de Personalizados', 'Gravação Laser', 'Impressão 3D', 'Brindes Corporativos', 'Serviço de Design', 'Outras Receitas'],
    centros_custo: ['Oficina / Produção Laser', 'Produção 3D', 'Balcão / Loja Física', 'Administrativo & Vendas', 'Geral'],
    locais_pagamento: ['Banco Inter', 'Nubank', 'Caixa Físico', 'Mercado Pago', 'Cofre'],
    proprietarios: ['Proprietário 1', 'Proprietário 2'],
    formas_pagamento: ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Boleto', 'Dinheiro'],
    cores: [
      'Preto', 'Branco', 'Dourado', 'Prata', 'Vermelho', 'Azul', 'Verde',
      'Amarelo', 'Rosa', 'Laranja', 'Roxo', 'Cobre / Bronze', 'Madeira Natural', 'Transparente'
    ],
    produtos_estabelecidos: [
      'Copo Térmico Inox', 'Taça de Gin Acrílica', 'Chaveiro MDF', 'Troféu Acrílico',
      'Quadro MDF Vazado', 'Peça Impressa 3D', 'Luminária LED Acrílico', 'Caneca Personalizada'
    ],
    marcas_filamento: [
      'Voolt3D', 'Creality', '3D Fila', 'eSun', 'Sunlu', 'Sethi3D', 'National 3D', 'PrintaLot'
    ]
  },
  crm_cards: [
    {
      id: 'lead-1',
      lead_name: 'Camila Rodrigues (Empresa TechX)',
      phone: '(11) 99123-4567',
      last_message: 'Pediu orçamento de 50 copos térmicos com logo gravado a laser.',
      stage: 'conversas',
      value: 1750.00,
      updated_at: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: 'lead-2',
      lead_name: 'Marcelo Santos (Casamento)',
      phone: '(11) 98234-5678',
      last_message: 'Enviada tabela com valores de 120 taças de gin personalizadas.',
      stage: 'orcamento',
      value: 980.00,
      updated_at: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      id: 'lead-3',
      lead_name: 'Juliana Paiva (Studio Fit)',
      phone: '(11) 97345-6789',
      last_message: 'Aguardando aprovação da diretoria para squeezes e chaveiros 3D.',
      stage: 'aprovacao',
      value: 2400.00,
      updated_at: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      id: 'lead-4',
      lead_name: 'Dr. Roberto Mendes',
      phone: '(11) 96456-7890',
      last_message: 'Fechou pedido de troféus em acrílico e base em MDF.',
      stage: 'fechado',
      value: 3200.00,
      updated_at: new Date(Date.now() - 3600000 * 48).toISOString()
    },
    {
      id: 'lead-5',
      lead_name: 'Lucas Ferreira',
      phone: '(11) 95567-8901',
      last_message: 'Prazo urgente de 24h não foi possível atender.',
      stage: 'perdido',
      value: 450.00,
      updated_at: new Date(Date.now() - 3600000 * 72).toISOString()
    }
  ],
  estoque: [
    {
      id: 'est-1',
      nome: 'Filamento PLA Silk Ouro 1.75mm',
      categoria: '3D',
      cor: 'Dourado / Ouro',
      unidade: 'kg',
      quantidade_atual: 1.2,
      estoque_minimo: 3.0,
      custo_unitario: 110.00,
      data_ultima_compra: '2026-11-10',
      ativo: true
    },
    {
      id: 'est-2',
      nome: 'Chapa MDF Cru 3mm (60x40cm)',
      categoria: 'Corte laser',
      cor: 'Madeira Natural',
      unidade: 'un',
      quantidade_atual: 8,
      estoque_minimo: 20,
      custo_unitario: 7.50,
      data_ultima_compra: '2026-11-05',
      ativo: true
    },
    {
      id: 'est-3',
      nome: 'Copo Térmico Inox 473ml (Tipo Stanley)',
      categoria: 'Gravação laser',
      cor: 'Preto',
      unidade: 'un',
      quantidade_atual: 35,
      estoque_minimo: 15,
      custo_unitario: 24.00,
      data_ultima_compra: '2026-11-12',
      ativo: true
    },
    {
      id: 'est-4',
      nome: 'Chapa Acrílico Cristal 2mm (50x50cm)',
      categoria: 'Corte e Gravação',
      cor: 'Transparente',
      unidade: 'un',
      quantidade_atual: 4,
      estoque_minimo: 10,
      custo_unitario: 28.00,
      data_ultima_compra: '2026-11-01',
      ativo: true
    },
    {
      id: 'est-5',
      nome: 'Caixa de Envio Kraft Reforçada',
      categoria: 'Corte laser',
      cor: '',
      unidade: 'un',
      quantidade_atual: 60,
      estoque_minimo: 30,
      custo_unitario: 2.20,
      data_ultima_compra: '2026-10-28',
      ativo: true
    }
  ],
  encomendas: [
    {
      id: 'enc-1',
      cliente_nome: 'Dr. Roberto Mendes',
      telefone: '(11) 96456-7890',
      data_pedido: new Date(Date.now() - 3600000 * 36).toISOString().split('T')[0],
      data_entrega_prevista: new Date(Date.now() + 3600000 * 48).toISOString().split('T')[0],
      status: 'Em produção',
      pagamento_status: 'Parcial',
      valor_total: 3200.00,
      valor_pago: 1600.00,
      forma_pagamento: 'Pix',
      observacoes: 'Gravação a laser com logo do congresso médico',
      itens: [
        {
          produto_nome: 'Troféu Acrílico e MDF Especial',
          personalizacao: 'Logo Prêmio Inovação 2026',
          quantidade: 20,
          preco_unitario: 160.00,
          subtotal: 3200.00
        }
      ]
    },
    {
      id: 'enc-2',
      cliente_nome: 'Ana Carolina Festas',
      telefone: '(11) 94321-8765',
      data_pedido: new Date(Date.now() - 3600000 * 20).toISOString().split('T')[0],
      data_entrega_prevista: new Date(Date.now() + 3600000 * 24).toISOString().split('T')[0],
      status: 'Pronto',
      pagamento_status: 'Pago',
      valor_total: 850.00,
      valor_pago: 850.00,
      forma_pagamento: 'Cartão de Crédito',
      observacoes: 'Cliente retirará no balcão.',
      itens: [
        {
          produto_nome: 'Lembrancinhas 3D Ursinho Vazado',
          personalizacao: 'Nome "Enzo 1 aninho"',
          quantidade: 50,
          preco_unitario: 17.00,
          subtotal: 850.00
        }
      ]
    },
    {
      id: 'enc-3',
      cliente_nome: 'Restaurante do Lago',
      telefone: '(11) 93210-9876',
      data_pedido: new Date(Date.now() - 3600000 * 4).toISOString().split('T')[0],
      data_entrega_prevista: new Date(Date.now() + 3600000 * 96).toISOString().split('T')[0],
      status: 'Fila',
      pagamento_status: 'Pendente',
      valor_total: 1200.00,
      valor_pago: 0.00,
      forma_pagamento: 'Pix',
      observacoes: 'Displays de mesa com QR Code em madeira gravada',
      itens: [
        {
          produto_nome: 'Display Porta Guardanapo e QR Code',
          personalizacao: 'Logo Cardápio Digital',
          quantidade: 30,
          preco_unitario: 40.00,
          subtotal: 1200.00
        }
      ]
    }
  ],
  despesas: [
    {
      id: 'desp-1',
      descricao: 'Compra de Filamento PLA & Resina',
      categoria: 'Matéria-prima',
      valor: 640.00,
      data: new Date(Date.now() - 3600000 * 72).toISOString().split('T')[0],
      forma_pagamento: 'Pix'
    },
    {
      id: 'desp-2',
      descricao: 'Lote de Caixas e Plástico Bolha',
      categoria: 'Embalagem',
      valor: 185.00,
      data: new Date(Date.now() - 3600000 * 48).toISOString().split('T')[0],
      forma_pagamento: 'Cartão de Crédito'
    },
    {
      id: 'desp-3',
      descricao: 'Manutenção Lente Laser CO2',
      categoria: 'Manutenção',
      valor: 250.00,
      data: new Date(Date.now() - 3600000 * 24).toISOString().split('T')[0],
      forma_pagamento: 'Pix'
    }
  ],
  financeiro_lancamentos: [
    {
      id: 'fin-1',
      tipo: 'receita',
      descricao: 'Entrada Encomenda #164 (Dr. Roberto Mendes)',
      valor: 1600.00,
      categoria: 'Brindes Corporativos',
      centro_custo: 'Oficina / Produção Laser',
      data: new Date(Date.now() - 3600000 * 36).toISOString().split('T')[0],
      forma_pagamento: 'Pix',
      local_pagamento: 'Banco Inter',
      status: 'recebido',
      observacoes: '50% de entrada - Troféus em acrílico e MDF',
      proprietario: 'Proprietário 1',
      parcela_atual: 1,
      total_parcelas: 1,
      origem: 'encomenda',
      origem_id: 'enc-1',
      estornado: false,
      historico_alteracoes: []
    },
    {
      id: 'fin-2',
      tipo: 'receita',
      descricao: 'Quitação Encomenda #876 (Ana Carolina Festas)',
      valor: 850.00,
      categoria: 'Impressão 3D',
      centro_custo: 'Produção 3D',
      data: new Date(Date.now() - 3600000 * 20).toISOString().split('T')[0],
      forma_pagamento: 'Cartão de Crédito',
      local_pagamento: 'Nubank',
      status: 'recebido',
      observacoes: '50x Lembrancinhas 3D Ursinho',
      proprietario: 'Proprietário 2',
      parcela_atual: 1,
      total_parcelas: 1,
      origem: 'encomenda',
      origem_id: 'enc-2',
      estornado: false,
      historico_alteracoes: []
    },
    {
      id: 'fin-3',
      tipo: 'receita',
      descricao: 'Restante Encomenda #164 (Dr. Roberto Mendes)',
      valor: 1600.00,
      categoria: 'Brindes Corporativos',
      centro_custo: 'Oficina / Produção Laser',
      data: new Date(Date.now() + 3600000 * 48).toISOString().split('T')[0],
      forma_pagamento: 'Pix',
      local_pagamento: 'Banco Inter',
      status: 'pendente',
      observacoes: 'A receber na entrega dos troféus',
      proprietario: 'Proprietário 1',
      parcela_atual: 1,
      total_parcelas: 1,
      origem: 'encomenda',
      origem_id: 'enc-1',
      estornado: false,
      historico_alteracoes: []
    },
    {
      id: 'fin-4',
      tipo: 'despesa',
      descricao: 'Compra de Filamento PLA & Resina',
      valor: 640.00,
      categoria: 'Insumos 3D',
      centro_custo: 'Produção 3D',
      data: new Date(Date.now() - 3600000 * 72).toISOString().split('T')[0],
      forma_pagamento: 'Pix',
      local_pagamento: 'Banco Inter',
      status: 'pago',
      observacoes: 'Reposição de estoque PLA Silk e Resina UV',
      proprietario: 'Proprietário 1',
      parcela_atual: 1,
      total_parcelas: 1,
      origem: 'manual',
      estornado: false,
      historico_alteracoes: []
    },
    {
      id: 'fin-5',
      tipo: 'despesa',
      descricao: 'Lote de Caixas e Plástico Bolha',
      valor: 185.00,
      categoria: 'Embalagens & Envios',
      centro_custo: 'Administrativo & Vendas',
      data: new Date(Date.now() - 3600000 * 48).toISOString().split('T')[0],
      forma_pagamento: 'Cartão de Crédito',
      local_pagamento: 'Nubank',
      status: 'pago',
      observacoes: '100 caixas de envio para correios',
      proprietario: 'Proprietário 2',
      parcela_atual: 1,
      total_parcelas: 1,
      origem: 'manual',
      estornado: false,
      historico_alteracoes: []
    },
    {
      id: 'fin-6',
      tipo: 'despesa',
      descricao: 'Manutenção Lente Laser CO2',
      valor: 250.00,
      categoria: 'Manutenção Máquinas',
      centro_custo: 'Oficina / Produção Laser',
      data: new Date(Date.now() - 3600000 * 24).toISOString().split('T')[0],
      forma_pagamento: 'Pix',
      local_pagamento: 'Banco Inter',
      status: 'pago',
      observacoes: 'Troca de lente de foco 20mm',
      proprietario: 'Proprietário 1',
      parcela_atual: 1,
      total_parcelas: 1,
      origem: 'manual',
      estornado: false,
      historico_alteracoes: []
    },
    {
      id: 'fin-7',
      tipo: 'despesa',
      descricao: 'Conta de Energia Elétrica (Oficina)',
      valor: 320.00,
      categoria: 'Custos Fixos (Luz/Água/Aluguel)',
      centro_custo: 'Geral',
      data: new Date(Date.now() + 3600000 * 72).toISOString().split('T')[0],
      forma_pagamento: 'Boleto',
      local_pagamento: 'Banco Inter',
      status: 'pendente',
      observacoes: 'Vencimento da fatura Enel',
      proprietario: 'Proprietário 1',
      parcela_atual: 1,
      total_parcelas: 1,
      recorrente: true,
      frequencia_recorrencia: 'mensal',
      origem: 'manual',
      estornado: false,
      historico_alteracoes: []
    }
  ],
  propostas: [
    {
      id: 'prop-1',
      cliente: 'Empresa TechX Inovações',
      contato: 'Camila Rodrigues',
      telefone: '(11) 99123-4567',
      titulo: 'Proposta de Brindes Corporativos de Fim de Ano',
      escopo: 'Fornecimento de 50 Copos Térmicos Inox personalizados a laser com gravação em alta definição da logomarca da empresa e embalagem premium individual com laço personalizado.',
      metodo: 'Criação da maquete digital para aprovação -> Gravação a laser de precisão de 0.05mm -> Inspeção de qualidade peça por peça -> Embalagem e despacho com rastreamento.',
      prazo: '5 a 7 dias úteis após aprovação final da arte.',
      investimento: 1750.00,
      condicoes: '50% de entrada no aceite e 50% na retirada/envio via Pix ou Cartão em até 3x.',
      status: 'Enviada',
      criada_em: new Date().toISOString()
    }
  ],
  filamentos: [
    {
      id: 'fil-1',
      material: 'PLA',
      marca: 'Voolt3D',
      cor: 'Preto Clássico',
      peso_rolo_g: 1000,
      preco_rolo: 110.00,
      custo_por_g: 0.11,
      ativo: true
    },
    {
      id: 'fil-2',
      material: 'PLA Silk',
      marca: 'Esun',
      cor: 'Ouro Nobre Metálico',
      peso_rolo_g: 1000,
      preco_rolo: 150.00,
      custo_por_g: 0.15,
      ativo: true
    },
    {
      id: 'fil-3',
      material: 'PETG',
      marca: 'Creality',
      cor: 'Cristal Translúcido',
      peso_rolo_g: 1000,
      preco_rolo: 120.00,
      custo_por_g: 0.12,
      ativo: true
    },
    {
      id: 'fil-4',
      material: 'ABS',
      marca: '3D Fila',
      cor: 'Cinza Espacial',
      peso_rolo_g: 1000,
      preco_rolo: 98.00,
      custo_por_g: 0.098,
      ativo: true
    }
  ],
  calc_3d_config: {
    id: 'main_3d_calc',
    tarifa_kwh: 0.85,
    potencia_impressora_w: 200,
    custo_operacional_hora: 3.50,
    margem_lucro_padrao: 100
  },
  calc_3d_historico: [
    {
      id: 'calc-hist-1',
      data: new Date(Date.now() - 3600000 * 24).toISOString(),
      produto_nome: 'Troféu 3D Seven Personalizados',
      filamento_id: 'fil-2',
      filamento_nome: 'PLA Silk Ouro Nobre Metálico (Esun)',
      gramas: 140,
      tempo_horas: 5,
      tempo_minutos: 30,
      tempo_total_horas: 5.5,
      tempo_horas_dec: 5.5,
      tempo_formatado: '5h 30m',
      quantidade_pecas: 2,
      custo_filamento: 21.00,
      custo_material: 21.00,
      consumo_kwh: 1.1,
      custo_energia: 0.935,
      custo_operacional: 19.25,
      custo_total: 41.185,
      custo_unitario: 20.5925,
      margem_lucro_pct: 100,
      preco_venda_total: 82.37,
      preco_venda_unitario: 41.18,
      lucro_total: 41.185,
      lucro_estimado_total: 41.185,
      lucro_estimado_unitario: 20.5925,
      observacoes: 'Bico 0.4mm, camada 0.2mm, infill 15%'
    }
  ],
  calc_laser_config: {
    id: 'main_laser_calc',
    valor_hora_laser: 30.00, // R$ 30,00 por hora (R$ 0,50 por minuto)
    margem_padrao: 100, // 100% de margem
    chapas: [
      { id: 'cru', nome: 'MDF Cru', cor: 'Cru', espessura_mm: 3, largura_m: 2.13, comprimento_m: 2.75, preco_chapa: 60.18, cor_hex: '#d97706', bg_badge: 'rgba(217, 119, 6, 0.2)', text_color: '#fbbf24' },
      { id: 'branco', nome: 'MDF Branco', cor: 'Branco', espessura_mm: 3, largura_m: 1.20, comprimento_m: 1.85, preco_chapa: 99.55, cor_hex: '#f8fafc', bg_badge: 'rgba(255, 255, 255, 0.15)', text_color: '#f8fafc' },
      { id: 'preto', nome: 'MDF Preto', cor: 'Preto', espessura_mm: 3, largura_m: 1.20, comprimento_m: 1.85, preco_chapa: 105.00, cor_hex: '#334155', bg_badge: 'rgba(51, 65, 85, 0.4)', text_color: '#cbd5e1' },
      { id: 'azul', nome: 'MDF Azul', cor: 'Azul', espessura_mm: 3, largura_m: 1.20, comprimento_m: 1.85, preco_chapa: 110.00, cor_hex: '#3b82f6', bg_badge: 'rgba(59, 130, 246, 0.2)', text_color: '#60a5fa' },
      { id: 'vermelho', nome: 'MDF Vermelho', cor: 'Vermelho', espessura_mm: 3, largura_m: 1.20, comprimento_m: 1.85, preco_chapa: 110.00, cor_hex: '#ef4444', bg_badge: 'rgba(239, 68, 68, 0.2)', text_color: '#f87171' },
      { id: 'gold', nome: 'Gold (Dourado)', cor: 'Gold', espessura_mm: 2, largura_m: 1.00, comprimento_m: 2.00, preco_chapa: 180.00, cor_hex: '#eab308', bg_badge: 'rgba(234, 179, 8, 0.22)', text_color: '#fde047' },
      { id: 'silver', nome: 'Silver (Prata)', cor: 'Silver', espessura_mm: 2, largura_m: 1.00, comprimento_m: 2.00, preco_chapa: 180.00, cor_hex: '#94a3b8', bg_badge: 'rgba(148, 163, 184, 0.22)', text_color: '#e2e8f0' }
    ]
  },
  calc_laser_historico: [
    {
      id: 'calc-laser-1',
      data: new Date().toISOString().split('T')[0],
      produto_nome: 'Mandala Laser 30x30cm (Exemplo)',
      cor_id: 'cru',
      cor_nome: 'MDF Cru',
      espessura_mm: 3,
      largura_m: 0.30,
      comprimento_m: 0.30,
      area_m2: 0.09,
      tempo_minutos: 10,
      valor_hora_laser: 30.00,
      custo_material: 0.92,
      custo_laser: 5.00,
      custos_extras: 0.00,
      custo_unitario: 5.92,
      margem_lucro_pct: 100,
      preco_venda_unitario: 11.84,
      quantidade_pecas: 1,
      custo_total: 5.92,
      preco_venda_total: 11.84,
      lucro_total: 5.92
    }
  ]
};

// Objeto de Operações de Banco (Local Cache + Sincronização Supabase Realtime)
const StorageService = {
  isCloudConnected: false,
  clientId: 'cli_' + Math.random().toString(36).substring(2, 9),
  recentLocalActions: new Map(),
  supabaseClient: null,
  _pollingInterval: null,

  recordLocalAction(id) {
    if (!id) return;
    this.recentLocalActions.set(id, Date.now());
    // Limpa ações antigas após 20 segundos
    setTimeout(() => {
      this.recentLocalActions.delete(id);
    }, 20000);
  },

  isLocalAction(id) {
    if (!id) return false;
    const time = this.recentLocalActions.get(id);
    if (!time) return false;
    return (Date.now() - time) < 20000;
  },

  init() {
    Object.keys(INITIAL_DATA).forEach(key => {
      const storageKey = STORAGE_KEYS[key.toUpperCase()];
      if (!localStorage.getItem(storageKey)) {
        localStorage.setItem(storageKey, JSON.stringify(INITIAL_DATA[key]));
      }
    });

    this.syncFromSupabase().then(() => {
      this.initRealtime();
    });

    this.startPollingFallback();
  },

  initRealtime() {
    if (!window.supabase || !window.supabase.createClient) {
      console.warn('Supabase JS não carregado para Realtime. Usando sincronização periódica de alta velocidade.');
      return;
    }

    try {
      this.supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
      this.realtimeChannel = this.supabaseClient.channel('seven-realtime-master', {
        config: {
          broadcast: { self: false }
        }
      });

      // Escuta canal broadcast para testes e alertas instantâneos entre celulares/PCs
      this.realtimeChannel.on('broadcast', { event: 'alerta-teste' }, (event) => {
        console.log('⚡ [Realtime Broadcast Recebido]:', event);
        const p = event.payload || {};
        const title = p.title || '🔔 Teste de Notificação — Seven';
        const body = p.body || 'Notificação de teste recebida com sucesso no celular!';
        if (typeof NotificationModule !== 'undefined') {
          NotificationModule.show({ title, body });
        }
        if (typeof App !== 'undefined' && App.toast) {
          App.toast(body, 'success');
        }
      });

      // Escuta global de mudanças em qualquer tabela do schema public publicada no Realtime
      this.realtimeChannel.on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        console.log(`⚡ [Realtime Supabase Global] Alteração detectada em ${payload.table}:`, payload);
        if (payload.table) {
          this.handleRealtimeEvent(payload.table, payload);
        }
      });

      this.realtimeChannel.subscribe((status) => {
        console.log('📡 Status Supabase Realtime:', status);
        if (status === 'SUBSCRIBED') {
          this.isCloudConnected = true;
          this.updateSyncBadge('online', 'Tempo Real Ativo ⚡');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          this.updateSyncBadge('offline', 'Reconectando nuvem...');
        }
      });
    } catch (err) {
      console.error('Erro ao inicializar Supabase Realtime:', err);
    }
  },

  async enviarAlertaTesteBroadcast(titulo, mensagem) {
    if (!this.realtimeChannel) {
      this.initRealtime();
    }
    const title = titulo || '🔔 Teste de Notificação — Seven';
    const body = mensagem || 'Sistema Seven Personalizados: Conexão em tempo real e notificações ativas! 🚀';
    const alertId = 'alt-' + Date.now();

    // 1. Dispara localmente neste dispositivo
    if (typeof NotificationModule !== 'undefined') {
      NotificationModule.show({ title, body });
    }

    // 2. Dispara broadcast via WebSocket para dispositivos com aba aberta no momento
    if (this.realtimeChannel) {
      this.realtimeChannel.send({
        type: 'broadcast',
        event: 'alerta-teste',
        payload: { id: alertId, title, body, timestamp: Date.now() }
      }).catch(err => {
        console.warn('Erro ao transmitir broadcast:', err);
      });
    }

    // 3. Grava no banco de dados Supabase na tabela public.alertas_sistema
    // Garante 100% de entrega via WAL Replication (postgres_changes) e Polling de fundo
    try {
      this.recordLocalAction(alertId);
      const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/alertas_sistema`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          id: alertId,
          titulo: title,
          mensagem: body,
          tipo: 'teste',
          origem: 'painel'
        })
      });
      if (res.ok) {
        if (typeof App !== 'undefined' && App.toast) {
          App.toast('Sinal transmitido via nuvem para todos os celulares!', 'success');
        }
      }
    } catch (e) {
      console.warn('Erro ao registrar alerta no Supabase:', e);
    }
  },

  handleRealtimeEvent(table, payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    // Trata alertas de sistema específicos
    if (table === 'alertas_sistema') {
      if (eventType === 'INSERT' && newRecord) {
        const isMine = this.isLocalAction(newRecord.id);
        if (!isMine) {
          if (typeof NotificationModule !== 'undefined') {
            NotificationModule.show({
              title: newRecord.titulo || '🔔 Alerta Seven Personalizados',
              body: newRecord.mensagem || 'Notificação recebida com sucesso!',
              tag: newRecord.id
            });
          }
        }
      }
      return;
    }

    const key = STORAGE_KEYS[table.toUpperCase()];
    if (!key) return;

    let items = this.get(table);
    const targetId = newRecord?.id || oldRecord?.id;
    const isMine = this.isLocalAction(targetId);

    if (eventType === 'INSERT' && newRecord) {
      if (!items.some(i => i.id === newRecord.id)) {
        items.unshift(newRecord);
        localStorage.setItem(key, JSON.stringify(items));
        window.dispatchEvent(new CustomEvent('seven_data_updated', { detail: { table } }));

        if (!isMine) {
          let title = 'Seven Personalizados ⚡';
          let body = `Novo registro adicionado em ${table}!`;
          if (table === 'encomendas') {
            title = '✨ Nova Encomenda!';
            body = `Pedido de ${newRecord.cliente_nome || 'Cliente'} (${newRecord.categoria || 'Produção'}) adicionado!`;
          } else if (table === 'crm_cards') {
            title = '💬 Novo Lead no Funil!';
            body = `${newRecord.lead_name || 'Lead'} entrou no CRM.`;
          } else if (table === 'propostas') {
            title = '📄 Novo Orçamento!';
            body = `Orçamento para ${newRecord.cliente || newRecord.cliente_nome || 'Cliente'} gerado!`;
          } else if (table === 'estoque') {
            title = '🧱 Novo Insumo em Estoque!';
            body = `"${newRecord.nome || 'Material'}" cadastrado no estoque.`;
          } else if (table === 'despesas' || table === 'financeiro_lancamentos') {
            const isRec = newRecord.tipo === 'receita';
            title = isRec ? '💰 Nova Receita Registrada!' : '💸 Nova Despesa Lançada!';
            body = `[${newRecord.proprietario || 'Proprietário'}] ${newRecord.descricao || 'Lançamento'} — ${App.formatMoney(newRecord.valor || 0)}`;
          }

          if (typeof NotificationModule !== 'undefined') {
            NotificationModule.show({ title, body, tag: `ins-${newRecord.id}` });
          }
          if (typeof App !== 'undefined' && App.toast) {
            App.toast(body, 'info');
          }
        }
      }
    } else if (eventType === 'UPDATE' && newRecord) {
      const idx = items.findIndex(i => i.id === newRecord.id);
      if (idx !== -1) {
        items[idx] = newRecord;
      } else {
        items.unshift(newRecord);
      }
      localStorage.setItem(key, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('seven_data_updated', { detail: { table } }));

      if (!isMine) {
        let title = 'Seven Personalizados — Atualização ⚡';
        let body = `Alteração em ${table}`;
        if (table === 'encomendas') {
          title = '⚙️ Encomenda Atualizada!';
          body = `Pedido #${newRecord.id.substring(newRecord.id.length - 5)} (${newRecord.cliente_nome}): ${newRecord.status} • ${newRecord.pagamento_status}`;
        } else if (table === 'crm_cards') {
          title = '💬 Lead Atualizado no CRM!';
          body = `${newRecord.lead_name} avançou para etapa: ${newRecord.stage}!`;
        } else if (table === 'propostas') {
          title = '📄 Orçamento Atualizado!';
          body = `Orçamento "${newRecord.titulo || 'Comercial'}" (${newRecord.cliente || ''}) foi atualizado.`;
        } else if (table === 'estoque') {
          title = '🧱 Estoque Atualizado!';
          body = `"${newRecord.nome || 'Material'}" agora com ${newRecord.quantidade_atual} ${newRecord.unidade || 'un'}.`;
        } else if (table === 'despesas' || table === 'financeiro_lancamentos') {
          title = '💼 Financeiro Atualizado!';
          body = `Lançamento "${newRecord.descricao || ''}" atualizado (${newRecord.status || ''}).`;
        }

        if (typeof NotificationModule !== 'undefined') {
          NotificationModule.show({ title, body, tag: `upd-${newRecord.id}` });
        }
        if (typeof App !== 'undefined' && App.toast) {
          App.toast(body, 'info');
        }
      }
    } else if (eventType === 'DELETE' && oldRecord) {
      items = items.filter(i => i.id !== oldRecord.id);
      localStorage.setItem(key, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('seven_data_updated', { detail: { table } }));
    }
  },

  startPollingFallback() {
    if (this._pollingInterval) return;
    // Sincronização periódica a cada 15s como garantia total de rede móvel (iPhone)
    this._pollingInterval = setInterval(() => {
      this.syncFromSupabase(true);
    }, 15000);

    // E sincronização instantânea ao reabrir o iPhone ou voltar para a aba
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.syncFromSupabase(true);
      }
    });
    window.addEventListener('focus', () => {
      this.syncFromSupabase(true);
    });
  },

  getHeaders(prefer = 'return=representation') {
    return {
      'apikey': SUPABASE_CONFIG.anonKey,
      'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': prefer
    };
  },

  updateSyncBadge(status, label) {
    const el = document.getElementById('cloud-sync-badge');
    if (!el) return;
    if (status === 'online') {
      el.style.color = '#10b981';
      el.style.borderColor = 'rgba(16, 185, 129, 0.35)';
      el.innerHTML = `🟢 ${label || 'Supabase Conectado'}`;
    } else if (status === 'syncing') {
      el.style.color = '#fbbf24';
      el.style.borderColor = 'rgba(251, 191, 36, 0.35)';
      el.innerHTML = `🔄 ${label || 'Sincronizando...'}`;
    } else {
      el.style.color = '#94a3b8';
      el.style.borderColor = 'var(--border)';
      el.innerHTML = `⚪ ${label || 'Modo Local'}`;
    }
  },

  async syncFromSupabase(isSilent = false) {
    if (!isSilent) {
      this.updateSyncBadge('syncing', 'Sincronizando nuvem...');
    }
    const tables = ['crm_cards', 'encomendas', 'estoque', 'despesas', 'propostas', 'filamentos', 'calc_3d_historico', 'calc_laser_historico', 'financeiro_lancamentos'];

    try {
      await Promise.all(tables.map(async (table) => {
        try {
          const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/${table}?select=*&order=created_at.desc`, {
            headers: this.getHeaders()
          });
          if (res.ok) {
            const rows = await res.json();
            if (Array.isArray(rows)) {
              const key = STORAGE_KEYS[table.toUpperCase()];
              const currentItems = this.get(table);
              const cloudIds = new Set(rows.map(r => r.id));

              let merged;
              if (rows.length === 0 && currentItems.length > 0) {
                // Nuvem retornou vazio para esta tabela: preserva dados locais e tenta sincronizar com o Supabase
                merged = currentItems;
                currentItems.forEach(item => {
                  fetch(`${SUPABASE_CONFIG.url}/rest/v1/${table}`, {
                    method: 'POST',
                    headers: this.getHeaders('resolution=merge-duplicates'),
                    body: JSON.stringify(item)
                  }).catch(e => console.warn(`[Sync] Falha ao enviar item local para ${table}:`, e));
                });
              } else {
                // Protege itens recém-inseridos localmente que ainda possam estar em trânsito de rede
                const pendingLocal = currentItems.filter(item => !cloudIds.has(item.id) && this.isLocalAction(item.id));
                merged = [...pendingLocal, ...rows];
              }

              const prevStr = localStorage.getItem(key) || '[]';
              const newStr = JSON.stringify(merged);
              if (prevStr !== newStr) {
                // Notifica se novos registros foram baixados da nuvem durante polling
                if (isSilent && currentItems.length > 0) {
                  const currentIds = new Set(currentItems.map(i => i.id));
                  const novos = rows.filter(r => !currentIds.has(r.id) && !this.isLocalAction(r.id));
                  if (novos.length > 0) {
                    novos.forEach(r => {
                      let title = 'Seven Personalizados ⚡';
                      let body = `Nova atualização em ${table}!`;
                      if (table === 'encomendas') {
                        title = '✨ Nova Encomenda!';
                        body = `Pedido de ${r.cliente_nome || 'Cliente'} adicionado!`;
                      } else if (table === 'propostas') {
                        title = '📄 Novo Orçamento!';
                        body = `Orçamento para ${r.cliente || 'Cliente'} gerado!`;
                      } else if (table === 'estoque') {
                        title = '🧱 Atualização de Estoque!';
                        body = `Item "${r.nome || 'Material'}" atualizado.`;
                      }
                      if (typeof NotificationModule !== 'undefined') {
                        NotificationModule.show({ title, body, tag: `sync-${r.id}` });
                      }
                    });
                  }
                }

                localStorage.setItem(key, newStr);
                window.dispatchEvent(new CustomEvent('seven_data_updated', { detail: { table } }));
              }
            }
          } else {
            const err = await res.text();
            console.warn(`[Supabase] Erro ao buscar tabela ${table}:`, res.status, err);
          }
        } catch (fetchErr) {
          console.warn(`[Supabase] Falha de conexão ao sincronizar ${table}:`, fetchErr);
        }
      }));

      // Busca configurações da empresa
      if (!this.isLocalAction('config_main')) {
        const cfgRes = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/config?id=eq.main&select=*`, {
          headers: this.getHeaders()
        });
        if (cfgRes.ok) {
          const cfgRows = await cfgRes.json();
          if (Array.isArray(cfgRows) && cfgRows.length > 0 && !this.isLocalAction('config_main')) {
            const cfgStr = JSON.stringify(cfgRows[0]);
            const curCfgStr = localStorage.getItem(STORAGE_KEYS.CONFIG);
            if (curCfgStr !== cfgStr) {
              localStorage.setItem(STORAGE_KEYS.CONFIG, cfgStr);
              window.dispatchEvent(new CustomEvent('seven_data_updated', { detail: { table: 'config' } }));
              if (typeof App !== 'undefined' && App.loadConfigView) {
                App.loadConfigView();
              }
            }
          }
        }
      }

      // Busca configurações da calculadora 3D
      if (!this.isLocalAction('calc_3d_config_main')) {
        const calcCfgRes = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/calc_3d_config?id=eq.main_3d_calc&select=*`, {
          headers: this.getHeaders()
        });
        if (calcCfgRes.ok) {
          const calcCfgRows = await calcCfgRes.json();
          if (Array.isArray(calcCfgRows) && calcCfgRows.length > 0 && !this.isLocalAction('calc_3d_config_main')) {
            const calcCfgStr = JSON.stringify(calcCfgRows[0]);
            const curCalcCfgStr = localStorage.getItem(STORAGE_KEYS.CALC_3D_CONFIG);
            if (curCalcCfgStr !== calcCfgStr) {
              localStorage.setItem(STORAGE_KEYS.CALC_3D_CONFIG, calcCfgStr);
              window.dispatchEvent(new CustomEvent('seven_data_updated', { detail: { table: 'calc_3d_config' } }));
            }
          }
        }
      }

      this.isCloudConnected = true;
      this.updateSyncBadge('online', 'Tempo Real Ativo ⚡');
    } catch (err) {
      if (!isSilent) {
        console.warn('Aviso ao sincronizar com Supabase (usando cache local):', err);
        this.updateSyncBadge('offline', 'Cache Local');
      }
    }
  },

  get(table) {
    const key = STORAGE_KEYS[table.toUpperCase()];
    if (!key) return [];
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`Erro ao ler tabela ${table}:`, e);
      return [];
    }
  },

  set(table, items) {
    const key = STORAGE_KEYS[table.toUpperCase()];
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('seven_data_updated', { detail: { table } }));
  },

  insert(table, item) {
    const list = this.get(table);
    const newItem = {
      ...item,
      id: item.id || `${table.substring(0, 3)}-${Date.now()}`,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.recordLocalAction(newItem.id);
    list.unshift(newItem);
    this.set(table, list);

    // Sincroniza com Supabase em background
    this.updateSyncBadge('syncing', 'Salvando na nuvem...');
    fetch(`${SUPABASE_CONFIG.url}/rest/v1/${table}`, {
      method: 'POST',
      headers: this.getHeaders('resolution=merge-duplicates,return=representation'),
      body: JSON.stringify(newItem)
    })
      .then(async res => {
        if (res.ok) {
          this.updateSyncBadge('online', 'Tempo Real Ativo ⚡');
        } else {
          const errText = await res.text();
          console.error(`[Supabase] Erro ao inserir em ${table}:`, res.status, errText);
          this.updateSyncBadge('offline', 'Erro ao salvar');
        }
      })
      .catch(err => {
        console.error(`[Supabase] Erro de rede ao inserir em ${table}:`, err);
        this.updateSyncBadge('offline', 'Modo Offline');
      });

    return newItem;
  },

  update(table, id, updates) {
    const list = this.get(table);
    const index = list.findIndex(i => i.id === id);
    if (index === -1) return null;
    const updatedAt = new Date().toISOString();
    this.recordLocalAction(id);
    list[index] = {
      ...list[index],
      ...updates,
      updated_at: updatedAt
    };
    this.set(table, list);

    // Sincroniza com Supabase em background
    this.updateSyncBadge('syncing', 'Atualizando...');
    fetch(`${SUPABASE_CONFIG.url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...updates, updated_at: updatedAt })
    })
      .then(async res => {
        if (res.ok) {
          this.updateSyncBadge('online', 'Tempo Real Ativo ⚡');
        } else {
          const errText = await res.text();
          console.error(`[Supabase] Erro ao atualizar ${table}:`, res.status, errText);
          this.updateSyncBadge('offline', 'Erro ao atualizar');
        }
      })
      .catch(err => {
        console.error(`[Supabase] Erro de rede ao atualizar ${table}:`, err);
        this.updateSyncBadge('offline', 'Modo Offline');
      });

    return list[index];
  },

  delete(table, id) {
    this.recordLocalAction(id);
    const list = this.get(table);
    const filtered = list.filter(i => i.id !== id);
    this.set(table, filtered);

    // Remove no Supabase em background
    this.updateSyncBadge('syncing', 'Removendo...');
    fetch(`${SUPABASE_CONFIG.url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    })
      .then(async res => {
        if (res.ok) {
          this.updateSyncBadge('online', 'Tempo Real Ativo ⚡');
        } else {
          const errText = await res.text();
          console.error(`[Supabase] Erro ao remover de ${table}:`, res.status, errText);
          this.updateSyncBadge('offline', 'Erro ao remover');
        }
      })
      .catch(err => {
        console.error(`[Supabase] Erro de rede ao remover de ${table}:`, err);
        this.updateSyncBadge('offline', 'Modo Offline');
      });

    return true;
  },

  getConfig() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
      const parsed = data ? JSON.parse(data) : {};
      return {
        ...INITIAL_DATA.config,
        ...parsed,
        categorias_producao: Array.isArray(parsed.categorias_producao) && parsed.categorias_producao.length > 0
          ? parsed.categorias_producao
          : INITIAL_DATA.config.categorias_producao,
        categorias_despesa: Array.isArray(parsed.categorias_despesa) && parsed.categorias_despesa.length > 0
          ? parsed.categorias_despesa
          : INITIAL_DATA.config.categorias_despesa,
        formas_pagamento: Array.isArray(parsed.formas_pagamento) && parsed.formas_pagamento.length > 0
          ? parsed.formas_pagamento
          : INITIAL_DATA.config.formas_pagamento,
        marcas_filamento: Array.isArray(parsed.marcas_filamento) && parsed.marcas_filamento.length > 0
          ? parsed.marcas_filamento
          : INITIAL_DATA.config.marcas_filamento
      };
    } catch {
      return INITIAL_DATA.config;
    }
  },

  getCategoriasProducao() {
    return this.getConfig().categorias_producao || ['3D', 'Gravação laser', 'Corte laser', 'Corte e Gravação'];
  },

  addCategoriaProducao(nome) {
    const val = (nome || '').trim();
    if (!val) return;
    const cfg = this.getConfig();
    const lista = [...(cfg.categorias_producao || [])];
    if (!lista.some(c => c.toLowerCase() === val.toLowerCase())) {
      lista.push(val);
      this.saveConfig({ ...cfg, categorias_producao: lista });
    }
  },

  editCategoriaProducao(index, novoNome) {
    const val = (novoNome || '').trim();
    if (!val) return;
    const cfg = this.getConfig();
    const lista = [...(cfg.categorias_producao || [])];
    if (lista[index] !== undefined) {
      lista[index] = val;
      this.saveConfig({ ...cfg, categorias_producao: lista });
    }
  },

  removeCategoriaProducao(index) {
    const cfg = this.getConfig();
    const lista = [...(cfg.categorias_producao || [])];
    if (lista.length <= 1) {
      alert('É necessário manter pelo menos uma categoria no sistema.');
      return;
    }
    lista.splice(index, 1);
    this.saveConfig({ ...cfg, categorias_producao: lista });
  },

  getFormasPagamento() {
    return this.getConfig().formas_pagamento || ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Boleto', 'Dinheiro'];
  },

  addFormaPagamento(nome) {
    const val = (nome || '').trim();
    if (!val) return;
    const cfg = this.getConfig();
    const lista = [...(cfg.formas_pagamento || [])];
    if (!lista.some(c => c.toLowerCase() === val.toLowerCase())) {
      lista.push(val);
      this.saveConfig({ ...cfg, formas_pagamento: lista });
    }
  },

  removeFormaPagamento(index) {
    const cfg = this.getConfig();
    const lista = [...(cfg.formas_pagamento || [])];
    if (lista.length <= 1) return;
    lista.splice(index, 1);
    this.saveConfig({ ...cfg, formas_pagamento: lista });
  },

  /* --- CORES DISPONÍVEIS DE PERSONALIZAÇÃO --- */
  getCoresDisponiveis() {
    return this.getConfig().cores || [
      'Preto', 'Branco', 'Dourado', 'Prata', 'Vermelho', 'Azul', 'Verde',
      'Amarelo', 'Rosa', 'Laranja', 'Roxo', 'Cobre / Bronze', 'Madeira Natural', 'Transparente'
    ];
  },

  addCor(nome) {
    const val = (nome || '').trim();
    if (!val) return;
    const cfg = this.getConfig();
    const lista = [...(this.getCoresDisponiveis())];
    if (!lista.some(c => c.toLowerCase() === val.toLowerCase())) {
      lista.push(val);
      this.saveConfig({ ...cfg, cores: lista });
    }
  },

  editCor(index, novoNome) {
    const val = (novoNome || '').trim();
    if (!val) return;
    const cfg = this.getConfig();
    const lista = [...(this.getCoresDisponiveis())];
    if (lista[index] !== undefined) {
      lista[index] = val;
      this.saveConfig({ ...cfg, cores: lista });
    }
  },

  removeCor(index) {
    const cfg = this.getConfig();
    const lista = [...(this.getCoresDisponiveis())];
    if (lista.length <= 1) {
      alert('É necessário manter pelo menos uma cor cadastrada no sistema.');
      return;
    }
    lista.splice(index, 1);
    this.saveConfig({ ...cfg, cores: lista });
  },

  /* --- MARCAS DE FILAMENTO 3D --- */
  getMarcasFilamento() {
    return this.getConfig().marcas_filamento || [
      'Voolt3D', 'Creality', '3D Fila', 'eSun', 'Sunlu', 'Sethi3D', 'National 3D', 'PrintaLot'
    ];
  },

  addMarcaFilamento(nome) {
    const val = (nome || '').trim();
    if (!val) return;
    const cfg = this.getConfig();
    const lista = [...(this.getMarcasFilamento())];
    if (!lista.some(m => m.toLowerCase() === val.toLowerCase())) {
      lista.push(val);
      this.saveConfig({ ...cfg, marcas_filamento: lista });
    }
  },

  editMarcaFilamento(index, novoNome) {
    const val = (novoNome || '').trim();
    if (!val) return;
    const cfg = this.getConfig();
    const lista = [...(this.getMarcasFilamento())];
    if (lista[index] !== undefined) {
      lista[index] = val;
      this.saveConfig({ ...cfg, marcas_filamento: lista });
    }
  },

  removeMarcaFilamento(index) {
    const cfg = this.getConfig();
    const lista = [...(this.getMarcasFilamento())];
    if (lista.length <= 1) {
      alert('É necessário manter pelo menos uma marca de filamento cadastrada.');
      return;
    }
    lista.splice(index, 1);
    this.saveConfig({ ...cfg, marcas_filamento: lista });
  },

  /* --- PRODUTOS ESTABELECIDOS (APENAS NOMES / SEM PREÇOS) --- */
  getProdutosEstabelecidos() {
    const raw = this.getConfig().produtos_estabelecidos || [
      'Copo Térmico Inox', 'Taça de Gin Acrílica', 'Chaveiro MDF', 'Troféu Acrílico',
      'Quadro MDF Vazado', 'Peça Impressa 3D', 'Luminária LED Acrílico', 'Caneca Personalizada'
    ];
    return raw.map(it => (typeof it === 'object' && it?.nome ? it.nome : String(it)));
  },

  addProdutoEstabelecido(nome) {
    const val = (nome || '').trim();
    if (!val) return;
    const cfg = this.getConfig();
    const lista = [...(this.getProdutosEstabelecidos())];
    if (!lista.some(p => p.toLowerCase() === val.toLowerCase())) {
      lista.push(val);
      this.saveConfig({ ...cfg, produtos_estabelecidos: lista });
    }
  },

  editProdutoEstabelecido(index, novoNome) {
    const val = (novoNome || '').trim();
    if (!val) return;
    const cfg = this.getConfig();
    const lista = [...(this.getProdutosEstabelecidos())];
    if (lista[index] !== undefined) {
      lista[index] = val;
      this.saveConfig({ ...cfg, produtos_estabelecidos: lista });
    }
  },

  removeProdutoEstabelecido(index) {
    const cfg = this.getConfig();
    const lista = [...(this.getProdutosEstabelecidos())];
    if (lista.length <= 1) {
      alert('É necessário manter pelo menos um produto cadastrado.');
      return;
    }
    lista.splice(index, 1);
    this.saveConfig({ ...cfg, produtos_estabelecidos: lista });
  },

  saveConfig(newConfig) {
    const payload = {
      id: 'main',
      ...newConfig,
      updated_at: new Date().toISOString()
    };
    this.recordLocalAction('config_main');
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('seven_data_updated', { detail: { table: 'config' } }));

    this.updateSyncBadge('syncing', 'Salvando config...');
    fetch(`${SUPABASE_CONFIG.url}/rest/v1/config`, {
      method: 'POST',
      headers: this.getHeaders('resolution=merge-duplicates,return=representation'),
      body: JSON.stringify(payload)
    })
      .then(async res => {
        if (res.ok) {
          this.updateSyncBadge('online', 'Tempo Real Ativo ⚡');
        } else {
          const errText = await res.text();
          console.error('[Supabase] Erro ao salvar config:', res.status, errText);
          this.updateSyncBadge('offline', 'Erro ao salvar');
        }
      })
      .catch(err => {
        console.error('[Supabase] Erro de rede ao salvar config:', err);
        this.updateSyncBadge('offline', 'Modo Offline');
      });
  },

  getCalc3DConfig() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CALC_3D_CONFIG);
      return data ? JSON.parse(data) : INITIAL_DATA.calc_3d_config;
    } catch {
      return INITIAL_DATA.calc_3d_config;
    }
  },

  saveCalc3DConfig(cfg) {
    const payload = {
      id: 'main_3d_calc',
      ...cfg,
      updated_at: new Date().toISOString()
    };
    this.recordLocalAction('calc_3d_config_main');
    localStorage.setItem(STORAGE_KEYS.CALC_3D_CONFIG, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('seven_data_updated', { detail: { table: 'calc_3d_config' } }));

    // Sincroniza com Supabase
    fetch(`${SUPABASE_CONFIG.url}/rest/v1/calc_3d_config`, {
      method: 'POST',
      headers: this.getHeaders('resolution=merge-duplicates,return=representation'),
      body: JSON.stringify(payload)
    })
      .then(async res => {
        if (!res.ok) {
          const errText = await res.text();
          console.error('[Supabase] Erro ao salvar calc_3d_config:', res.status, errText);
        }
      })
      .catch(err => console.error('[Supabase] Erro ao salvar calc_3d_config:', err));

    return payload;
  },

  getCalcLaserConfig() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CALC_LASER_CONFIG);
      return data ? JSON.parse(data) : INITIAL_DATA.calc_laser_config;
    } catch {
      return INITIAL_DATA.calc_laser_config;
    }
  },

  saveCalcLaserConfig(cfg) {
    const payload = {
      id: 'main_laser_calc',
      ...cfg,
      updated_at: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.CALC_LASER_CONFIG, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('seven_data_updated', { detail: { table: 'calc_laser_config' } }));
    return payload;
  },

  getCalcLaserHistorico() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CALC_LASER_HISTORICO);
      return data ? JSON.parse(data) : INITIAL_DATA.calc_laser_historico;
    } catch {
      return INITIAL_DATA.calc_laser_historico;
    }
  },

  saveCalcLaserHistoricoItem(item) {
    const list = this.getCalcLaserHistorico();
    list.unshift(item);
    localStorage.setItem(STORAGE_KEYS.CALC_LASER_HISTORICO, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('seven_data_updated', { detail: { table: 'calc_laser_historico' } }));
    return list;
  },

  deleteCalcLaserHistoricoItem(id) {
    let list = this.getCalcLaserHistorico();
    list = list.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.CALC_LASER_HISTORICO, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('seven_data_updated', { detail: { table: 'calc_laser_historico' } }));
    return list;
  },

  /* --- CONFIGURAÇÕES DO FINANCEIRO (PROPRIETÁRIOS, CATEGORIAS, CENTROS DE CUSTO, LOCAIS) --- */
  getProprietarios() {
    const raw = this.getConfig().proprietarios;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    return ['Proprietário 1', 'Proprietário 2'];
  },

  getActiveProprietario() {
    const salvo = localStorage.getItem('seven_active_proprietario');
    if (salvo) return salvo;
    const lista = this.getProprietarios();
    return lista[0] || 'Proprietário 1';
  },

  setActiveProprietario(nome) {
    if (!nome) return;
    localStorage.setItem('seven_active_proprietario', nome);
    window.dispatchEvent(new CustomEvent('seven_proprietario_changed', { detail: { nome } }));
  },

  addProprietario(nome) {
    const val = (nome || '').trim();
    if (!val) return;
    const cfg = this.getConfig();
    const lista = [...(this.getProprietarios())];
    if (!lista.some(p => p.toLowerCase() === val.toLowerCase())) {
      lista.push(val);
      this.saveConfig({ ...cfg, proprietarios: lista });
    }
  },

  editProprietario(index, novoNome) {
    const val = (novoNome || '').trim();
    if (!val) return;
    const cfg = this.getConfig();
    const lista = [...(this.getProprietarios())];
    if (lista[index] !== undefined) {
      lista[index] = val;
      this.saveConfig({ ...cfg, proprietarios: lista });
    }
  },

  removeProprietario(index) {
    const cfg = this.getConfig();
    const lista = [...(this.getProprietarios())];
    if (lista.length <= 1) {
      alert('É necessário manter pelo menos um proprietário cadastrado.');
      return;
    }
    lista.splice(index, 1);
    this.saveConfig({ ...cfg, proprietarios: lista });
  },

  getCentrosCusto() {
    const raw = this.getConfig().centros_custo;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    return ['Oficina / Produção Laser', 'Produção 3D', 'Balcão / Loja Física', 'Administrativo & Vendas', 'Geral'];
  },

  addCentroCusto(nome) {
    const val = (nome || '').trim();
    if (!val) return;
    const cfg = this.getConfig();
    const lista = [...(this.getCentrosCusto())];
    if (!lista.some(c => c.toLowerCase() === val.toLowerCase())) {
      lista.push(val);
      this.saveConfig({ ...cfg, centros_custo: lista });
    }
  },

  removeCentroCusto(index) {
    const cfg = this.getConfig();
    const lista = [...(this.getCentrosCusto())];
    if (lista.length <= 1) return;
    lista.splice(index, 1);
    this.saveConfig({ ...cfg, centros_custo: lista });
  },

  getLocaisPagamento() {
    const raw = this.getConfig().locais_pagamento;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    return ['Banco Inter', 'Nubank', 'Caixa Físico', 'Mercado Pago', 'Cofre'];
  },

  addLocalPagamento(nome) {
    const val = (nome || '').trim();
    if (!val) return;
    const cfg = this.getConfig();
    const lista = [...(this.getLocaisPagamento())];
    if (!lista.some(l => l.toLowerCase() === val.toLowerCase())) {
      lista.push(val);
      this.saveConfig({ ...cfg, locais_pagamento: lista });
    }
  },

  removeLocalPagamento(index) {
    const cfg = this.getConfig();
    const lista = [...(this.getLocaisPagamento())];
    if (lista.length <= 1) return;
    lista.splice(index, 1);
    this.saveConfig({ ...cfg, locais_pagamento: lista });
  },

  getCategoriasReceita() {
    const raw = this.getConfig().categorias_receita;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    return ['Venda de Personalizados', 'Gravação Laser', 'Impressão 3D', 'Brindes Corporativos', 'Serviço de Design', 'Outras Receitas'];
  },

  addCategoriaReceita(nome) {
    const val = (nome || '').trim();
    if (!val) return;
    const cfg = this.getConfig();
    const lista = [...(this.getCategoriasReceita())];
    if (!lista.some(c => c.toLowerCase() === val.toLowerCase())) {
      lista.push(val);
      this.saveConfig({ ...cfg, categorias_receita: lista });
    }
  },

  removeCategoriaReceita(index) {
    const cfg = this.getConfig();
    const lista = [...(this.getCategoriasReceita())];
    if (lista.length <= 1) return;
    lista.splice(index, 1);
    this.saveConfig({ ...cfg, categorias_receita: lista });
  },

  getCategoriasDespesa() {
    const raw = this.getConfig().categorias_despesa;
    if (Array.isArray(raw) && raw.length > 0) return raw;
    return ['Matéria-Prima', 'Insumos 3D', 'Manutenção Máquinas', 'Custos Fixos (Luz/Água/Aluguel)', 'Embalagens & Envios', 'Marketing & Anúncios', 'Pró-Labore / Sócios', 'Impostos & Taxas', 'Outros'];
  },

  addCategoriaDespesa(nome) {
    const val = (nome || '').trim();
    if (!val) return;
    const cfg = this.getConfig();
    const lista = [...(this.getCategoriasDespesa())];
    if (!lista.some(c => c.toLowerCase() === val.toLowerCase())) {
      lista.push(val);
      this.saveConfig({ ...cfg, categorias_despesa: lista });
    }
  },

  removeCategoriaDespesa(index) {
    const cfg = this.getConfig();
    const lista = [...(this.getCategoriasDespesa())];
    if (lista.length <= 1) return;
    lista.splice(index, 1);
    this.saveConfig({ ...cfg, categorias_despesa: lista });
  }
};

// Inicializa automaticamente
StorageService.init();
