/**
 * SEVEN PERSONALIZADOS — APLICAÇÃO PRINCIPAL (APP CORE)
 * Gerencia navegação SPA, dashboard geral, modais, toasts e inicialização
 */

const App = {
  currentView: 'dashboard',

  init() {
    this.setupNavigation();
    this.setupModals();
    this.renderDashboard();

    // Inicializa os submódulos
    CrmModule.init();
    EncomendasModule.init();
    EstoqueModule.init();
    FinanceiroModule.init();
    PropostasModule.init();
    this.loadConfigView();

    window.addEventListener('seven_data_updated', () => {
      this.renderDashboard();
      if (this.currentView === 'finalizados') {
        EncomendasModule.renderFinalizados();
      }
    });

    console.log('Seven Personalizados inicializado com sucesso.');
  },

  setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-item button[data-view]');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');
        this.navigate(view);
      });
    });
  },

  navigate(viewName) {
    this.currentView = viewName;

    // Atualiza botões
    document.querySelectorAll('.nav-item button[data-view]').forEach(btn => {
      if (btn.getAttribute('data-view') === viewName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Alterna seções
    document.querySelectorAll('.view-section').forEach(sec => {
      sec.classList.remove('active');
    });

    const activeSec = document.getElementById(`view-${viewName}`);
    if (activeSec) {
      activeSec.classList.add('active');
    }

    // Título no Topbar
    const titles = {
      dashboard: { title: 'Painel Geral & Indicadores', sub: 'Visão executiva do estúdio de personalização' },
      crm: { title: 'CRM & Funil de Vendas', sub: 'Acompanhe contatos, orçamentos e fechamentos' },
      encomendas: { title: 'Encomendas & Produção', sub: 'Controle de prazos, etapas e personalizações' },
      finalizados: { title: 'Histórico de Finalizados', sub: 'Encomendas entregues e quitadas' },
      estoque: { title: 'Estoque de Insumos', sub: 'Filamentos 3D, chapas laser, copos e embalagens' },
      financeiro: { title: 'Financeiro & Fluxo de Caixa', sub: 'Entradas, despesas operacionais e balanço' },
      propostas: { title: 'Gerador de Propostas Comerciais', sub: 'Crie propostas de alto valor prontas para fechar' },
      configuracoes: { title: 'Configurações do Estúdio', sub: 'Dados da empresa, dados bancários e integrações' }
    };

    const header = titles[viewName] || titles.dashboard;
    const titleEl = document.getElementById('topbar-title-text');
    const subEl = document.getElementById('topbar-subtitle-text');
    if (titleEl) titleEl.textContent = header.title;
    if (subEl) subEl.textContent = header.sub;

    if (viewName === 'dashboard') {
      this.renderDashboard();
    } else if (viewName === 'finalizados') {
      EncomendasModule.renderFinalizados();
    } else if (viewName === 'encomendas') {
      EncomendasModule.render();
    }
  },

  renderDashboard() {
    const enc = StorageService.get('encomendas');
    const desp = StorageService.get('despesas');
    const est = StorageService.get('estoque');
    const crm = StorageService.get('crm_cards');

    // 1. Encomendas em aberto (exclui canceladas e finalizadas com sucesso)
    const encFinalizadas = enc.filter(e => {
      if (e.status === 'Cancelada') return false;
      return (e.status === 'Entregue' || e.status === 'Pronto') && e.pagamento_status === 'Pago';
    });

    const encAbertas = enc.filter(e => {
      if (e.status === 'Cancelada') return false;
      const isFin = (e.status === 'Entregue' || e.status === 'Pronto') && e.pagamento_status === 'Pago';
      return !isFin;
    });

    const elEncAbertas = document.getElementById('dash-kpi-enc-abertas');
    if (elEncAbertas) elEncAbertas.textContent = encAbertas.length;

    // 2. Receita e Despesas do Mês
    const receitaMes = enc.reduce((s, e) => s + (Number(e.valor_pago) || 0), 0);
    const despMes = desp.reduce((s, d) => s + (Number(d.valor) || 0), 0);
    const saldo = receitaMes - despMes;

    const elReceita = document.getElementById('dash-kpi-receita');
    const elDespesa = document.getElementById('dash-kpi-despesa');
    const elSaldo = document.getElementById('dash-kpi-saldo');

    if (elReceita) elReceita.textContent = this.formatMoney(receitaMes);
    if (elDespesa) elDespesa.textContent = this.formatMoney(despMes);
    if (elSaldo) {
      elSaldo.textContent = this.formatMoney(saldo);
      elSaldo.style.color = saldo >= 0 ? '#10b981' : '#ef4444';
    }

    // 3. Atualiza Badges de alerta no menu lateral
    const bCrm = document.getElementById('nav-badge-crm');
    if (bCrm) bCrm.textContent = crm.length;

    const bEnc = document.getElementById('nav-badge-encomendas');
    if (bEnc) bEnc.textContent = encAbertas.length;

    const bFin = document.getElementById('nav-badge-finalizados');
    if (bFin) bFin.textContent = encFinalizadas.length;

    const estoqueBaixo = est.filter(i => Number(i.quantidade_atual) <= Number(i.estoque_minimo));
    const bEst = document.getElementById('nav-badge-estoque');
    if (bEst) {
      bEst.textContent = estoqueBaixo.length;
      bEst.className = estoqueBaixo.length > 0 ? 'badge-counter highlight' : 'badge-counter';
    }

    // 4. Próximas Entregas
    const proximas = encAbertas
      .filter(e => e.data_entrega_prevista)
      .sort((a, b) => (a.data_entrega_prevista > b.data_entrega_prevista ? 1 : -1))
      .slice(0, 5);

    const containerEntregas = document.getElementById('dash-proximas-entregas');
    if (containerEntregas) {
      if (proximas.length === 0) {
        containerEntregas.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 24px;">Nenhuma entrega pendente no momento! 🎉</div>`;
      } else {
        containerEntregas.innerHTML = proximas.map(e => `
          <div class="dash-row-clickable" onclick="EncomendasModule.openEditModal('${e.id}')" title="Clique para abrir detalhes da encomenda #${e.id.substring(e.id.length - 5)}" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid var(--border); border-radius: 6px;">
            <div style="flex: 1; min-width: 0; padding-right: 12px;">
              <div style="font-weight: 600; color: var(--text-primary);">${this.escapeHtml(e.cliente_nome)} <span style="font-size: 0.76rem; color: var(--text-muted); font-weight: normal;">#${e.id.substring(e.id.length - 5)}</span></div>
              <div style="font-size: 0.78rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${(e.itens || []).map(i => i.produto_nome).join(', ') || 'Pedido Personalizado'}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;" onclick="event.stopPropagation()">
              ${EncomendasModule.renderStatusSelect(e.id, e.status)}
              ${EncomendasModule.renderPagtoSelect(e.id, e.pagamento_status)}
              <div style="font-size: 0.76rem; color: var(--accent); margin-left: 4px; white-space: nowrap;">📅 ${this.formatDate(e.data_entrega_prevista)}</div>
            </div>
          </div>
        `).join('');
      }
    }

    // 5. Alerta de Estoque Baixo na Home
    const containerEstoque = document.getElementById('dash-estoque-critico');
    if (containerEstoque) {
      if (estoqueBaixo.length === 0) {
        containerEstoque.innerHTML = `<div style="color: var(--success); text-align: center; padding: 24px;">Estoque saudável! Nenhum insumo abaixo do mínimo. ✅</div>`;
      } else {
        containerEstoque.innerHTML = estoqueBaixo.map(item => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid var(--border);">
            <div>
              <div style="font-weight: 600; color: var(--text-primary);">${this.escapeHtml(item.nome)}</div>
              <div style="font-size: 0.76rem; color: var(--text-muted);">${item.categoria}</div>
            </div>
            <div style="text-align: right;">
              <span class="status-badge badge-alerta-estoque">${item.quantidade_atual} ${item.unidade} (Mín: ${item.estoque_minimo})</span>
            </div>
          </div>
        `).join('');
      }
    }

    // 6. Campo de Encomendas Prontas (Aguardando Pagamento ou Retirada / Entrega)
    const prontosPendentes = enc.filter(e => {
      if (e.status === 'Cancelada') return false;
      // Pedido Pronto mas não pago
      if (e.status === 'Pronto' && e.pagamento_status !== 'Pago') return true;
      // Pedido Entregue mas ainda com pagamento pendente/parcial
      if (e.status === 'Entregue' && e.pagamento_status !== 'Pago') return true;
      return false;
    });

    const containerProntos = document.getElementById('dash-prontos-pendentes');
    if (containerProntos) {
      if (prontosPendentes.length === 0) {
        containerProntos.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); padding: 28px 16px;">
            <div style="font-size: 1.5rem; margin-bottom: 6px;">✨</div>
            Nenhuma encomenda pronta com pagamento pendente no momento. Tudo em dia!
          </div>
        `;
      } else {
        containerProntos.innerHTML = `
          <div class="table-responsive">
            <table class="modern-table">
              <thead>
                <tr>
                  <th>Pedido / Cliente</th>
                  <th>Itens Produzidos</th>
                  <th>Status Produção</th>
                  <th>Financeiro</th>
                  <th>Falta Pagar</th>
                  <th style="text-align: right;">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody>
                ${prontosPendentes.map(e => {
                  const valorTotal = Number(e.valor_total) || 0;
                  const valorPago = Number(e.valor_pago) || 0;
                  const restante = Math.max(0, valorTotal - valorPago);
                  const itensStr = (e.itens || []).map(i => `${i.quantidade}x ${i.produto_nome}`).join(', ') || 'Pedido Personalizado';
                  const pagtoClass = EncomendasModule.getPagtoClass(e.pagamento_status);
                  const foneLimpo = (e.telefone || '').replace(/\D/g, '');
                  const zapMsg = encodeURIComponent(`Olá ${e.cliente_nome}! Sua encomenda na Seven Personalizados está pronta! 🎉 Total: ${this.formatMoney(valorTotal)}. Saldo restante: ${this.formatMoney(restante)}.`);
                  const zapLink = foneLimpo ? `https://wa.me/55${foneLimpo}?text=${zapMsg}` : null;

                  return `
                    <tr class="dash-row-clickable" onclick="EncomendasModule.openEditModal('${e.id}')" title="Clique para abrir detalhes da encomenda #${e.id.substring(e.id.length - 5)}">
                      <td>
                        <div style="font-weight: 600; color: var(--text-primary);">${this.escapeHtml(e.cliente_nome)}</div>
                        <div style="font-size: 0.78rem; color: var(--text-muted);">#${e.id.substring(e.id.length - 5)} • ${this.escapeHtml(e.telefone || 'Sem fone')}</div>
                      </td>
                      <td>
                        <div style="font-size: 0.84rem; max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${this.escapeHtml(itensStr)}">
                          ${this.escapeHtml(itensStr)}
                        </div>
                      </td>
                      <td onclick="event.stopPropagation()">
                        ${EncomendasModule.renderStatusSelect(e.id, e.status)}
                      </td>
                      <td onclick="event.stopPropagation()">
                        ${EncomendasModule.renderPagtoSelect(e.id, e.pagamento_status)}
                        <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 3px;">Pago: ${this.formatMoney(valorPago)} de ${this.formatMoney(valorTotal)}</div>
                      </td>
                      <td>
                        <strong style="color: ${restante > 0 ? 'var(--danger)' : 'var(--success)'}; font-size: 0.95rem;">
                          ${this.formatMoney(restante)}
                        </strong>
                      </td>
                      <td style="text-align: right; white-space: nowrap;" onclick="event.stopPropagation()">
                        <button class="btn btn-primary" onclick="EncomendasModule.quitarPagamento('${e.id}')" title="Marcar como Pago e mover para Finalizados" style="padding: 5px 10px; font-size: 0.78rem;">
                          💰 Quitar
                        </button>
                        ${zapLink ? `
                          <a href="${zapLink}" target="_blank" class="btn btn-secondary" title="Avisar no WhatsApp" style="padding: 5px 10px; font-size: 0.78rem; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                            💬 Avisar
                          </a>
                        ` : ''}
                        <button class="btn btn-secondary" onclick="EncomendasModule.openEditModal('${e.id}')" title="Editar encomenda" style="padding: 5px 8px; font-size: 0.78rem;">
                          ✏️
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
    }
  },

  // Modais
  setupModals() {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
    });
  },

  openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('active');
  },

  closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('active');
  },

  // Toast
  toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `
      <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <span>${this.escapeHtml(message)}</span>
    `;

    container.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateX(100%)';
      t.style.transition = 'all 0.3s ease';
      setTimeout(() => t.remove(), 300);
    }, 3500);
  },

  // Formatadores Úteis
  formatMoney(val) {
    const num = Number(val) || 0;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  },

  formatDate(dateStr) {
    if (!dateStr) return '-';
    try {
      const [ano, mes, dia] = dateStr.split('T')[0].split('-');
      if (!dia) return dateStr;
      return `${dia}/${mes}/${ano}`;
    } catch {
      return dateStr;
    }
  },

  formatRelativeDate(isoStr) {
    if (!isoStr) return '';
    try {
      const diff = Date.now() - new Date(isoStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60) return `há ${Math.max(1, mins)} min`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `há ${hrs}h`;
      const dias = Math.floor(hrs / 24);
      return `há ${dias} dias`;
    } catch {
      return '';
    }
  },

  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  // Configurações
  loadConfigView() {
    const config = StorageService.getConfig();
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    };

    setVal('cfg-empresa', config.nomeEmpresa);
    setVal('cfg-slogan', config.slogan);
    setVal('cfg-telefone', config.telefone);
    setVal('cfg-whatsapp', config.whatsapp);
    setVal('cfg-email', config.email);
    setVal('cfg-pix', config.chavePix);
    setVal('cfg-endereco', config.endereco);
  },

  saveConfigForm() {
    const config = {
      nomeEmpresa: document.getElementById('cfg-empresa')?.value || 'Seven Personalizados',
      slogan: document.getElementById('cfg-slogan')?.value || '',
      telefone: document.getElementById('cfg-telefone')?.value || '',
      whatsapp: document.getElementById('cfg-whatsapp')?.value || '',
      email: document.getElementById('cfg-email')?.value || '',
      chavePix: document.getElementById('cfg-pix')?.value || '',
      endereco: document.getElementById('cfg-endereco')?.value || ''
    };

    StorageService.saveConfig(config);
    this.toast('Configurações da Seven Personalizados salvas!', 'success');
  }
};

// Inicia ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
