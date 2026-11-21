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
  FINANCEIRO_AUDITORIA: 'seven_financeiro_auditoria_v1',
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
    proprietarios: ['Raphael', 'Yanka'],
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
    ],
    padroes_orcamento_pedido: {
      orcamento_titulo: 'Orçamento de Produtos Personalizados Exclusivos',
      orcamento_escopo: 'Fabricação e personalização a laser / 3D de peças conforme especificações do cliente com garantia de acabamento fino.',
      orcamento_metodo: '1. Envio e aprovação de maquete digital 3D\n2. Fabricação com controle milimétrico de corte e gravação\n3. Limpeza, acabamento artesanal e controle de qualidade\n4. Embalagem reforçada e pronta para entrega',
      orcamento_prazo: '5 a 7 dias úteis após aprovação da arte final',
      orcamento_condicoes: '50% de sinal no pedido e 50% na conclusão da produção via Pix.',
      pedido_dias_entrega: 5,
      pedido_forma_pagto: 'Pix',
      pedido_obs: ''
    }
  },
  crm_cards: [],
  estoque: [],
  encomendas: [],
  despesas: [],
  financeiro_lancamentos: [],
  financeiro_auditoria: [],
  propostas: [],
  filamentos: [],
  calc_3d_config: {
    id: 'main_3d_calc',
    tarifa_kwh: 0.85,
    potencia_impressora_w: 200,
    custo_operacional_hora: 3.50,
    margem_lucro_padrao: 100
  },
  calc_3d_historico: [],
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
  calc_laser_historico: []
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
    const tables = ['crm_cards', 'encomendas', 'estoque', 'despesas', 'propostas', 'filamentos', 'calc_3d_historico', 'calc_laser_historico', 'financeiro_lancamentos', 'financeiro_auditoria'];

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

              // Nuvem é a fonte de verdade: mesmo quando retornar 0 registros (tudo apagado),
              // respeita o banco e preserva apenas itens recém-inseridos localmente nos últimos 20s.
              const pendingLocal = currentItems.filter(item => !cloudIds.has(item.id) && this.isLocalAction(item.id));
              const merged = [...pendingLocal, ...rows];

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

      // Busca configurações da calculadora Laser
      if (!this.isLocalAction('calc_laser_config_main')) {
        const laserCfgRes = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/calc_laser_config?id=eq.main_laser_calc&select=*`, {
          headers: this.getHeaders()
        });
        if (laserCfgRes.ok) {
          const laserCfgRows = await laserCfgRes.json();
          if (Array.isArray(laserCfgRows) && laserCfgRows.length > 0 && !this.isLocalAction('calc_laser_config_main')) {
            const laserCfgStr = JSON.stringify(laserCfgRows[0]);
            const curLaserCfgStr = localStorage.getItem(STORAGE_KEYS.CALC_LASER_CONFIG);
            if (curLaserCfgStr !== laserCfgStr) {
              localStorage.setItem(STORAGE_KEYS.CALC_LASER_CONFIG, laserCfgStr);
              window.dispatchEvent(new CustomEvent('seven_data_updated', { detail: { table: 'calc_laser_config' } }));
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

  sortLista(arr) {
    return [...(arr || [])].sort((a, b) =>
      String(a || '').localeCompare(String(b || ''), 'pt-BR', { sensitivity: 'base', numeric: true })
    );
  },

  getCategoriasProducao() {
    return this.sortLista(this.getConfig().categorias_producao || ['3D', 'Gravação laser', 'Corte laser', 'Corte e Gravação']);
  },

  addCategoriaProducao(nome) {
    const val = (nome || '').trim();
    if (!val) return;
    const cfg = this.getConfig();
    const lista = [...this.getCategoriasProducao()];
    if (!lista.some(c => c.toLowerCase() === val.toLowerCase())) {
      lista.push(val);
      this.saveConfig({ ...cfg, categorias_producao: this.sortLista(lista) });
    }
  },

  editCategoriaProducao(index, novoNome) {
    const val = (novoNome || '').trim();
    if (!val) return;
    const cfg = this.getConfig();
    const lista = [...this.getCategoriasProducao()];
    if (lista[index] !== undefined) {
      lista[index] = val;
      this.saveConfig({ ...cfg, categorias_producao: this.sortLista(lista) });
    }
  },

  removeCategoriaProducao(index) {
    const cfg = this.getConfig();
    const lista = [...this.getCategoriasProducao()];
    if (lista.length <= 1) {
      alert('É necessário manter pelo menos uma categoria no sistema.');
      return;
    }
    lista.splice(index, 1);
    this.saveConfig({ ...cfg, categorias_producao: this.sortLista(lista) });
  },

  getFormasPagamento() {
    return this.sortLista(this.getConfig().formas_pagamento || ['Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Boleto', 'Dinheiro']);
  },

  addFormaPagamento(nome) {
    const val = (nome || '').trim();
    if (!val) return;
    const cfg = this.getConfig();
    const lista = [...this.getFormasPagamento()];
    if (!lista.some(c => c.toLowerCase() === val.toLowerCase())) {
      lista.push(val);
      this.saveConfig({ ...cfg, formas_pagamento: this.sortLista(lista) });
    }
  },

  removeFormaPagamento(index) {
    const cfg = this.getConfig();
    const lista = [...this.getFormasPagamento()];
    if (lista.length <= 1) return;
    lista.splice(index, 1);
    this.saveConfig({ ...cfg, formas_pagamento: this.sortLista(lista) });
  },

  /* --- CORES DISPONÍVEIS DE PERSONALIZAÇÃO --- */
  getCoresDisponiveis() {
    return this.sortLista(this.getConfig().cores || [
      'Preto', 'Branco', 'Dourado', 'Prata', 'Vermelho', 'Azul', 'Verde',
      'Amarelo', 'Rosa', 'Laranja', 'Roxo', 'Cobre / Bronze', 'Madeira Natural', 'Transparente'
    ]);
  },

  addCor(nome) {
    const val = (nome || '').trim();
    if (!val) return;
    const cfg = this.getConfig();
    const lista = [...(this.getCoresDisponiveis())];
    if (!lista.some(c => c.toLowerCase() === val.toLowerCase())) {
      lista.push(val);
      this.saveConfig({ ...cfg, cores: this.sortLista(lista) });
    }
  },

  editCor(index, novoNome) {
    const val = (novoNome || '').trim();
    if (!val) return;
    const cfg = this.getConfig();
    const lista = [...(this.getCoresDisponiveis())];
    if (lista[index] !== undefined) {
      lista[index] = val;
      this.saveConfig({ ...cfg, cores: this.sortLista(lista) });
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
    this.saveConfig({ ...cfg, cores: this.sortLista(lista) });
  },

  /* --- MARCAS DE FILAMENTO 3D --- */
  getMarcasFilamento() {
    return this.sortLista(this.getConfig().marcas_filamento || [
      'Voolt3D', 'Creality', '3D Fila', 'eSun', 'Sunlu', 'Sethi3D', 'National 3D', 'PrintaLot'
    ]);
  },

  addMarcaFilamento(nome) {
    const val = (nome || '').trim();
    if (!val) return;
    const cfg = this.getConfig();
    const lista = [...(this.getMarcasFilamento())];
    if (!lista.some(m => m.toLowerCase() === val.toLowerCase())) {
      lista.push(val);
      this.saveConfig({ ...cfg, marcas_filamento: this.sortLista(lista) });
    }
  },

  editMarcaFilamento(index, novoNome) {
    const val = (novoNome || '').trim();
    if (!val) return;
    const cfg = this.getConfig();
    const lista = [...(this.getMarcasFilamento())];
    if (lista[index] !== undefined) {
      lista[index] = val;
      this.saveConfig({ ...cfg, marcas_filamento: this.sortLista(lista) });
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
    this.saveConfig({ ...cfg, marcas_filamento: this.sortLista(lista) });
  },

  /* --- PRODUTOS ESTABELECIDOS (APENAS NOMES / SEM PREÇOS) --- */
  getProdutosEstabelecidos() {
    const raw = this.getConfig().produtos_estabelecidos || [
      'Copo Térmico Inox', 'Taça de Gin Acrílica', 'Chaveiro MDF', 'Troféu Acrílico',
      'Quadro MDF Vazado', 'Peça Impressa 3D', 'Luminária LED Acrílico', 'Caneca Personalizada'
    ];
    return this.sortLista(raw.map(it => (typeof it === 'object' && it?.nome ? it.nome : String(it))));
  },

  addProdutoEstabelecido(nome) {
    const val = (nome || '').trim();
    if (!val) return;
    const cfg = this.getConfig();
    const lista = [...(this.getProdutosEstabelecidos())];
    if (!lista.some(p => p.toLowerCase() === val.toLowerCase())) {
      lista.push(val);
      this.saveConfig({ ...cfg, produtos_estabelecidos: this.sortLista(lista) });
    }
  },

  editProdutoEstabelecido(index, novoNome) {
    const val = (novoNome || '').trim();
    if (!val) return;
    const cfg = this.getConfig();
    const lista = [...(this.getProdutosEstabelecidos())];
    if (lista[index] !== undefined) {
      lista[index] = val;
      this.saveConfig({ ...cfg, produtos_estabelecidos: this.sortLista(lista) });
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
    this.saveConfig({ ...cfg, produtos_estabelecidos: this.sortLista(lista) });
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
      valor_hora_laser: Number(cfg.valor_hora_laser) || 30.00,
      margem_padrao: Number(cfg.margem_padrao) || 100,
      chapas: Array.isArray(cfg.chapas) ? cfg.chapas : [],
      parametros_rotativo: Array.isArray(cfg.parametros_rotativo)
        ? cfg.parametros_rotativo
        : this.getParametrosLaserRotativo(),
      updated_at: new Date().toISOString()
    };
    this.recordLocalAction('calc_laser_config_main');
    localStorage.setItem(STORAGE_KEYS.CALC_LASER_CONFIG, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('seven_data_updated', { detail: { table: 'calc_laser_config' } }));

    // Sincroniza com Supabase
    fetch(`${SUPABASE_CONFIG.url}/rest/v1/calc_laser_config`, {
      method: 'POST',
      headers: this.getHeaders('resolution=merge-duplicates,return=representation'),
      body: JSON.stringify(payload)
    })
      .then(async res => {
        if (!res.ok) {
          const errText = await res.text();
          console.error('[Supabase] Erro ao salvar calc_laser_config:', res.status, errText);
        }
      })
      .catch(err => console.error('[Supabase] Erro de rede ao salvar calc_laser_config:', err));

    return payload;
  },

  getDefaultParametrosLaserRotativo() {
    return [
      { id: 'rot-padrao', item: 'PADRÃO', parametro: '$101=80', diametro_cm: '', circunferencia_cm: '', obs: 'Configuração normal da mesa (sem rotativo)', destaque: true },
      { id: 'rot-1', item: 'Garrafa ACBCSJ', parametro: '$101=101', diametro_cm: '7', circunferencia_cm: '23', obs: '', destaque: false },
      { id: 'rot-2', item: 'COPO CUIA', parametro: '$101=103.5', diametro_cm: '8.8', circunferencia_cm: '28', obs: '', destaque: false },
      { id: 'rot-3', item: 'Garrafa 1200', parametro: '$101=132', diametro_cm: '9.1', circunferencia_cm: '28.5', obs: '', destaque: false },
      { id: 'rot-4', item: 'GARRAFA 800', parametro: '$101=133', diametro_cm: '7.9', circunferencia_cm: '24.8', obs: '', destaque: false },
      { id: 'rot-5', item: 'Copo Stanley com abridor', parametro: '$101=132', diametro_cm: '9', circunferencia_cm: '28.5', obs: '', destaque: false },
      { id: 'rot-6', item: 'Garrafa Schmit 1500', parametro: '$101=136', diametro_cm: '9.5', circunferencia_cm: '30.1', obs: '', destaque: false },
      { id: 'rot-7', item: 'Garrafa MOR', parametro: '$101=103', diametro_cm: '7.5', circunferencia_cm: '23.5', obs: '', destaque: false },
      { id: 'rot-8', item: 'Garrafa Leo', parametro: '$101=104', diametro_cm: '6.7', circunferencia_cm: '20.9', obs: '', destaque: false },
      { id: 'rot-9', item: 'Garrafa 1 L', parametro: '$101=132', diametro_cm: '9.1', circunferencia_cm: '28.5', obs: '', destaque: false },
      { id: 'rot-10', item: 'Copo tipo Stanley Seven', parametro: '', diametro_cm: '', circunferencia_cm: '27.8', obs: '', destaque: false }
    ];
  },

  getParametrosLaserRotativo() {
    const cfg = this.getCalcLaserConfig();
    if (Array.isArray(cfg.parametros_rotativo) && cfg.parametros_rotativo.length > 0) {
      return cfg.parametros_rotativo;
    }
    return this.getDefaultParametrosLaserRotativo();
  },

  saveParametrosLaserRotativo(lista) {
    const cfg = this.getCalcLaserConfig();
    return this.saveCalcLaserConfig({
      ...cfg,
      parametros_rotativo: lista
    });
  },

  getCalcLaserHistorico() {
    return this.get('calc_laser_historico');
  },

  saveCalcLaserHistoricoItem(item) {
    return this.insert('calc_laser_historico', item);
  },

  deleteCalcLaserHistoricoItem(id) {
    return this.delete('calc_laser_historico', id);
  },

  /* --- CONFIGURAÇÕES DO FINANCEIRO (PROPRIETÁRIOS, CATEGORIAS, CENTROS DE CUSTO, LOCAIS) --- */
  getProprietarios() {
    const raw = this.getConfig().proprietarios;
    if (Array.isArray(raw) && raw.length > 0) return this.sortLista(raw);
    return this.sortLista(['Raphael', 'Yanka']);
  },

  getActiveProprietario() {
    if (typeof AuthModule !== 'undefined' && AuthModule.getCurrentUser) {
      const user = AuthModule.getCurrentUser();
      if (user && user.nome) return user.nome;
    }
    const salvo = localStorage.getItem('seven_active_proprietario');
    if (salvo) return salvo;
    const lista = this.getProprietarios();
    return lista[0] || 'Raphael';
  },

  setActiveProprietario(nome) {
    if (!nome) return;
    localStorage.setItem('seven_active_proprietario', nome);
    window.dispatchEvent(new CustomEvent('seven_proprietario_changed', { detail: { nome } }));
  },

  logFinanceiroAuditoria({ acao, lancamento_id = null, descricao = '', valor = 0, detalhes = '' }) {
    const user = (typeof AuthModule !== 'undefined' && AuthModule.getCurrentUser) ? AuthModule.getCurrentUser() : null;
    const entry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      data_hora: new Date().toISOString(),
      usuario_nome: user?.nome || this.getActiveProprietario() || 'Raphael',
      usuario_email: user?.email || '',
      acao: acao || 'Alteração',
      lancamento_id: lancamento_id || null,
      descricao: descricao || '',
      valor: Number(valor) || 0,
      detalhes: detalhes || ''
    };
    return this.insert('financeiro_auditoria', entry);
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
    if (Array.isArray(raw) && raw.length > 0) return this.sortLista(raw);
    return this.sortLista(['Oficina / Produção Laser', 'Produção 3D', 'Balcão / Loja Física', 'Administrativo & Vendas', 'Geral']);
  },

  addCentroCusto(nome) {
    const val = (nome || '').trim();
    if (!val) return;
    const cfg = this.getConfig();
    const lista = [...(this.getCentrosCusto())];
    if (!lista.some(c => c.toLowerCase() === val.toLowerCase())) {
      lista.push(val);
      this.saveConfig({ ...cfg, centros_custo: this.sortLista(lista) });
    }
  },

  removeCentroCusto(index) {
    const cfg = this.getConfig();
    const lista = [...(this.getCentrosCusto())];
    if (lista.length <= 1) return;
    lista.splice(index, 1);
    this.saveConfig({ ...cfg, centros_custo: this.sortLista(lista) });
  },

  getLocaisPagamento() {
    const raw = this.getConfig().locais_pagamento;
    if (Array.isArray(raw) && raw.length > 0) return this.sortLista(raw);
    return this.sortLista(['Banco Inter', 'Nubank', 'Caixa Físico', 'Mercado Pago', 'Cofre']);
  },

  addLocalPagamento(nome) {
    const val = (nome || '').trim();
    if (!val) return;
    const cfg = this.getConfig();
    const lista = [...(this.getLocaisPagamento())];
    if (!lista.some(l => l.toLowerCase() === val.toLowerCase())) {
      lista.push(val);
      this.saveConfig({ ...cfg, locais_pagamento: this.sortLista(lista) });
    }
  },

  removeLocalPagamento(index) {
    const cfg = this.getConfig();
    const lista = [...(this.getLocaisPagamento())];
    if (lista.length <= 1) return;
    lista.splice(index, 1);
    this.saveConfig({ ...cfg, locais_pagamento: this.sortLista(lista) });
  },

  getCategoriasReceita() {
    const raw = this.getConfig().categorias_receita;
    if (Array.isArray(raw) && raw.length > 0) return this.sortLista(raw);
    return this.sortLista(['Venda de Personalizados', 'Gravação Laser', 'Impressão 3D', 'Brindes Corporativos', 'Serviço de Design', 'Outras Receitas']);
  },

  addCategoriaReceita(nome) {
    const val = (nome || '').trim();
    if (!val) return;
    const cfg = this.getConfig();
    const lista = [...(this.getCategoriasReceita())];
    if (!lista.some(c => c.toLowerCase() === val.toLowerCase())) {
      lista.push(val);
      this.saveConfig({ ...cfg, categorias_receita: this.sortLista(lista) });
    }
  },

  removeCategoriaReceita(index) {
    const cfg = this.getConfig();
    const lista = [...(this.getCategoriasReceita())];
    if (lista.length <= 1) return;
    lista.splice(index, 1);
    this.saveConfig({ ...cfg, categorias_receita: this.sortLista(lista) });
  },

  getCategoriasDespesa() {
    const raw = this.getConfig().categorias_despesa;
    if (Array.isArray(raw) && raw.length > 0) return this.sortLista(raw);
    return this.sortLista(['Matéria-Prima', 'Insumos 3D', 'Manutenção Máquinas', 'Custos Fixos (Luz/Água/Aluguel)', 'Embalagens & Envios', 'Marketing & Anúncios', 'Pró-Labore / Sócios', 'Impostos & Taxas', 'Outros']);
  },

  addCategoriaDespesa(nome) {
    const val = (nome || '').trim();
    if (!val) return;
    const cfg = this.getConfig();
    const lista = [...(this.getCategoriasDespesa())];
    if (!lista.some(c => c.toLowerCase() === val.toLowerCase())) {
      lista.push(val);
      this.saveConfig({ ...cfg, categorias_despesa: this.sortLista(lista) });
    }
  },

  removeCategoriaDespesa(index) {
    const cfg = this.getConfig();
    const lista = [...(this.getCategoriasDespesa())];
    if (lista.length <= 1) return;
    lista.splice(index, 1);
    this.saveConfig({ ...cfg, categorias_despesa: this.sortLista(lista) });
  },

  /* --- PADRÕES DE ORÇAMENTOS & PEDIDOS --- */
  getPadroesOrcamentoPedido() {
    const defaults = INITIAL_DATA.config.padroes_orcamento_pedido;
    const saved = this.getConfig().padroes_orcamento_pedido;
    if (saved && typeof saved === 'object') {
      return {
        ...defaults,
        ...saved
      };
    }
    return { ...defaults };
  },

  savePadroesOrcamentoPedido(padroes) {
    const cfg = this.getConfig();
    const merged = {
      ...this.getPadroesOrcamentoPedido(),
      ...padroes
    };
    this.saveConfig({ ...cfg, padroes_orcamento_pedido: merged });
    return merged;
  }
};

// Inicializa automaticamente
StorageService.init();
