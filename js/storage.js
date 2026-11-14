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
    endereco: 'Rua das Indústrias Criativas, 77 — SP'
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
      categoria: 'Impressão 3D',
      unidade: 'kg',
      quantidade_atual: 1.2,
      estoque_minimo: 3.0,
      custo_unitario: 110.00,
      preco_venda: 220.00,
      ativo: true
    },
    {
      id: 'est-2',
      nome: 'Chapa MDF Cru 3mm (60x40cm)',
      categoria: 'Corte a Laser',
      unidade: 'un',
      quantidade_atual: 8,
      estoque_minimo: 20,
      custo_unitario: 7.50,
      preco_venda: 25.00,
      ativo: true
    },
    {
      id: 'est-3',
      nome: 'Copo Térmico Inox 473ml (Tipo Stanley)',
      categoria: 'Brindes',
      unidade: 'un',
      quantidade_atual: 35,
      estoque_minimo: 15,
      custo_unitario: 24.00,
      preco_venda: 65.00,
      ativo: true
    },
    {
      id: 'est-4',
      nome: 'Chapa Acrílico Cristal 2mm (50x50cm)',
      categoria: 'Corte a Laser',
      unidade: 'un',
      quantidade_atual: 4,
      estoque_minimo: 10,
      custo_unitario: 28.00,
      preco_venda: 75.00,
      ativo: true
    },
    {
      id: 'est-5',
      nome: 'Caixa de Envio Kraft Reforçada',
      categoria: 'Embalagem',
      unidade: 'un',
      quantidade_atual: 60,
      estoque_minimo: 30,
      custo_unitario: 2.20,
      preco_venda: 5.00,
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
    // Limpa ações antigas após 12 segundos
    setTimeout(() => {
      this.recentLocalActions.delete(id);
    }, 12000);
  },

  isLocalAction(id) {
    if (!id) return false;
    const time = this.recentLocalActions.get(id);
    if (!time) return false;
    return (Date.now() - time) < 12000;
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
      const channel = this.supabaseClient.channel('seven-realtime-master');

      const tables = ['encomendas', 'crm_cards', 'estoque', 'despesas', 'propostas'];
      tables.forEach(table => {
        channel.on('postgres_changes', { event: '*', schema: 'public', table: table }, (payload) => {
          console.log(`⚡ [Realtime Supabase] Alteração detectada em ${table}:`, payload);
          this.handleRealtimeEvent(table, payload);
        });
      });

      channel.subscribe((status) => {
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

  handleRealtimeEvent(table, payload) {
    const { eventType, new: newRecord, old: oldRecord } = payload;
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
            body = `Pedido de ${newRecord.cliente_nome || 'Cliente'} adicionado ao sistema!`;
          } else if (table === 'crm_cards') {
            title = '💬 Novo Lead no Funil!';
            body = `${newRecord.lead_name || 'Lead'} entrou no CRM.`;
          } else if (table === 'propostas') {
            title = '📄 Nova Proposta Comercial!';
            body = `Orçamento para ${newRecord.cliente_nome || 'Cliente'} gerado.`;
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
          body = `Pedido #${newRecord.id.substring(newRecord.id.length - 5)} (${newRecord.cliente_nome}) agora está: "${newRecord.status}" (${newRecord.pagamento_status})!`;
        } else if (table === 'crm_cards') {
          title = '💬 Lead Atualizado no CRM!';
          body = `${newRecord.lead_name} avançou para etapa: ${newRecord.stage}!`;
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
    const tables = ['crm_cards', 'encomendas', 'estoque', 'despesas', 'propostas'];

    try {
      await Promise.all(tables.map(async (table) => {
        const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/${table}?select=*&order=created_at.desc`, {
          headers: this.getHeaders()
        });
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows)) {
            const key = STORAGE_KEYS[table.toUpperCase()];
            const prevStr = localStorage.getItem(key) || '[]';
            const newStr = JSON.stringify(rows);
            if (prevStr !== newStr) {
              localStorage.setItem(key, newStr);
              window.dispatchEvent(new CustomEvent('seven_data_updated', { detail: { table } }));
            }
          }
        }
      }));

      // Busca configurações da empresa
      const cfgRes = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/config?id=eq.main&select=*`, {
        headers: this.getHeaders()
      });
      if (cfgRes.ok) {
        const cfgRows = await cfgRes.json();
        if (Array.isArray(cfgRows) && cfgRows.length > 0) {
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
      .then(res => {
        if (res.ok) this.updateSyncBadge('online', 'Tempo Real Ativo ⚡');
        else this.updateSyncBadge('offline', 'Erro ao salvar');
      })
      .catch(() => this.updateSyncBadge('offline', 'Modo Offline'));

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
      .then(res => {
        if (res.ok) this.updateSyncBadge('online', 'Tempo Real Ativo ⚡');
        else this.updateSyncBadge('offline', 'Erro ao atualizar');
      })
      .catch(() => this.updateSyncBadge('offline', 'Modo Offline'));

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
      .then(res => {
        if (res.ok) this.updateSyncBadge('online', 'Tempo Real Ativo ⚡');
        else this.updateSyncBadge('offline', 'Erro ao remover');
      })
      .catch(() => this.updateSyncBadge('offline', 'Modo Offline'));

    return true;
  },

  getConfig() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
      return data ? JSON.parse(data) : INITIAL_DATA.config;
    } catch {
      return INITIAL_DATA.config;
    }
  },

  saveConfig(newConfig) {
    const payload = {
      id: 'main',
      ...newConfig,
      updated_at: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('seven_data_updated', { detail: { table: 'config' } }));

    this.updateSyncBadge('syncing', 'Salvando config...');
    fetch(`${SUPABASE_CONFIG.url}/rest/v1/config`, {
      method: 'POST',
      headers: this.getHeaders('resolution=merge-duplicates,return=representation'),
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (res.ok) this.updateSyncBadge('online', 'Supabase Cloud Ativo');
        else this.updateSyncBadge('offline', 'Erro ao salvar');
      })
      .catch(() => this.updateSyncBadge('offline', 'Modo Offline'));
  }
};

// Inicializa automaticamente
StorageService.init();
