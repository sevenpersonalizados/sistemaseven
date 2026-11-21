/**
 * SEVEN PERSONALIZADOS — MÓDULO FINANCEIRO UNIFICADO & FLUXO DE CAIXA EXECUTIVO
 * Gestão completa em tela única:
 * - Indicadores em tempo real (Saldo Disponível, Receitas, Despesas, Resultado, A Pagar, A Receber)
 * - Lançamentos com categorias, centros de custo, locais de pagamento e auditoria por proprietário
 * - Gestão de Contas a Pagar e Contas a Receber (pendentes, vencidos e liquidados)
 * - Fluxo de Caixa interativo com gráficos Mensal e Anual
 * - Parcelamentos automáticos e Despesas Recorrentes
 * - Registro de Estornos com histórico de alterações
 */

let chartFinanceiroInstance = null;

const FinanceiroModule = {
  // Estado dos filtros
  activeTab: 'todos', // 'todos' | 'a_receber' | 'a_pagar' | 'vencidos' | 'efetivados' | 'estornados'
  filtroTipo: '',     // '' | 'receita' | 'despesa'
  filtroStatus: '',   // '' | 'pago' | 'recebido' | 'pendente' | 'estornado'
  filtroCentro: '',
  filtroProprietario: '',
  filtroMesAno: '',   // YYYY-MM ou 'TODOS'
  searchQuery: '',

  // Estado do gráfico
  chartMode: 'mensal', // 'mensal' | 'anual'
  chartAno: new Date().getFullYear(),
  chartMes: new Date().getMonth() + 1,

  // Lançamento em edição ou estorno
  currentEditId: null,
  currentEstornoId: null,

  init() {
    // Inicializa exibindo Todo o Histórico para não ocultar encomendas com entrega em outros meses
    const hoje = new Date();
    this.filtroMesAno = 'TODOS';
    this.chartAno = hoje.getFullYear();
    this.chartMes = hoje.getMonth() + 1;
    const selMes = document.getElementById('fin-filtro-mesano');
    if (selMes) selMes.value = 'TODOS';

    this.render();

    // Reatividade a eventos do sistema (inclui Encomendas interligadas em tempo real)
    window.addEventListener('seven_data_updated', (e) => {
      const t = e.detail?.table;
      if (!t || t === 'financeiro_lancamentos' || t === 'financeiro_auditoria' || t === 'despesas' || t === 'config' || t === 'encomendas') {
        this.render();
      }
    });

    window.addEventListener('seven_proprietario_changed', () => {
      this.updateProprietarioSelector();
    });
  },

  checkMigrateLegacyDespesas() {
    const lancamentos = StorageService.get('financeiro_lancamentos') || [];
    const despesasAntigas = StorageService.get('despesas') || [];

    if (lancamentos.length === 0 && despesasAntigas.length > 0) {
      const convertidas = despesasAntigas.map(d => ({
        id: d.id || `desp-${Date.now()}`,
        tipo: 'despesa',
        descricao: d.descricao || 'Despesa Operacional',
        valor: Number(d.valor) || 0,
        categoria: d.categoria || 'Outros',
        centro_custo: 'Oficina / Produção Laser',
        data: d.data || new Date().toISOString().split('T')[0],
        forma_pagamento: d.forma_pagamento || 'Pix',
        local_pagamento: 'Banco Inter',
        status: 'pago',
        observacoes: 'Importado de despesas anteriores',
        proprietario: StorageService.getActiveProprietario(),
        parcela_atual: 1,
        total_parcelas: 1,
        estornado: false,
        origem: 'manual',
        historico_alteracoes: []
      }));
      StorageService.set('financeiro_lancamentos', convertidas);
    }
  },

  getLancamentosManuais() {
    return StorageService.get('financeiro_lancamentos') || [];
  },

  getLancamentosEncomendas() {
    const encomendas = StorageService.get('encomendas') || [];
    const hojeIso = this.formatIsoDate(new Date());
    const result = [];

    encomendas.forEach(enc => {
      if (!enc || enc.status === 'Cancelada') return;
      const valorTotal = Number(enc.valor_total) || 0;
      if (valorTotal <= 0) return;

      const valorPago = Math.max(0, Number(enc.valor_pago) || 0);
      const numPedido = StorageService.formatOrderNumber ? StorageService.formatOrderNumber(enc) : `#${String(enc.id).slice(-5)}`;
      const itensResumo = (enc.itens || []).map(i => `${i.quantidade || 1}x ${i.produto_nome || 'Item'}`).join(', ');

      // Garante data válida (YYYY-MM-DD com ano >= 2020)
      const isDataValida = (d) => typeof d === 'string' && /^20\d{2}-\d{2}-\d{2}/.test(d);
      const dataCriacao = (enc.created_at && isDataValida(enc.created_at.split('T')[0])) ? enc.created_at.split('T')[0] : hojeIso;
      const dataPedido = isDataValida(enc.data_confirmacao)
        ? enc.data_confirmacao
        : (isDataValida(enc.data_pedido) ? enc.data_pedido : dataCriacao);
      const dataEntrega = isDataValida(enc.data_entrega_prevista) ? enc.data_entrega_prevista : dataPedido;

      const catLower = (enc.categoria || '').toLowerCase();
      const categoriaFin = catLower.includes('3d')
        ? 'Impressão 3D'
        : (catLower.includes('laser') || catLower.includes('gravação') ? 'Gravação Laser' : 'Venda de Personalizados');
      const centroCusto = catLower.includes('3d') ? 'Produção 3D' : 'Oficina / Produção Laser';

      const base = {
        tipo: 'receita',
        categoria: categoriaFin,
        centro_custo: centroCusto,
        forma_pagamento: enc.forma_pagamento || 'Pix',
        local_pagamento: 'Encomendas',
        proprietario: 'Sistema',
        observacoes: itensResumo || 'Pedido de Personalizados',
        estornado: false,
        origem: 'encomenda',
        encomenda_id: enc.id,
        encomenda_numero: numPedido,
        encomenda_status: enc.status || 'Fila',
        parcela_atual: 1,
        total_parcelas: 1
      };

      if (enc.pagamento_status === 'Pago' || valorPago >= valorTotal) {
        result.push({
          ...base,
          id: `enc-fin-pago-${enc.id}`,
          descricao: `Pedido ${numPedido} — ${enc.cliente_nome || 'Cliente'}`,
          valor: valorTotal,
          data: dataPedido,
          status: 'recebido'
        });
      } else if (enc.pagamento_status === 'Parcial' || valorPago > 0) {
        if (valorPago > 0) {
          result.push({
            ...base,
            id: `enc-fin-pago-${enc.id}`,
            descricao: `Pedido ${numPedido} — ${enc.cliente_nome || 'Cliente'} (Entrada)`,
            valor: valorPago,
            data: dataPedido,
            status: 'recebido'
          });
        }
        const restante = Math.max(0, Number((valorTotal - valorPago).toFixed(2)));
        if (restante > 0) {
          result.push({
            ...base,
            id: `enc-fin-pend-${enc.id}`,
            descricao: `Pedido ${numPedido} — ${enc.cliente_nome || 'Cliente'} (Saldo a Receber)`,
            valor: restante,
            data: dataEntrega,
            status: 'pendente'
          });
        }
      } else {
        result.push({
          ...base,
          id: `enc-fin-pend-${enc.id}`,
          descricao: `Pedido ${numPedido} — ${enc.cliente_nome || 'Cliente'}`,
          valor: valorTotal,
          data: dataEntrega,
          status: 'pendente'
        });
      }
    });

    return result;
  },

  getLancamentos() {
    return [...this.getLancamentosManuais(), ...this.getLancamentosEncomendas()];
  },

  quitarEncomenda(encomendaId) {
    if (!encomendaId || typeof EncomendasModule === 'undefined') return;
    EncomendasModule.quitarPagamento(encomendaId);
    this.render();
    if (typeof App !== 'undefined' && App.renderDashboard) App.renderDashboard();
  },

  formatIsoDate(date) {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  // ==========================================
  // RENDERIZAÇÃO PRINCIPAL DO FINANCEIRO
  // ==========================================
  render() {
    const container = document.getElementById('view-financeiro');
    if (!container) return;

    this.updateProprietarioSelector();
    this.renderIndicadores();
    this.renderContasResumo();
    if (this.activeTab === 'auditoria') {
      this.renderTabelaAuditoria();
    } else {
      this.renderTabelaLancamentos();
    }
    this.renderChart();
  },

  updateProprietarioSelector() {
    const ativo = StorageService.getActiveProprietario();
    const user = (typeof AuthModule !== 'undefined' && AuthModule.getCurrentUser) ? AuthModule.getCurrentUser() : null;
    const badgeEl = document.getElementById('fin-active-user-badge');
    if (badgeEl) {
      badgeEl.innerHTML = `👤 <strong>${App.escapeHtml(user?.nome || ativo)}</strong>`;
      badgeEl.title = user?.email ? `Logado como ${user.email}` : '';
    }

    // Atualiza o filtro de proprietários na barra de filtros
    const filtroProp = document.getElementById('fin-filtro-proprietario');
    if (filtroProp) {
      const proprietarios = StorageService.getProprietarios();
      const atualVal = this.filtroProprietario || '';
      filtroProp.innerHTML = `<option value="">Usuário: Todos</option>` +
        proprietarios.map(p => `<option value="${App.escapeHtml(p)}" ${p === atualVal ? 'selected' : ''}>👤 ${App.escapeHtml(p)}</option>`).join('');
    }
  },

  onActiveProprietarioChange(novoNome) {
    StorageService.setActiveProprietario(novoNome);
    App.toast(`Perfil ativo alterado para: ${novoNome}`, 'info');
    this.renderIndicadores();
    this.renderTabelaLancamentos();
  },

  // 1. INDICADORES FINANCEIROS NO TOPO
  renderIndicadores() {
    const lancamentos = this.getLancamentos();
    const hoje = new Date();
    const hojeIso = this.formatIsoDate(hoje);
    const mesAtualIso = `${hoje.getFullYear()}-${(hoje.getMonth() + 1).toString().padStart(2, '0')}`;

    // SALDO DISPONÍVEL (Dinheiro real em caixa/bancos = Receitas Efetivadas - Despesas Efetivadas)
    // Pendentes e Estornados NÃO entram no Saldo Disponível
    let saldoDisponivel = 0;
    let receitasEfetivadasTotal = 0;
    let despesasEfetivadasTotal = 0;

    // Indicadores do Mês Atual
    let receitasMes = 0;
    let despesasMes = 0;

    // Contas a Pagar e Contas a Receber (Pendentes)
    let valoresAPagar = 0;
    let valoresAReceber = 0;
    let contasVencidas = 0;
    let contasVencidasCount = 0;

    lancamentos.forEach(l => {
      const val = Number(l.valor) || 0;
      const isEstornado = !!l.estornado || l.status === 'estornado';
      if (isEstornado) return; // Estorno anula impacto

      const isReceita = l.tipo === 'receita';
      const isPago = l.status === 'pago' || l.status === 'recebido';
      const isPendente = l.status === 'pendente';
      const isNoMes = (l.data || '').startsWith(mesAtualIso);
      const isVencido = isPendente && (l.data < hojeIso);

      if (isReceita) {
        if (isPago) {
          receitasEfetivadasTotal += val;
          if (isNoMes) receitasMes += val;
        } else if (isPendente) {
          valoresAReceber += val;
        }
      } else {
        // Despesa
        if (isPago) {
          despesasEfetivadasTotal += val;
          if (isNoMes) despesasMes += val;
        } else if (isPendente) {
          valoresAPagar += val;
          if (isVencido) {
            contasVencidas += val;
            contasVencidasCount++;
          }
        }
      }
    });

    saldoDisponivel = receitasEfetivadasTotal - despesasEfetivadasTotal;
    const resultadoMes = receitasMes - despesasMes;

    // Atualiza elementos no DOM
    const elSaldo = document.getElementById('fin-kpi-saldo');
    const elRecMes = document.getElementById('fin-kpi-receitas-mes');
    const elDespMes = document.getElementById('fin-kpi-despesas-mes');
    const elResMes = document.getElementById('fin-kpi-resultado-mes');
    const elPagar = document.getElementById('fin-kpi-a-pagar');
    const elReceber = document.getElementById('fin-kpi-a-receber');

    if (elSaldo) {
      elSaldo.textContent = App.formatMoney(saldoDisponivel);
      elSaldo.style.color = saldoDisponivel >= 0 ? '#10b981' : '#ef4444';
    }
    if (elRecMes) elRecMes.textContent = App.formatMoney(receitasMes);
    if (elDespMes) elDespMes.textContent = App.formatMoney(despesasMes);
    if (elResMes) {
      elResMes.textContent = (resultadoMes >= 0 ? '+ ' : '') + App.formatMoney(resultadoMes);
      elResMes.style.color = resultadoMes >= 0 ? '#34d399' : '#f87171';
    }
    if (elPagar) {
      elPagar.textContent = App.formatMoney(valoresAPagar);
      const badgeVenc = document.getElementById('fin-kpi-vencidas-badge');
      if (badgeVenc) {
        if (contasVencidasCount > 0) {
          badgeVenc.style.display = 'inline-flex';
          badgeVenc.textContent = `🚨 ${contasVencidasCount} vencida${contasVencidasCount > 1 ? 's' : ''} (${App.formatMoney(contasVencidas)})`;
        } else {
          badgeVenc.style.display = 'none';
        }
      }
    }
    if (elReceber) elReceber.textContent = App.formatMoney(valoresAReceber);
  },

  // 3. CONTAS A PAGAR E RECEBER (CARDS DE RESUMO E ABAS DE FILTRO)
  renderContasResumo() {
    const lancamentos = this.getLancamentos();
    const hojeIso = this.formatIsoDate(new Date());

    let aReceberCount = 0;
    let aReceberValor = 0;
    let aPagarCount = 0;
    let aPagarValor = 0;
    let vencidosCount = 0;
    let vencidosValor = 0;
    let efetivadosCount = 0;
    let estornadosCount = 0;

    lancamentos.forEach(l => {
      const val = Number(l.valor) || 0;
      if (l.estornado || l.status === 'estornado') {
        estornadosCount++;
        return;
      }
      if (l.status === 'pendente') {
        if (l.tipo === 'receita') {
          aReceberCount++;
          aReceberValor += val;
        } else {
          aPagarCount++;
          aPagarValor += val;
          if (l.data < hojeIso) {
            vencidosCount++;
            vencidosValor += val;
          }
        }
      } else if (l.status === 'pago' || l.status === 'recebido') {
        efetivadosCount++;
      }
    });

    // Atualiza contadores nas abas
    const logsAuditoria = StorageService.get('financeiro_auditoria') || [];
    this.updateTabBadge('fin-tab-badge-todos', lancamentos.length);
    this.updateTabBadge('fin-tab-badge-receber', `${aReceberCount} • ${App.formatMoney(aReceberValor)}`);
    this.updateTabBadge('fin-tab-badge-pagar', `${aPagarCount} • ${App.formatMoney(aPagarValor)}`);
    this.updateTabBadge('fin-tab-badge-vencidos', `${vencidosCount}`, vencidosCount > 0);
    this.updateTabBadge('fin-tab-badge-efetivados', efetivadosCount);
    this.updateTabBadge('fin-tab-badge-estornados', estornadosCount);
    this.updateTabBadge('fin-tab-badge-auditoria', logsAuditoria.length);
  },

  updateTabBadge(id, text, isAlert = false) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    if (isAlert) {
      el.style.background = '#ef4444';
      el.style.color = '#ffffff';
    }
  },

  setTab(tab) {
    this.activeTab = tab;
    // Atualiza botões de aba
    document.querySelectorAll('.fin-filter-tab-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const wrapLanc = document.getElementById('fin-lancamentos-table-wrap');
    const wrapAud = document.getElementById('fin-auditoria-table-wrap');
    if (tab === 'auditoria') {
      if (wrapLanc) wrapLanc.style.display = 'none';
      if (wrapAud) wrapAud.style.display = 'block';
      this.renderTabelaAuditoria();
    } else {
      if (wrapLanc) wrapLanc.style.display = 'block';
      if (wrapAud) wrapAud.style.display = 'none';
      this.renderTabelaLancamentos();
    }
  },

  renderTabelaAuditoria() {
    const tbody = document.getElementById('fin-auditoria-table-body');
    const countEl = document.getElementById('fin-table-count');
    if (!tbody) return;

    let logs = [...(StorageService.get('financeiro_auditoria') || [])];

    // Filtra por usuário ou busca se preenchidos
    if (this.filtroProprietario) {
      logs = logs.filter(l => (l.usuario_nome || '') === this.filtroProprietario);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      logs = logs.filter(l =>
        (l.usuario_nome || '').toLowerCase().includes(q) ||
        (l.acao || '').toLowerCase().includes(q) ||
        (l.descricao || '').toLowerCase().includes(q) ||
        (l.detalhes || '').toLowerCase().includes(q)
      );
    }

    logs.sort((a, b) => (b.data_hora || b.created_at || '').localeCompare(a.data_hora || a.created_at || ''));

    if (countEl) {
      countEl.textContent = `${logs.length} ${logs.length === 1 ? 'registro de alteração' : 'registros de alterações'}`;
    }

    if (logs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 36px; color: var(--text-muted);">
            <div style="font-size: 1.8rem; margin-bottom: 8px;">📜</div>
            <div>Nenhuma alteração registrada ainda no histórico de auditoria.</div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = logs.map(log => {
      const dt = log.data_hora || log.created_at;
      const dtFmt = dt ? new Date(dt).toLocaleString('pt-BR') : '—';
      const acaoLower = (log.acao || '').toLowerCase();
      let badgeStyle = 'background: rgba(56, 189, 248, 0.16); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4);';
      if (acaoLower.includes('cria') || acaoLower.includes('novo')) {
        badgeStyle = 'background: rgba(16, 185, 129, 0.16); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4);';
      } else if (acaoLower.includes('estorno')) {
        badgeStyle = 'background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.45);';
      } else if (acaoLower.includes('exclu')) {
        badgeStyle = 'background: rgba(239, 68, 68, 0.18); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.45);';
      } else if (acaoLower.includes('baixa') || acaoLower.includes('liquida')) {
        badgeStyle = 'background: rgba(168, 85, 247, 0.18); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.45);';
      }

      return `
        <tr>
          <td style="white-space: nowrap; font-size: 0.78rem; color: var(--text-secondary);">${dtFmt}</td>
          <td>
            <span style="font-size: 0.76rem; font-weight: 700; color: #38bdf8; background: rgba(56, 189, 248, 0.12); padding: 3px 9px; border-radius: 999px; border: 1px solid rgba(56, 189, 248, 0.35);">
              👤 ${App.escapeHtml(log.usuario_nome || 'Usuário')}
            </span>
            ${log.usuario_email ? `<div style="font-size: 0.68rem; color: var(--text-muted); margin-top: 2px;">${App.escapeHtml(log.usuario_email)}</div>` : ''}
          </td>
          <td>
            <span class="status-badge" style="${badgeStyle}">${App.escapeHtml(log.acao || 'Alteração')}</span>
          </td>
          <td style="font-weight: 600; color: #ffffff;">${App.escapeHtml(log.descricao || '—')}</td>
          <td style="font-weight: 700; white-space: nowrap; color: var(--text-primary);">${log.valor ? App.formatMoney(log.valor) : '—'}</td>
          <td style="font-size: 0.78rem; color: var(--text-secondary);">${App.escapeHtml(log.detalhes || '—')}</td>
        </tr>
      `;
    }).join('');
  },

  // 6. HISTÓRICO DE MOVIMENTAÇÕES & TABELA
  renderTabelaLancamentos() {
    const tbody = document.getElementById('fin-table-body');
    const countEl = document.getElementById('fin-table-count');
    if (!tbody) return;

    let items = this.getLancamentos();
    const hojeIso = this.formatIsoDate(new Date());

    // 1. Filtro pela aba ativa
    if (this.activeTab === 'a_receber') {
      items = items.filter(i => i.tipo === 'receita' && i.status === 'pendente' && !i.estornado);
    } else if (this.activeTab === 'a_pagar') {
      items = items.filter(i => i.tipo === 'despesa' && i.status === 'pendente' && !i.estornado);
    } else if (this.activeTab === 'vencidos') {
      items = items.filter(i => i.status === 'pendente' && i.data < hojeIso && !i.estornado);
    } else if (this.activeTab === 'efetivados') {
      items = items.filter(i => (i.status === 'pago' || i.status === 'recebido') && !i.estornado);
    } else if (this.activeTab === 'estornados') {
      items = items.filter(i => i.estornado || i.status === 'estornado');
    }

    // 2. Filtro por tipo
    if (this.filtroTipo) {
      items = items.filter(i => i.tipo === this.filtroTipo);
    }

    // 3. Filtro por status
    if (this.filtroStatus) {
      if (this.filtroStatus === 'vencido') {
        items = items.filter(i => i.status === 'pendente' && i.data < hojeIso && !i.estornado);
      } else {
        items = items.filter(i => i.status === this.filtroStatus);
      }
    }

    // 4. Filtro por Centro de Custo
    if (this.filtroCentro) {
      items = items.filter(i => i.centro_custo === this.filtroCentro);
    }

    // 5. Filtro por Proprietário
    if (this.filtroProprietario) {
      items = items.filter(i => i.proprietario === this.filtroProprietario);
    }

    // 6. Filtro por Período / Mês
    if (this.filtroMesAno && this.filtroMesAno !== 'TODOS') {
      items = items.filter(i => (i.data || '').startsWith(this.filtroMesAno));
    }

    // 7. Busca textual
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      items = items.filter(i =>
        (i.descricao || '').toLowerCase().includes(q) ||
        (i.categoria || '').toLowerCase().includes(q) ||
        (i.centro_custo || '').toLowerCase().includes(q) ||
        (i.local_pagamento || '').toLowerCase().includes(q) ||
        (i.forma_pagamento || '').toLowerCase().includes(q) ||
        (i.proprietario || '').toLowerCase().includes(q) ||
        (i.observacoes || '').toLowerCase().includes(q)
      );
    }

    // Ordenação: mais recentes primeiro
    items.sort((a, b) => (b.data || '').localeCompare(a.data || ''));

    if (countEl) {
      countEl.textContent = `${items.length} ${items.length === 1 ? 'lançamento' : 'lançamentos'}`;
    }

    if (items.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; padding: 36px; color: var(--text-muted);">
            <div style="font-size: 1.8rem; margin-bottom: 8px;">📂</div>
            <div>Nenhum lançamento encontrado com os filtros selecionados.</div>
            <button class="btn btn-secondary btn-sm" onclick="FinanceiroModule.limparFiltros()" style="margin-top: 12px;">
              Limpar Filtros
            </button>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = items.map(item => {
      const isReceita = item.tipo === 'receita';
      const isEstornado = !!item.estornado || item.status === 'estornado';
      const isPendente = item.status === 'pendente';
      const isVencido = isPendente && item.data < hojeIso;

      // Status Badge
      let statusHtml = '';
      if (isEstornado) {
        statusHtml = `<span class="status-badge" style="background: rgba(148, 163, 184, 0.18); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.4);">↩️ Estornado</span>`;
      } else if (isVencido) {
        statusHtml = `<span class="status-badge" style="background: rgba(239, 68, 68, 0.22); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.55); font-weight: 700;">🚨 Vencido</span>`;
      } else if (isPendente) {
        statusHtml = `<span class="status-badge" style="background: rgba(245, 158, 11, 0.20); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.45);">⏳ Pendente</span>`;
      } else {
        statusHtml = `<span class="status-badge" style="background: rgba(16, 185, 129, 0.20); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.45);">✅ ${isReceita ? 'Recebido' : 'Pago'}</span>`;
      }

      // Tipo Badge
      const tipoBadge = isReceita
        ? `<span class="status-badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.35);">🟢 Receita</span>`
        : `<span class="status-badge" style="background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.35);">🔴 Despesa</span>`;

      // Parcelamento / Recorrência / Encomenda Tags
      const isEncomenda = item.origem === 'encomenda' && item.encomenda_id;
      let metaTags = '';
      if (isEncomenda) {
        const stLabel = item.encomenda_status ? ` • ${App.escapeHtml(item.encomenda_status)}` : '';
        metaTags += `<span style="font-size: 0.68rem; font-weight: 700; background: rgba(16, 185, 129, 0.16); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4); padding: 1px 6px; border-radius: 4px; margin-left: 6px;">🛍️ Encomenda${stLabel}</span>`;
      }
      if (item.total_parcelas && item.total_parcelas > 1) {
        metaTags += `<span style="font-size: 0.68rem; font-weight: 700; background: rgba(56, 189, 248, 0.18); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4); padding: 1px 6px; border-radius: 4px; margin-left: 6px;">Parcela ${item.parcela_atual}/${item.total_parcelas}</span>`;
      }
      if (item.recorrente) {
        metaTags += `<span style="font-size: 0.68rem; font-weight: 700; background: rgba(168, 85, 247, 0.18); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4); padding: 1px 6px; border-radius: 4px; margin-left: 6px;">🔄 Recorrente</span>`;
      }

      // Valor formatado
      const valorFmt = (isReceita ? '+ ' : '- ') + App.formatMoney(item.valor || 0);
      const valorColor = isEstornado ? 'var(--text-muted)' : (isReceita ? '#34d399' : '#f87171');
      const textDecoration = isEstornado ? 'line-through' : 'none';

      return `
        <tr style="${isEstornado ? 'opacity: 0.6;' : ''}">
          <td style="white-space: nowrap;">
            <strong>${App.formatDate(item.data)}</strong>
            ${isVencido ? '<div style="font-size: 0.68rem; color: #ef4444; font-weight: 700;">Atrasada</div>' : ''}
          </td>
          <td>
            <div style="font-weight: 600; color: #ffffff; display: flex; align-items: center; flex-wrap: wrap; gap: 4px;">
              <span>${App.escapeHtml(item.descricao)}</span>
              ${metaTags}
            </div>
            ${item.observacoes ? `<div style="font-size: 0.74rem; color: var(--text-muted);">${App.escapeHtml(item.observacoes)}</div>` : ''}
          </td>
          <td>${tipoBadge}</td>
          <td><span style="font-size: 0.76rem; background: rgba(255, 255, 255, 0.05); padding: 3px 8px; border-radius: 4px; border: 1px solid var(--border);">${App.escapeHtml(item.categoria || 'Geral')}</span></td>
          <td><span style="font-size: 0.76rem; color: var(--text-secondary);">${App.escapeHtml(item.centro_custo || '—')}</span></td>
          <td>
            <div style="font-size: 0.78rem; font-weight: 500;">${App.escapeHtml(item.forma_pagamento || 'Pix')}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">${App.escapeHtml(item.local_pagamento || 'Caixa')}</div>
          </td>
          <td>
            <span style="font-size: 0.72rem; font-weight: 700; color: #38bdf8; background: rgba(56, 189, 248, 0.12); padding: 2px 7px; border-radius: 999px; border: 1px solid rgba(56, 189, 248, 0.3);">
              👤 ${App.escapeHtml(item.proprietario || 'Proprietário')}
            </span>
          </td>
          <td>${statusHtml}</td>
          <td style="font-weight: 800; font-size: 0.92rem; color: ${valorColor}; text-decoration: ${textDecoration}; white-space: nowrap;">
            ${valorFmt}
          </td>
          <td style="text-align: right; white-space: nowrap;">
            <div style="display: inline-flex; align-items: center; gap: 5px;">
              ${isEncomenda ? `
                ${isPendente ? `
                  <button type="button" class="btn btn-primary btn-sm" onclick="FinanceiroModule.quitarEncomenda('${item.encomenda_id}')" title="Quitar pagamento desta encomenda" style="padding: 4px 8px; font-size: 0.72rem; background: #10b981;">
                    ✓ Quitar
                  </button>
                ` : ''}
                <button type="button" class="btn btn-secondary btn-sm" onclick="EncomendasModule.openEditModal('${item.encomenda_id}')" title="Abrir encomenda para editar valores ou pagamento" style="padding: 4px 8px; font-size: 0.72rem;">
                  ✏️ Pedido
                </button>
              ` : `
                ${isPendente && !isEstornado ? `
                  <button type="button" class="btn btn-primary btn-sm" onclick="FinanceiroModule.baixarLancamento('${item.id}')" title="Marcar como Liquidado/Efetivado" style="padding: 4px 8px; font-size: 0.72rem; background: #10b981;">
                    ✓ Baixar
                  </button>
                ` : ''}
                
                <button type="button" class="btn btn-secondary btn-icon" onclick="FinanceiroModule.openDetalhesModal('${item.id}')" title="Ver Detalhes e Auditoria">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>

                ${!isEstornado ? `
                  <button type="button" class="btn btn-secondary btn-icon" onclick="FinanceiroModule.openEditModal('${item.id}')" title="Editar Lançamento">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                ` : ''}

                ${!isPendente && !isEstornado ? `
                  <button type="button" class="btn btn-secondary btn-icon" onclick="FinanceiroModule.openEstornoModal('${item.id}')" title="Registrar Estorno" style="color: #fbbf24;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                  </button>
                ` : ''}

                <button type="button" class="btn btn-secondary btn-icon" onclick="FinanceiroModule.excluirLancamento('${item.id}')" title="Excluir Lançamento" style="color: #f87171;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              `}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  onSearch(query) {
    this.searchQuery = (query || '').trim();
    if (this.activeTab === 'auditoria') {
      this.renderTabelaAuditoria();
    } else {
      this.renderTabelaLancamentos();
    }
  },

  onFiltroTipoChange(val) {
    this.filtroTipo = val;
    this.renderTabelaLancamentos();
  },

  onFiltroStatusChange(val) {
    this.filtroStatus = val;
    this.renderTabelaLancamentos();
  },

  onFiltroCentroChange(val) {
    this.filtroCentro = val;
    this.renderTabelaLancamentos();
  },

  onFiltroProprietarioChange(val) {
    this.filtroProprietario = val;
    if (this.activeTab === 'auditoria') {
      this.renderTabelaAuditoria();
    } else {
      this.renderTabelaLancamentos();
    }
  },

  onFiltroMesAnoChange(val) {
    this.filtroMesAno = val;
    this.renderTabelaLancamentos();
  },

  limparFiltros() {
    this.activeTab = 'todos';
    this.filtroTipo = '';
    this.filtroStatus = '';
    this.filtroCentro = '';
    this.filtroProprietario = '';
    this.filtroMesAno = 'TODOS';
    this.searchQuery = '';

    const searchInput = document.getElementById('fin-search-input');
    if (searchInput) searchInput.value = '';

    const selTipo = document.getElementById('fin-filtro-tipo');
    if (selTipo) selTipo.value = '';

    const selStatus = document.getElementById('fin-filtro-status');
    if (selStatus) selStatus.value = '';

    const selCentro = document.getElementById('fin-filtro-centro');
    if (selCentro) selCentro.value = '';

    const selProp = document.getElementById('fin-filtro-proprietario');
    if (selProp) selProp.value = '';

    const selMes = document.getElementById('fin-filtro-mesano');
    if (selMes) selMes.value = 'TODOS';

    document.querySelectorAll('.fin-filter-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === 'todos');
    });

    this.renderTabelaLancamentos();
  },

  // ==========================================
  // 4. FLUXO DE CAIXA (GRÁFICO INTERATIVO)
  // ==========================================
  setChartMode(mode) {
    this.chartMode = mode;
    const btnMensal = document.getElementById('fin-chart-btn-mensal');
    const btnAnual = document.getElementById('fin-chart-btn-anual');
    if (btnMensal) btnMensal.classList.toggle('active', mode === 'mensal');
    if (btnAnual) btnAnual.classList.toggle('active', mode === 'anual');
    this.renderChart();
  },

  onChartAnoChange(ano) {
    this.chartAno = parseInt(ano, 10) || new Date().getFullYear();
    this.renderChart();
  },

  onChartMesChange(mes) {
    this.chartMes = parseInt(mes, 10) || (new Date().getMonth() + 1);
    this.renderChart();
  },

  renderChart() {
    const canvas = document.getElementById('financeiro-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    const lancamentos = this.getLancamentos();

    let labels = [];
    let dadosReceitas = [];
    let dadosDespesas = [];
    let dadosSaldo = [];

    if (this.chartMode === 'anual') {
      // Visão Anual (12 Meses)
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      labels = meses;
      dadosReceitas = new Array(12).fill(0);
      dadosDespesas = new Array(12).fill(0);
      dadosSaldo = new Array(12).fill(0);

      lancamentos.forEach(l => {
        if (l.estornado || l.status === 'estornado') return;
        if (l.status !== 'pago' && l.status !== 'recebido') return; // Somente efetivados no fluxo real

        const d = l.data || '';
        const [anoStr, mesStr] = d.split('-');
        if (parseInt(anoStr, 10) === this.chartAno) {
          const mIdx = parseInt(mesStr, 10) - 1;
          if (mIdx >= 0 && mIdx < 12) {
            const val = Number(l.valor) || 0;
            if (l.tipo === 'receita') {
              dadosReceitas[mIdx] += val;
            } else {
              dadosDespesas[mIdx] += val;
            }
          }
        }
      });

      for (let i = 0; i < 12; i++) {
        dadosSaldo[i] = dadosReceitas[i] - dadosDespesas[i];
      }
    } else {
      // Visão Mensal (Agrupado por Dias do Mês Selecionado)
      const totalDias = new Date(this.chartAno, this.chartMes, 0).getDate();
      labels = Array.from({ length: totalDias }, (_, i) => `${i + 1}`);
      dadosReceitas = new Array(totalDias).fill(0);
      dadosDespesas = new Array(totalDias).fill(0);
      dadosSaldo = new Array(totalDias).fill(0);

      const mesFmt = `${this.chartAno}-${this.chartMes.toString().padStart(2, '0')}`;

      lancamentos.forEach(l => {
        if (l.estornado || l.status === 'estornado') return;
        if (l.status !== 'pago' && l.status !== 'recebido') return;

        const d = l.data || '';
        if (d.startsWith(mesFmt)) {
          const diaNum = parseInt(d.split('-')[2], 10);
          if (diaNum >= 1 && diaNum <= totalDias) {
            const idx = diaNum - 1;
            const val = Number(l.valor) || 0;
            if (l.tipo === 'receita') {
              dadosReceitas[idx] += val;
            } else {
              dadosDespesas[idx] += val;
            }
          }
        }
      });

      for (let i = 0; i < totalDias; i++) {
        dadosSaldo[i] = dadosReceitas[i] - dadosDespesas[i];
      }
    }

    if (chartFinanceiroInstance) {
      chartFinanceiroInstance.destroy();
    }

    chartFinanceiroInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Receitas Recebidas',
            data: dadosReceitas,
            backgroundColor: 'rgba(16, 185, 129, 0.75)',
            borderColor: '#10b981',
            borderWidth: 1.5,
            borderRadius: 4
          },
          {
            label: 'Despesas Pagas',
            data: dadosDespesas,
            backgroundColor: 'rgba(239, 68, 68, 0.75)',
            borderColor: '#ef4444',
            borderWidth: 1.5,
            borderRadius: 4
          },
          {
            label: 'Resultado Líquido',
            data: dadosSaldo,
            type: 'line',
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            borderWidth: 2.5,
            tension: 0.3,
            fill: false,
            pointRadius: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return `${ctx.dataset.label}: ${App.formatMoney(ctx.raw)}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8' }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#94a3b8',
              callback: function (val) {
                return 'R$ ' + val;
              }
            }
          }
        }
      }
    });
  },

  // ==========================================
  // MODAL DE LANÇAMENTOS (NOVO / EDITAR)
  // ==========================================
  openNewLancamentoModal(tipo = 'receita') {
    this.currentEditId = null;

    document.getElementById('fin-modal-title').textContent = tipo === 'receita' ? 'Nova Receita' : 'Nova Despesa';
    document.getElementById('fin-form-id').value = '';
    document.getElementById('fin-form-descricao').value = '';
    document.getElementById('fin-form-valor').value = '';
    document.getElementById('fin-form-data').value = this.formatIsoDate(new Date());
    document.getElementById('fin-form-observacoes').value = '';

    // Checkboxes avançados desmarcados
    const chkParcelar = document.getElementById('fin-form-chk-parcelar');
    if (chkParcelar) chkParcelar.checked = false;
    const boxParcelar = document.getElementById('fin-box-parcelar');
    if (boxParcelar) boxParcelar.style.display = 'none';

    const chkRecorrente = document.getElementById('fin-form-chk-recorrente');
    if (chkRecorrente) chkRecorrente.checked = false;
    const boxRecorrente = document.getElementById('fin-box-recorrente');
    if (boxRecorrente) boxRecorrente.style.display = 'none';

    // Reseta campos de Compra no Cartão de Crédito (1ª parcela sugerida para o próximo mês)
    const chkCartao = document.getElementById('fin-form-chk-cartao');
    if (chkCartao) chkCartao.checked = false;
    const boxCartao = document.getElementById('fin-box-cartao');
    if (boxCartao) boxCartao.style.display = 'none';
    const ccEstab = document.getElementById('fin-cc-estabelecimento');
    if (ccEstab) ccEstab.value = '';
    const ccParcelas = document.getElementById('fin-cc-parcelas');
    if (ccParcelas) ccParcelas.value = '1';
    const proxMes = new Date();
    proxMes.setMonth(proxMes.getMonth() + 1);
    const ccMes = document.getElementById('fin-cc-mes-inicio');
    const ccAno = document.getElementById('fin-cc-ano-inicio');
    if (ccMes) ccMes.value = String(proxMes.getMonth() + 1);
    if (ccAno) ccAno.value = String(proxMes.getFullYear());

    const hojeAtual = new Date();
    const parcMes = document.getElementById('fin-parc-mes-inicio');
    const parcAno = document.getElementById('fin-parc-ano-inicio');
    if (parcMes) parcMes.value = String(hojeAtual.getMonth() + 1);
    if (parcAno) parcAno.value = String(hojeAtual.getFullYear());

    this.setModalTipo(tipo);
    this.populateModalSelects();
    this.updateCartaoPreview();

    // Seleciona proprietário ativo por padrão
    const selProp = document.getElementById('fin-form-proprietario');
    if (selProp) selProp.value = StorageService.getActiveProprietario();

    App.openModal('modal-lancamento-financeiro');
  },

  setModalTipo(tipo) {
    const btnReceita = document.getElementById('fin-btn-tipo-receita');
    const btnDespesa = document.getElementById('fin-btn-tipo-despesa');
    const hiddenTipo = document.getElementById('fin-form-tipo');

    if (hiddenTipo) hiddenTipo.value = tipo;

    if (btnReceita && btnDespesa) {
      if (tipo === 'receita') {
        btnReceita.classList.add('active-green');
        btnDespesa.classList.remove('active-red');
      } else {
        btnReceita.classList.remove('active-green');
        btnDespesa.classList.add('active-red');
      }
    }

    // Atualiza opções de categoria de acordo com o tipo
    this.populateModalCategorias(tipo);

    // Atualiza opções de status
    const selStatus = document.getElementById('fin-form-status');
    if (selStatus) {
      if (tipo === 'receita') {
        selStatus.innerHTML = `
          <option value="recebido">✅ Recebido (Efetivado em Caixa)</option>
          <option value="pendente">⏳ Pendente (A Receber)</option>
        `;
      } else {
        selStatus.innerHTML = `
          <option value="pago">✅ Pago (Liquidado / Saída)</option>
          <option value="pendente">⏳ Pendente (A Pagar)</option>
        `;
      }
    }

    // Exibe o bloco de Compra no Cartão de Crédito somente em Despesas (e novos lançamentos)
    const ccWrapper = document.getElementById('fin-cc-wrapper');
    if (ccWrapper) {
      ccWrapper.style.display = (tipo === 'despesa' && !this.currentEditId) ? 'block' : 'none';
      if (tipo !== 'despesa') {
        const chkCartao = document.getElementById('fin-form-chk-cartao');
        const boxCartao = document.getElementById('fin-box-cartao');
        if (chkCartao) chkCartao.checked = false;
        if (boxCartao) boxCartao.style.display = 'none';
      }
    }
  },

  onFormaPagtoModalChange(forma) {
    const tipo = document.getElementById('fin-form-tipo')?.value;
    if (tipo !== 'despesa' || this.currentEditId) return;
    const isCredito = (forma || '').toLowerCase().includes('crédito') || (forma || '').toLowerCase().includes('credito');
    const chkCartao = document.getElementById('fin-form-chk-cartao');
    if (chkCartao && isCredito && !chkCartao.checked) {
      chkCartao.checked = true;
      this.toggleCartaoCredito(true);
    }
  },

  toggleCartaoCredito(checked) {
    const box = document.getElementById('fin-box-cartao');
    if (box) box.style.display = checked ? 'block' : 'none';
    if (checked) {
      // Seleciona automaticamente Cartão de Crédito na forma de pagamento e Pendente como status padrão
      const selForma = document.getElementById('fin-form-forma');
      if (selForma) {
        const optCredito = Array.from(selForma.options).find(o => o.value.toLowerCase().includes('crédito') || o.value.toLowerCase().includes('credito'));
        if (optCredito) selForma.value = optCredito.value;
      }
      const selStatus = document.getElementById('fin-form-status');
      if (selStatus) selStatus.value = 'pendente';

      // Desmarca parcelamento genérico para evitar conflito
      const chkParc = document.getElementById('fin-form-chk-parcelar');
      const boxParc = document.getElementById('fin-box-parcelar');
      if (chkParc) chkParc.checked = false;
      if (boxParc) boxParc.style.display = 'none';
    }
    this.updateCartaoPreview();
  },

  updateCartaoPreview() {
    const hint = document.getElementById('fin-cc-fatura-hint');
    if (!hint) return;
    const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const mes = parseInt(document.getElementById('fin-cc-mes-inicio')?.value, 10) || (new Date().getMonth() + 1);
    const ano = parseInt(document.getElementById('fin-cc-ano-inicio')?.value, 10) || new Date().getFullYear();
    const parcelas = parseInt(document.getElementById('fin-cc-parcelas')?.value, 10) || 1;
    const valor = parseFloat(document.getElementById('fin-form-valor')?.value) || 0;
    const mesNome = mesesNomes[Math.max(0, Math.min(11, mes - 1))];

    if (valor > 0) {
      const valorParc = valor / parcelas;
      hint.textContent = `💡 Compra vinculada à fatura de ${mesNome}/${ano} (vencimento dia 15) — ${parcelas}x de ${App.formatMoney(valorParc)}.`;
    } else {
      hint.textContent = `💡 Compra vinculada à fatura de ${mesNome}/${ano} (vencimento dia 15).`;
    }
  },

  populateModalCategorias(tipo, selectedVal = '') {
    const selCat = document.getElementById('fin-form-categoria');
    if (!selCat) return;

    const categorias = tipo === 'receita'
      ? StorageService.getCategoriasReceita()
      : StorageService.getCategoriasDespesa();

    selCat.innerHTML = categorias.map(c => `
      <option value="${App.escapeHtml(c)}" ${c === selectedVal ? 'selected' : ''}>${App.escapeHtml(c)}</option>
    `).join('');
  },

  populateModalSelects() {
    // Centro de custo
    const selCentro = document.getElementById('fin-form-centro');
    if (selCentro) {
      const centros = StorageService.getCentrosCusto();
      selCentro.innerHTML = centros.map(c => `<option value="${App.escapeHtml(c)}">${App.escapeHtml(c)}</option>`).join('');
    }

    // Forma de Pagamento
    const selForma = document.getElementById('fin-form-forma');
    if (selForma) {
      const formas = StorageService.getFormasPagamento();
      selForma.innerHTML = formas.map(f => `<option value="${App.escapeHtml(f)}">${App.escapeHtml(f)}</option>`).join('');
    }

    // Local / Conta
    const selLocal = document.getElementById('fin-form-local');
    if (selLocal) {
      const locais = StorageService.getLocaisPagamento();
      selLocal.innerHTML = locais.map(l => `<option value="${App.escapeHtml(l)}">${App.escapeHtml(l)}</option>`).join('');
    }

    // Proprietário
    const selProp = document.getElementById('fin-form-proprietario');
    if (selProp) {
      const proprietarios = StorageService.getProprietarios();
      selProp.innerHTML = proprietarios.map(p => `<option value="${App.escapeHtml(p)}">${App.escapeHtml(p)}</option>`).join('');
    }
  },

  toggleParcelamento(checked) {
    const box = document.getElementById('fin-box-parcelar');
    if (box) box.style.display = checked ? 'block' : 'none';
    this.updateCalculoParcelas();
  },

  toggleRecorrencia(checked) {
    const box = document.getElementById('fin-box-recorrente');
    if (box) box.style.display = checked ? 'block' : 'none';
  },

  updateCalculoParcelas() {
    this.updateCartaoPreview();
    const valor = parseFloat(document.getElementById('fin-form-valor').value) || 0;
    const numParcelas = parseInt(document.getElementById('fin-form-num-parcelas').value, 10) || 2;
    const info = document.getElementById('fin-parcelas-calc-info');
    if (!info) return;

    if (valor <= 0) {
      info.textContent = 'Informe o valor total para calcular as parcelas.';
      return;
    }

    const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const mesInicio = parseInt(document.getElementById('fin-parc-mes-inicio')?.value, 10) || (new Date().getMonth() + 1);
    const anoInicio = parseInt(document.getElementById('fin-parc-ano-inicio')?.value, 10) || new Date().getFullYear();
    const mesNome = mesesNomes[Math.max(0, Math.min(11, mesInicio - 1))];

    const valorParcela = valor / numParcelas;
    info.textContent = `${numParcelas}x de ${App.formatMoney(valorParcela)} — 1ª parcela em ${mesNome}/${anoInicio} (todas pendentes até a baixa do administrador)`;
  },

  saveLancamento() {
    const id = document.getElementById('fin-form-id').value;
    const tipo = document.getElementById('fin-form-tipo').value || 'receita';
    const descricao = document.getElementById('fin-form-descricao').value.trim();
    const valor = parseFloat(document.getElementById('fin-form-valor').value) || 0;
    const categoria = document.getElementById('fin-form-categoria').value;
    const centro = document.getElementById('fin-form-centro').value;
    const data = document.getElementById('fin-form-data').value;
    const forma = document.getElementById('fin-form-forma').value;
    const local = document.getElementById('fin-form-local').value;
    const status = document.getElementById('fin-form-status').value;
    const proprietario = document.getElementById('fin-form-proprietario').value || StorageService.getActiveProprietario();
    const observacoes = document.getElementById('fin-form-observacoes').value.trim();

    if (!descricao) {
      App.toast('Por favor, informe a descrição do lançamento.', 'error');
      document.getElementById('fin-form-descricao').focus();
      return;
    }

    if (valor <= 0) {
      App.toast('O valor do lançamento deve ser maior que zero.', 'error');
      document.getElementById('fin-form-valor').focus();
      return;
    }

    if (!data) {
      App.toast('Por favor, selecione uma data válida.', 'error');
      return;
    }

    const isParcelar = document.getElementById('fin-form-chk-parcelar')?.checked;
    const isRecorrente = document.getElementById('fin-form-chk-recorrente')?.checked;

    // Caso de EDIÇÃO de lançamento existente
    if (id) {
      const lancamentos = this.getLancamentos();
      const existing = lancamentos.find(i => i.id === id);
      if (!existing) {
        App.toast('Lançamento não encontrado.', 'error');
        return;
      }

      const historico = existing.historico_alteracoes || [];
      historico.push({
        data: new Date().toISOString(),
        responsavel: StorageService.getActiveProprietario(),
        acao: 'Edição de lançamento',
        campos_alterados: { descricao, valor, categoria, centro_custo: centro, data, forma_pagamento: forma, local_pagamento: local, status }
      });

      const updates = {
        tipo,
        descricao,
        valor,
        categoria,
        centro_custo: centro,
        data,
        forma_pagamento: forma,
        local_pagamento: local,
        status,
        proprietario,
        observacoes,
        historico_alteracoes: historico
      };

      StorageService.update('financeiro_lancamentos', id, updates);

      // Registra alteração detalhada na Auditoria Global do Financeiro
      const diffs = [];
      if (existing.descricao !== descricao) diffs.push(`Descrição: "${existing.descricao}" → "${descricao}"`);
      if (Number(existing.valor) !== Number(valor)) diffs.push(`Valor: ${App.formatMoney(existing.valor)} → ${App.formatMoney(valor)}`);
      if (existing.status !== status) diffs.push(`Status: ${existing.status} → ${status}`);
      if (existing.data !== data) diffs.push(`Data: ${App.formatDate(existing.data)} → ${App.formatDate(data)}`);
      if (existing.categoria !== categoria) diffs.push(`Categoria: ${existing.categoria} → ${categoria}`);
      if (existing.centro_custo !== centro) diffs.push(`Centro: ${existing.centro_custo} → ${centro}`);
      if (existing.local_pagamento !== local) diffs.push(`Local: ${existing.local_pagamento} → ${local}`);

      StorageService.logFinanceiroAuditoria({
        acao: 'Edição',
        lancamento_id: id,
        descricao,
        valor,
        detalhes: diffs.length > 0 ? diffs.join(' | ') : 'Dados atualizados'
      });

      App.toast('Lançamento financeiro atualizado com sucesso!', 'success');
      App.closeModal('modal-lancamento-financeiro');
      this.render();
      return;
    }

    // Caso de COMPRA NO CARTÃO DE CRÉDITO (encaminha cada parcela para a despesa do mês correspondente)
    const isCartaoCredito = tipo === 'despesa' && document.getElementById('fin-form-chk-cartao')?.checked;
    if (isCartaoCredito) {
      const estabelecimento = document.getElementById('fin-cc-estabelecimento')?.value.trim() || '';
      const cartao = document.getElementById('fin-cc-cartao')?.value || 'Cartão de Crédito';
      const numParcelas = Math.max(1, parseInt(document.getElementById('fin-cc-parcelas')?.value, 10) || 1);
      const mesInicio = parseInt(document.getElementById('fin-cc-mes-inicio')?.value, 10) || (new Date().getMonth() + 1);
      const anoInicio = parseInt(document.getElementById('fin-cc-ano-inicio')?.value, 10) || new Date().getFullYear();
      const grupoId = 'cc-' + Date.now();
      const valorBaseParcela = Math.floor((valor / numParcelas) * 100) / 100;
      const diferencaCentavos = Number((valor - (valorBaseParcela * numParcelas)).toFixed(2));
      const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      for (let p = 1; p <= numParcelas; p++) {
        const dataFatura = new Date(anoInicio, (mesInicio - 1) + (p - 1), 15);
        const dataFaturaIso = this.formatIsoDate(dataFatura);
        const valorParc = p === numParcelas ? Number((valorBaseParcela + diferencaCentavos).toFixed(2)) : valorBaseParcela;
        const mesLabel = `${mesesNomes[dataFatura.getMonth()]}/${dataFatura.getFullYear()}`;
        const descBase = estabelecimento ? `${descricao} (${estabelecimento})` : descricao;
        const descFinal = numParcelas > 1 ? `${descBase} (${p}/${numParcelas})` : descBase;
        const obsPartes = [
          `💳 ${cartao}`,
          estabelecimento ? `Loja: ${estabelecimento}` : '',
          `Compra em ${App.formatDate(data)}`,
          `Fatura ${mesLabel}`,
          observacoes
        ].filter(Boolean).join(' • ');

        const novoItem = {
          id: `fin-${Date.now()}-${p}`,
          tipo: 'despesa',
          descricao: descFinal,
          valor: valorParc,
          categoria,
          centro_custo: centro,
          data: dataFaturaIso,
          forma_pagamento: 'Cartão de Crédito',
          local_pagamento: cartao,
          status: 'pendente',
          observacoes: obsPartes,
          proprietario,
          parcela_atual: p,
          total_parcelas: numParcelas,
          id_grupo_parcela: grupoId,
          origem: 'manual',
          estornado: false,
          historico_alteracoes: [{
            data: new Date().toISOString(),
            responsavel: StorageService.getActiveProprietario(),
            acao: `Compra no Cartão ${cartao} (${p}/${numParcelas})`
          }]
        };

        StorageService.insert('financeiro_lancamentos', novoItem);
      }

      StorageService.logFinanceiroAuditoria({
        acao: 'Compra Cartão de Crédito',
        lancamento_id: grupoId,
        descricao: `${descricao}${estabelecimento ? ' — ' + estabelecimento : ''} (${numParcelas}x)`,
        valor,
        detalhes: `Cartão ${cartao} • ${numParcelas}x de ${App.formatMoney(valor / numParcelas)} • 1ª fatura ${mesesNomes[mesInicio - 1]}/${anoInicio}`
      });

      App.toast(`💳 Compra no ${cartao} registrada em ${numParcelas}x de ${App.formatMoney(valor / numParcelas)}!`, 'success');
      App.closeModal('modal-lancamento-financeiro');
      this.render();
      return;
    }

    // Caso de PARCELAMENTO de novo lançamento
    if (isParcelar) {
      const numParcelas = parseInt(document.getElementById('fin-form-num-parcelas').value, 10) || 2;
      const valorBaseParcela = Math.floor((valor / numParcelas) * 100) / 100;
      const diferencaCentavos = Number((valor - (valorBaseParcela * numParcelas)).toFixed(2));
      const grupoId = 'grp-' + Date.now();
      const [, , diaBaseRaw] = data.split('-').map(Number);
      const diaBase = Math.min(28, Math.max(1, diaBaseRaw || 15));
      const mesInicio = parseInt(document.getElementById('fin-parc-mes-inicio')?.value, 10) || (new Date().getMonth() + 1);
      const anoInicio = parseInt(document.getElementById('fin-parc-ano-inicio')?.value, 10) || new Date().getFullYear();

      for (let p = 1; p <= numParcelas; p++) {
        // Calcula a data de vencimento de cada parcela a partir do mês de início escolhido
        const dataParcela = new Date(anoInicio, (mesInicio - 1) + (p - 1), diaBase);
        const dataParcelaIso = this.formatIsoDate(dataParcela);
        const valorParcela = p === numParcelas ? Number((valorBaseParcela + diferencaCentavos).toFixed(2)) : valorBaseParcela;

        // Todas as parcelas nascem pendentes; a baixa mensal é feita manualmente pelo administrador após o pagamento
        const parcelaStatus = 'pendente';

        const novoItem = {
          id: `fin-${Date.now()}-${p}`,
          tipo,
          descricao: `${descricao} (${p}/${numParcelas})`,
          valor: valorParcela,
          categoria,
          centro_custo: centro,
          data: dataParcelaIso,
          forma_pagamento: forma,
          local_pagamento: local,
          status: parcelaStatus,
          observacoes: observacoes ? `${observacoes} — Parcela ${p}/${numParcelas}` : `Parcela ${p}/${numParcelas}`,
          proprietario,
          parcela_atual: p,
          total_parcelas: numParcelas,
          id_grupo_parcela: grupoId,
          origem: 'manual',
          estornado: false,
          historico_alteracoes: [{
            data: new Date().toISOString(),
            responsavel: StorageService.getActiveProprietario(),
            acao: 'Lançamento parcelado criado (pendente de pagamento mensal)'
          }]
        };

        StorageService.insert('financeiro_lancamentos', novoItem);
      }

      StorageService.logFinanceiroAuditoria({
        acao: 'Criação (Parcelado)',
        lancamento_id: grupoId,
        descricao: `${descricao} (${numParcelas}x)`,
        valor,
        detalhes: `${tipo === 'receita' ? 'Receita' : 'Despesa'} em ${numParcelas}x de ${App.formatMoney(valor / numParcelas)} • Início ${String(mesInicio).padStart(2, '0')}/${anoInicio} • ${categoria} • ${local}`
      });

      App.toast(`${numParcelas} parcelas de ${App.formatMoney(valor / numParcelas)} registradas como Pendentes!`, 'success');
      App.closeModal('modal-lancamento-financeiro');
      this.render();
      return;
    }

    // Caso de DESPESA RECORRENTE
    let frequencia = null;
    let repeticoes = 1;
    if (isRecorrente) {
      frequencia = document.getElementById('fin-form-frequencia-recorrencia')?.value || 'mensal';
      repeticoes = parseInt(document.getElementById('fin-form-repeticoes-recorrencia')?.value, 10) || 1;
    }

    if (isRecorrente && repeticoes > 1) {
      const grupoRecId = 'rec-' + Date.now();
      const [anoBase, mesBase, diaBase] = data.split('-').map(Number);

      for (let r = 1; r <= repeticoes; r++) {
        let dataRepeticao;
        if (frequencia === 'semanal') {
          dataRepeticao = new Date(anoBase, mesBase - 1, diaBase + ((r - 1) * 7));
        } else if (frequencia === 'quinzenal') {
          dataRepeticao = new Date(anoBase, mesBase - 1, diaBase + ((r - 1) * 15));
        } else {
          // Mensal
          dataRepeticao = new Date(anoBase, mesBase - 1 + (r - 1), diaBase);
        }
        const dataRepeticaoIso = this.formatIsoDate(dataRepeticao);
        const itemStatus = (r === 1) ? status : 'pendente';

        const novoItem = {
          id: `fin-${Date.now()}-${r}`,
          tipo,
          descricao: repeticoes > 1 ? `${descricao} (${r}/${repeticoes})` : descricao,
          valor,
          categoria,
          centro_custo: centro,
          data: dataRepeticaoIso,
          forma_pagamento: forma,
          local_pagamento: local,
          status: itemStatus,
          observacoes,
          proprietario,
          recorrente: true,
          frequencia_recorrencia: frequencia,
          origem: 'manual',
          estornado: false,
          historico_alteracoes: [{
            data: new Date().toISOString(),
            responsavel: StorageService.getActiveProprietario(),
            acao: 'Lançamento recorrente criado'
          }]
        };

        StorageService.insert('financeiro_lancamentos', novoItem);
      }

      StorageService.logFinanceiroAuditoria({
        acao: 'Criação (Recorrente)',
        lancamento_id: grupoRecId,
        descricao: `${descricao} (${repeticoes}x ${frequencia})`,
        valor: valor * repeticoes,
        detalhes: `${repeticoes} lançamentos de ${App.formatMoney(valor)} (${frequencia}) • ${categoria}`
      });

      App.toast(`${repeticoes} repetições registradas com sucesso!`, 'success');
      App.closeModal('modal-lancamento-financeiro');
      this.render();
      return;
    }

    // Lançamento normal único
    const novoItem = {
      id: `fin-${Date.now()}`,
      tipo,
      descricao,
      valor,
      categoria,
      centro_custo: centro,
      data,
      forma_pagamento: forma,
      local_pagamento: local,
      status,
      observacoes,
      proprietario,
      parcela_atual: 1,
      total_parcelas: 1,
      recorrente: !!isRecorrente,
      frequencia_recorrencia: frequencia,
      origem: 'manual',
      estornado: false,
      historico_alteracoes: [{
        data: new Date().toISOString(),
        responsavel: StorageService.getActiveProprietario(),
        acao: 'Lançamento registrado'
      }]
    };

    StorageService.insert('financeiro_lancamentos', novoItem);
    StorageService.logFinanceiroAuditoria({
      acao: tipo === 'receita' ? 'Criação de Receita' : 'Criação de Despesa',
      lancamento_id: novoItem.id,
      descricao,
      valor,
      detalhes: `Status: ${status} • ${categoria} • ${centro} • ${forma} (${local})`
    });
    App.toast(`${tipo === 'receita' ? 'Receita' : 'Despesa'} registrada com sucesso!`, 'success');
    App.closeModal('modal-lancamento-financeiro');
    this.render();
  },

  // Efetivar / Baixar Lançamento Pendente
  baixarLancamento(id) {
    const item = this.getLancamentos().find(i => i.id === id);
    if (!item) return;

    const novoStatus = item.tipo === 'receita' ? 'recebido' : 'pago';
    const responsavel = StorageService.getActiveProprietario();

    const historico = item.historico_alteracoes || [];
    historico.push({
      data: new Date().toISOString(),
      responsavel,
      acao: `Baixa de lançamento efetuada (${novoStatus})`
    });

    StorageService.update('financeiro_lancamentos', id, {
      status: novoStatus,
      historico_alteracoes: historico
    });

    StorageService.logFinanceiroAuditoria({
      acao: 'Baixa / Liquidação',
      lancamento_id: id,
      descricao: item.descricao,
      valor: item.valor,
      detalhes: `Status alterado: pendente → ${novoStatus}`
    });

    App.toast(`Lançamento liquidado como ${novoStatus === 'recebido' ? 'Recebido' : 'Pago'}!`, 'success');
    this.render();
  },

  openEditModal(id) {
    const item = this.getLancamentos().find(i => i.id === id);
    if (!item) return;

    if (item.estornado) {
      App.toast('Lançamentos estornados não podem ser editados.', 'warning');
      return;
    }

    this.currentEditId = id;
    this.openNewLancamentoModal(item.tipo);

    document.getElementById('fin-modal-title').textContent = 'Editar Lançamento Financeiro';
    document.getElementById('fin-form-id').value = item.id;
    document.getElementById('fin-form-descricao').value = item.descricao || '';
    document.getElementById('fin-form-valor').value = item.valor || '';
    document.getElementById('fin-form-data').value = item.data || '';
    document.getElementById('fin-form-observacoes').value = item.observacoes || '';

    this.setModalTipo(item.tipo);
    this.populateModalCategorias(item.tipo, item.categoria);

    const selCentro = document.getElementById('fin-form-centro');
    if (selCentro) selCentro.value = item.centro_custo || '';

    const selForma = document.getElementById('fin-form-forma');
    if (selForma) selForma.value = item.forma_pagamento || '';

    const selLocal = document.getElementById('fin-form-local');
    if (selLocal) selLocal.value = item.local_pagamento || '';

    const selStatus = document.getElementById('fin-form-status');
    if (selStatus) selStatus.value = item.status || (item.tipo === 'receita' ? 'recebido' : 'pago');

    const selProp = document.getElementById('fin-form-proprietario');
    if (selProp) selProp.value = item.proprietario || StorageService.getActiveProprietario();
  },

  // Estorno com Auditoria
  openEstornoModal(id) {
    const item = this.getLancamentos().find(i => i.id === id);
    if (!item) return;

    this.currentEstornoId = id;

    const info = document.getElementById('fin-estorno-item-info');
    if (info) {
      info.innerHTML = `
        <strong>${App.escapeHtml(item.descricao)}</strong><br>
        Tipo: ${item.tipo === 'receita' ? 'Receita' : 'Despesa'} • Valor: ${App.formatMoney(item.valor)} • Data: ${App.formatDate(item.data)}
      `;
    }

    const selProp = document.getElementById('fin-estorno-proprietario');
    if (selProp) {
      const proprietarios = StorageService.getProprietarios();
      const ativo = StorageService.getActiveProprietario();
      selProp.innerHTML = proprietarios.map(p => `
        <option value="${App.escapeHtml(p)}" ${p === ativo ? 'selected' : ''}>${App.escapeHtml(p)}</option>
      `).join('');
    }

    document.getElementById('fin-estorno-motivo').value = '';

    App.openModal('modal-estorno-financeiro');
  },

  confirmarEstorno() {
    if (!this.currentEstornoId) return;

    const item = this.getLancamentos().find(i => i.id === this.currentEstornoId);
    if (!item) return;

    const motivo = document.getElementById('fin-estorno-motivo').value.trim();
    const responsavel = document.getElementById('fin-estorno-proprietario').value || StorageService.getActiveProprietario();

    if (!motivo) {
      App.toast('Por favor, informe a justificativa do estorno para auditoria.', 'error');
      document.getElementById('fin-estorno-motivo').focus();
      return;
    }

    const historico = item.historico_alteracoes || [];
    historico.push({
      data: new Date().toISOString(),
      responsavel,
      acao: 'Estorno realizado',
      motivo
    });

    StorageService.update('financeiro_lancamentos', this.currentEstornoId, {
      estornado: true,
      status: 'estornado',
      data_estorno: this.formatIsoDate(new Date()),
      motivo_estorno: motivo,
      estornado_por: responsavel,
      historico_alteracoes: historico
    });

    StorageService.logFinanceiroAuditoria({
      acao: 'Estorno',
      lancamento_id: this.currentEstornoId,
      descricao: item.descricao,
      valor: item.valor,
      detalhes: `Motivo: ${motivo}`
    });

    App.toast('Lançamento estornado e saldo financeiro recalculado.', 'info');
    App.closeModal('modal-estorno-financeiro');
    this.render();
  },

  excluirLancamento(id) {
    const item = this.getLancamentos().find(i => i.id === id);
    if (!item) return;

    if (item.status === 'pago' || item.status === 'recebido') {
      if (!confirm(`Este lançamento já foi ${item.status === 'pago' ? 'PAGO' : 'RECEBIDO'}. Para manter a auditoria dos dois sócios, o recomendado é realizar um ESTORNO.\n\nDeseja realmente EXCLUIR permanentemente?`)) {
        return;
      }
    } else {
      if (!confirm('Deseja excluir este lançamento financeiro pendente?')) {
        return;
      }
    }

    StorageService.logFinanceiroAuditoria({
      acao: 'Exclusão',
      lancamento_id: id,
      descricao: item.descricao,
      valor: item.valor,
      detalhes: `${item.tipo === 'receita' ? 'Receita' : 'Despesa'} (${item.status}) removida • Data original: ${App.formatDate(item.data)}`
    });

    StorageService.delete('financeiro_lancamentos', id);
    App.toast('Lançamento excluído com sucesso.', 'info');
    this.render();
  },

  openDetalhesModal(id) {
    const item = this.getLancamentos().find(i => i.id === id);
    if (!item) return;

    const container = document.getElementById('fin-detalhes-container');
    if (!container) return;

    const isReceita = item.tipo === 'receita';
    const isEstornado = !!item.estornado;
    const historico = item.historico_alteracoes || [];

    container.innerHTML = `
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;">
          <div>
            <div style="font-size: 1.1rem; font-weight: 700; color: #ffffff;">
              ${App.escapeHtml(item.descricao)}
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">
              ID: ${item.id} • Cadastrado por <strong>${App.escapeHtml(item.proprietario || 'Proprietário')}</strong>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 1.3rem; font-weight: 800; color: ${isReceita ? '#34d399' : '#f87171'}; ${isEstornado ? 'text-decoration: line-through;' : ''}">
              ${(isReceita ? '+ ' : '- ') + App.formatMoney(item.valor)}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">
              Data: ${App.formatDate(item.data)}
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border);">
          <div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">Tipo / Categoria</div>
            <div style="font-weight: 600; font-size: 0.85rem; color: #ffffff;">
              ${isReceita ? '🟢 Receita' : '🔴 Despesa'} • ${App.escapeHtml(item.categoria || 'Geral')}
            </div>
          </div>
          <div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">Centro de Custo</div>
            <div style="font-weight: 600; font-size: 0.85rem; color: #ffffff;">
              ${App.escapeHtml(item.centro_custo || '—')}
            </div>
          </div>
          <div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">Forma / Conta</div>
            <div style="font-weight: 600; font-size: 0.85rem; color: #ffffff;">
              ${App.escapeHtml(item.forma_pagamento || 'Pix')} (${App.escapeHtml(item.local_pagamento || 'Caixa')})
            </div>
          </div>
          <div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">Status</div>
            <div style="font-weight: 600; font-size: 0.85rem; color: ${isEstornado ? '#94a3b8' : (item.status === 'pendente' ? '#fbbf24' : '#34d399')};">
              ${isEstornado ? '↩️ Estornado' : (item.status === 'pendente' ? '⏳ Pendente' : '✅ Efetivado')}
            </div>
          </div>
        </div>

        ${item.observacoes ? `
          <div style="margin-top: 12px; padding: 10px; background: rgba(0, 0, 0, 0.25); border-radius: 6px; font-size: 0.82rem; color: var(--text-secondary);">
            <strong>Observações:</strong> ${App.escapeHtml(item.observacoes)}
          </div>
        ` : ''}

        ${isEstornado ? `
          <div style="margin-top: 12px; padding: 10px; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 6px; font-size: 0.82rem; color: #f87171;">
            <strong>⚠️ Estornado em ${App.formatDate(item.data_estorno)} por ${App.escapeHtml(item.estornado_por || 'Sócio')}:</strong><br>
            Motivo: ${App.escapeHtml(item.motivo_estorno || 'Não especificado')}
          </div>
        ` : ''}
      </div>

      <h4 style="font-size: 0.9rem; font-weight: 700; color: #ffffff; margin-bottom: 8px;">
        📜 Linha do Tempo & Histórico de Alterações
      </h4>
      <div style="display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto;">
        ${historico.length === 0 ? `
          <div style="font-size: 0.78rem; color: var(--text-muted); padding: 8px;">Nenhuma alteração registrada após a criação.</div>
        ` : historico.map(h => `
          <div style="background: rgba(255, 255, 255, 0.02); border-left: 3px solid #38bdf8; padding: 8px 12px; border-radius: 0 6px 6px 0; font-size: 0.78rem;">
            <div style="display: flex; justify-content: space-between; color: var(--text-muted); font-size: 0.72rem;">
              <span>${new Date(h.data).toLocaleString('pt-BR')}</span>
              <strong>${App.escapeHtml(h.responsavel || 'Proprietário')}</strong>
            </div>
            <div style="color: #ffffff; font-weight: 600; margin-top: 2px;">${App.escapeHtml(h.acao || '')}</div>
            ${h.motivo ? `<div style="color: #fbbf24;">Motivo: ${App.escapeHtml(h.motivo)}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `;

    App.openModal('modal-detalhes-financeiro');
  },

  // ==========================================
  // 5. GESTÃO DE CATEGORIAS, CENTROS E SÓCIOS
  // ==========================================
  openConfigFinanceiroModal() {
    this.renderConfigLists();
    App.openModal('modal-config-financeiro');
  },

  renderConfigLists() {
    // 1. Proprietários
    const props = StorageService.getProprietarios();
    const listProps = document.getElementById('fin-cfg-list-proprietarios');
    if (listProps) {
      listProps.innerHTML = props.map((p, idx) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: rgba(255, 255, 255, 0.04); border-radius: 6px; margin-bottom: 4px;">
          <span>👤 ${App.escapeHtml(p)}</span>
          <div style="display: flex; gap: 4px;">
            <button class="btn btn-secondary btn-icon" onclick="FinanceiroModule.editProprietarioPrompt(${idx})" title="Editar nome" style="padding: 2px 6px;">✏️</button>
            ${props.length > 1 ? `<button class="btn btn-secondary btn-icon" onclick="FinanceiroModule.removeProprietario(${idx})" title="Remover" style="padding: 2px 6px; color: #f87171;">✕</button>` : ''}
          </div>
        </div>
      `).join('');
    }

    // 2. Centros de Custo
    const centros = StorageService.getCentrosCusto();
    const listCentros = document.getElementById('fin-cfg-list-centros');
    if (listCentros) {
      listCentros.innerHTML = centros.map((c, idx) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: rgba(255, 255, 255, 0.04); border-radius: 6px; margin-bottom: 4px;">
          <span>🏢 ${App.escapeHtml(c)}</span>
          ${centros.length > 1 ? `<button class="btn btn-secondary btn-icon" onclick="FinanceiroModule.removeCentro(${idx})" title="Remover" style="padding: 2px 6px; color: #f87171;">✕</button>` : ''}
        </div>
      `).join('');
    }

    // 3. Locais de Pagamento / Bancos
    const locais = StorageService.getLocaisPagamento();
    const listLocais = document.getElementById('fin-cfg-list-locais');
    if (listLocais) {
      listLocais.innerHTML = locais.map((l, idx) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: rgba(255, 255, 255, 0.04); border-radius: 6px; margin-bottom: 4px;">
          <span>🏦 ${App.escapeHtml(l)}</span>
          ${locais.length > 1 ? `<button class="btn btn-secondary btn-icon" onclick="FinanceiroModule.removeLocal(${idx})" title="Remover" style="padding: 2px 6px; color: #f87171;">✕</button>` : ''}
        </div>
      `).join('');
    }

    // 4. Categorias de Receita
    const catRec = StorageService.getCategoriasReceita();
    const listRec = document.getElementById('fin-cfg-list-receita');
    if (listRec) {
      listRec.innerHTML = catRec.map((r, idx) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: rgba(255, 255, 255, 0.04); border-radius: 6px; margin-bottom: 4px;">
          <span>🟢 ${App.escapeHtml(r)}</span>
          ${catRec.length > 1 ? `<button class="btn btn-secondary btn-icon" onclick="FinanceiroModule.removeCatReceita(${idx})" title="Remover" style="padding: 2px 6px; color: #f87171;">✕</button>` : ''}
        </div>
      `).join('');
    }

    // 5. Categorias de Despesa
    const catDesp = StorageService.getCategoriasDespesa();
    const listDesp = document.getElementById('fin-cfg-list-despesa');
    if (listDesp) {
      listDesp.innerHTML = catDesp.map((d, idx) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: rgba(255, 255, 255, 0.04); border-radius: 6px; margin-bottom: 4px;">
          <span>🔴 ${App.escapeHtml(d)}</span>
          ${catDesp.length > 1 ? `<button class="btn btn-secondary btn-icon" onclick="FinanceiroModule.removeCatDespesa(${idx})" title="Remover" style="padding: 2px 6px; color: #f87171;">✕</button>` : ''}
        </div>
      `).join('');
    }
  },

  addProprietarioPrompt() {
    const nome = prompt('Digite o nome do novo Proprietário / Sócio:');
    if (nome && nome.trim()) {
      StorageService.addProprietario(nome.trim());
      this.renderConfigLists();
      this.updateProprietarioSelector();
      App.toast('Proprietário cadastrado!', 'success');
    }
  },

  editProprietarioPrompt(index) {
    const props = StorageService.getProprietarios();
    const atual = props[index];
    const novo = prompt('Editar nome do Proprietário:', atual);
    if (novo && novo.trim() && novo.trim() !== atual) {
      StorageService.editProprietario(index, novo.trim());
      this.renderConfigLists();
      this.updateProprietarioSelector();
      App.toast('Nome atualizado!', 'success');
    }
  },

  removeProprietario(index) {
    StorageService.removeProprietario(index);
    this.renderConfigLists();
    this.updateProprietarioSelector();
  },

  addCentroPrompt() {
    const nome = prompt('Novo Centro de Custo (Ex: Oficina Laser, 3D, Balcão):');
    if (nome && nome.trim()) {
      StorageService.addCentroCusto(nome.trim());
      this.renderConfigLists();
      App.toast('Centro de Custo adicionado!', 'success');
    }
  },

  removeCentro(index) {
    StorageService.removeCentroCusto(index);
    this.renderConfigLists();
  },

  addLocalPrompt() {
    const nome = prompt('Novo Local / Banco (Ex: Banco Inter, Nubank, Caixa Físico):');
    if (nome && nome.trim()) {
      StorageService.addLocalPagamento(nome.trim());
      this.renderConfigLists();
      App.toast('Local de pagamento adicionado!', 'success');
    }
  },

  removeLocal(index) {
    StorageService.removeLocalPagamento(index);
    this.renderConfigLists();
  },

  addCatReceitaPrompt() {
    const nome = prompt('Nova Categoria de Receita:');
    if (nome && nome.trim()) {
      StorageService.addCategoriaReceita(nome.trim());
      this.renderConfigLists();
      App.toast('Categoria de receita adicionada!', 'success');
    }
  },

  removeCatReceita(index) {
    StorageService.removeCategoriaReceita(index);
    this.renderConfigLists();
  },

  addCatDespesaPrompt() {
    const nome = prompt('Nova Categoria de Despesa:');
    if (nome && nome.trim()) {
      StorageService.addCategoriaDespesa(nome.trim());
      this.renderConfigLists();
      App.toast('Categoria de despesa adicionada!', 'success');
    }
  },

  removeCatDespesa(index) {
    StorageService.removeCategoriaDespesa(index);
    this.renderConfigLists();
  }
};
