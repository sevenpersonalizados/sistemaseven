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
    }
  },

  renderDashboard() {
    const enc = StorageService.get('encomendas');
    const desp = StorageService.get('despesas');
    const est = StorageService.get('estoque');
    const crm = StorageService.get('crm_cards');

    // 1. Encomendas em aberto
    const encAbertas = enc.filter(e => e.status !== 'Entregue' && e.status !== 'Cancelada');
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
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid var(--border);">
            <div>
              <div style="font-weight: 600; color: var(--text-primary);">${this.escapeHtml(e.cliente_nome)}</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">${(e.itens || []).map(i => i.produto_nome).join(', ') || 'Pedido Personalizado'}</div>
            </div>
            <div style="text-align: right;">
              <span class="status-badge ${EncomendasModule.getStatusClass(e.status)}">${e.status}</span>
              <div style="font-size: 0.76rem; color: var(--accent); margin-top: 4px;">📅 ${this.formatDate(e.data_entrega_prevista)}</div>
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
