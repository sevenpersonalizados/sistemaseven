/**
 * SEVEN PERSONALIZADOS — MÓDULO DE ENCOMENDAS & PRODUÇÃO
 * Gestão de pedidos personalizados, itens detalhados, prazos de entrega e pagamentos
 */

let encomendaItensTemp = [];

const EncomendasModule = {
  init() {
    this.render();
    this.attachEvents();
    window.addEventListener('seven_data_updated', (e) => {
      if (!e.detail || e.detail?.table === 'encomendas') {
        this.render();
        this.renderFinalizados();
      }
    });
  },

  render() {
    const encomendas = StorageService.get('encomendas');
    const filtroStatus = document.getElementById('filtro-enc-status')?.value || '';
    const filtroPagto = document.getElementById('filtro-enc-pagto')?.value || '';

    const container = document.getElementById('encomendas-grupos-container');
    if (!container) return;

    // Dicionário de estilos e identidades visuais por categoria de status
    const definicoesGrupos = {
      'Em produção': {
        key: 'Em produção',
        icon: '⚙️',
        title: 'Em Produção',
        subtitle: 'Pedidos atualmente em produção / confecção',
        themeColor: '#00a8f3',
        titleColor: '#38bdf8',
        borderColor: 'rgba(0, 168, 243, 0.45)',
        headerBg: 'linear-gradient(90deg, rgba(0, 168, 243, 0.22) 0%, rgba(13, 18, 31, 0.95) 100%)',
        glowShadow: '0 6px 24px rgba(0, 168, 243, 0.12)',
        badgeStyle: 'background: rgba(0, 168, 243, 0.22); color: #38bdf8; border: 1px solid rgba(0, 168, 243, 0.55);'
      },
      'Fila': {
        key: 'Fila',
        icon: '⏳',
        title: 'Fila de Espera',
        subtitle: 'Aguardando corte, matéria-prima ou início da produção',
        themeColor: '#f59e0b',
        titleColor: '#fbbf24',
        borderColor: 'rgba(245, 158, 11, 0.45)',
        headerBg: 'linear-gradient(90deg, rgba(245, 158, 11, 0.22) 0%, rgba(13, 18, 31, 0.95) 100%)',
        glowShadow: '0 6px 24px rgba(245, 158, 11, 0.12)',
        badgeStyle: 'background: rgba(245, 158, 11, 0.22); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.55);'
      },
      'Pronto': {
        key: 'Pronto',
        icon: '📦',
        title: 'Prontos para Retirada / Envio',
        subtitle: 'Produção finalizada (aguardando entrega ao cliente ou quitação)',
        themeColor: '#a855f7',
        titleColor: '#c084fc',
        borderColor: 'rgba(168, 85, 247, 0.45)',
        headerBg: 'linear-gradient(90deg, rgba(168, 85, 247, 0.22) 0%, rgba(13, 18, 31, 0.95) 100%)',
        glowShadow: '0 6px 24px rgba(168, 85, 247, 0.12)',
        badgeStyle: 'background: rgba(168, 85, 247, 0.22); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.55);'
      },
      'Entregue': {
        key: 'Entregue',
        icon: '🚚',
        title: 'Entregues ao Cliente',
        subtitle: 'Pedidos entregues / despachados',
        themeColor: '#10b981',
        titleColor: '#34d399',
        borderColor: 'rgba(16, 185, 129, 0.45)',
        headerBg: 'linear-gradient(90deg, rgba(16, 185, 129, 0.22) 0%, rgba(13, 18, 31, 0.95) 100%)',
        glowShadow: '0 6px 24px rgba(16, 185, 129, 0.12)',
        badgeStyle: 'background: rgba(16, 185, 129, 0.22); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.55);'
      },
      'Cancelada': {
        key: 'Cancelada',
        icon: '❌',
        title: 'Canceladas',
        subtitle: 'Pedidos cancelados ou estornados',
        themeColor: '#ef4444',
        titleColor: '#f87171',
        borderColor: 'rgba(239, 68, 68, 0.45)',
        headerBg: 'linear-gradient(90deg, rgba(239, 68, 68, 0.22) 0%, rgba(13, 18, 31, 0.95) 100%)',
        glowShadow: '0 6px 24px rgba(239, 68, 68, 0.12)',
        badgeStyle: 'background: rgba(239, 68, 68, 0.22); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.55);'
      },
      'Finalizadas': {
        key: 'Finalizadas',
        icon: '✅',
        title: 'Finalizadas (Quitadas e Concluídas)',
        subtitle: 'Histórico de pedidos concluídos e totalmente pagos',
        themeColor: '#10b981',
        titleColor: '#34d399',
        borderColor: 'rgba(16, 185, 129, 0.45)',
        headerBg: 'linear-gradient(90deg, rgba(16, 185, 129, 0.22) 0%, rgba(13, 18, 31, 0.95) 100%)',
        glowShadow: '0 6px 24px rgba(16, 185, 129, 0.12)',
        badgeStyle: 'background: rgba(16, 185, 129, 0.22); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.55);'
      }
    };

    let statusGrupos = [];
    if (!filtroStatus) {
      statusGrupos = [
        definicoesGrupos['Em produção'],
        definicoesGrupos['Fila'],
        definicoesGrupos['Pronto']
      ];
    } else if (filtroStatus === 'TODOS') {
      statusGrupos = [
        definicoesGrupos['Em produção'],
        definicoesGrupos['Fila'],
        definicoesGrupos['Pronto'],
        definicoesGrupos['Entregue'],
        definicoesGrupos['Cancelada']
      ];
    } else if (filtroStatus === 'Finalizadas') {
      statusGrupos = [definicoesGrupos['Finalizadas']];
    } else {
      if (definicoesGrupos[filtroStatus]) {
        statusGrupos = [definicoesGrupos[filtroStatus]];
      }
    }

    let totalGeralEncontrado = 0;

    const htmlGrupos = statusGrupos.map(grupo => {
      let ordensGrupo = encomendas.filter(e => {
        if (grupo.key === 'Finalizadas') {
          return (e.status === 'Entregue' || e.status === 'Pronto') && e.pagamento_status === 'Pago';
        }
        if (!filtroStatus && grupo.key === 'Pronto') {
          const isFin = (e.status === 'Entregue' || e.status === 'Pronto') && e.pagamento_status === 'Pago';
          if (isFin) return false;
        }
        return e.status === grupo.key;
      });

      if (filtroPagto) {
        ordensGrupo = ordensGrupo.filter(e => e.pagamento_status === filtroPagto);
      }

      totalGeralEncontrado += ordensGrupo.length;
      const totalValor = ordensGrupo.reduce((acc, it) => acc + (Number(it.valor_total) || 0), 0);

      ordensGrupo.sort((a, b) => ((a.data_entrega_prevista || '') > (b.data_entrega_prevista || '') ? 1 : -1));

      return `
        <div class="panel-box" style="margin-bottom: 28px; padding: 0; overflow: hidden; border: 1px solid ${grupo.borderColor}; border-left: 6px solid ${grupo.themeColor}; box-shadow: ${grupo.glowShadow}; border-radius: var(--radius-md);">
          <div class="panel-header" style="background: ${grupo.headerBg}; padding: 16px 22px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid ${grupo.borderColor}; flex-wrap: wrap; gap: 14px;">
            <div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 42px; height: 42px; border-radius: 12px; background: rgba(0, 0, 0, 0.4); border: 1px solid ${grupo.borderColor}; font-size: 1.3rem; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
                ${grupo.icon}
              </span>
              <div>
                <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                  <h3 style="font-family: var(--font-display); font-size: 1.15rem; font-weight: 700; color: #ffffff; margin: 0; letter-spacing: 0.02em;">
                    ${grupo.title}
                  </h3>
                  <span style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; padding: 3px 10px; border-radius: 999px; ${grupo.badgeStyle}">
                    ${grupo.key}
                  </span>
                </div>
                <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">
                  ${grupo.subtitle}
                </div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <span style="font-size: 0.8rem; font-weight: 600; padding: 6px 12px; background: rgba(0, 0, 0, 0.45); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: var(--radius-sm); color: var(--text-secondary);">
                📦 <strong style="color: #ffffff;">${ordensGrupo.length}</strong> ${ordensGrupo.length === 1 ? 'encomenda' : 'encomendas'}
              </span>
              <span style="font-size: 0.82rem; font-weight: 700; padding: 6px 14px; background: rgba(0, 0, 0, 0.45); border: 1px solid ${grupo.borderColor}; border-radius: var(--radius-sm); color: ${grupo.titleColor};">
                💰 ${App.formatMoney(totalValor)}
              </span>
            </div>
          </div>
          <div class="table-responsive">
            <table class="modern-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Itens & Personalização</th>
                  <th>Status Produção</th>
                  <th>Financeiro</th>
                  <th>Previsão Entrega</th>
                  <th style="text-align: right;">Ações</th>
                </tr>
              </thead>
              <tbody>
                ${ordensGrupo.length === 0 ? `
                  <tr>
                    <td colspan="7" style="text-align: center; padding: 32px 20px; color: var(--text-muted); font-size: 0.88rem;">
                      <div style="font-size: 1.4rem; margin-bottom: 6px; opacity: 0.6;">${grupo.icon}</div>
                      Nenhuma encomenda nesta etapa no momento.
                    </td>
                  </tr>
                ` : ordensGrupo.map(enc => this.renderOrderRow(enc)).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }).join('');

    if (totalGeralEncontrado === 0 && filtroPagto) {
      container.innerHTML = `
        <div class="panel-box" style="text-align: center; padding: 40px; color: var(--text-muted);">
          Nenhuma encomenda encontrada com o filtro de pagamento selecionado.
        </div>
      `;
      return;
    }

    container.innerHTML = htmlGrupos;
  },

  renderOrderRow(enc) {
    const statusClass = this.getStatusClass(enc.status);
    const pagtoClass = this.getPagtoClass(enc.pagamento_status);
    const totalItens = (enc.itens || []).reduce((acc, it) => acc + (Number(it.quantidade) || 0), 0);
    const nomesProdutos = (enc.itens || []).map(i => `${i.quantidade}x ${i.produto_nome}`).join(', ');

    return `
      <tr class="dash-row-clickable" onclick="EncomendasModule.openEditModal('${enc.id}')" title="Clique para abrir detalhes da encomenda #${enc.id.substring(enc.id.length - 5)}">
        <td>
          <strong>#${enc.id.substring(enc.id.length - 5)}</strong>
          <div style="font-size: 0.76rem; color: var(--text-muted);">${App.formatDate(enc.data_pedido)}</div>
        </td>
        <td>
          <div style="font-weight: 600; color: var(--text-primary);">${App.escapeHtml(enc.cliente_nome)}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${App.escapeHtml(enc.telefone || 'Sem fone')}</div>
        </td>
        <td>
          <div style="font-size: 0.85rem; max-width: 280px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${App.escapeHtml(nomesProdutos)}">
            ${App.escapeHtml(nomesProdutos || 'Item personalizado')}
          </div>
          <div style="font-size: 0.74rem; color: var(--accent);">Total: ${totalItens} peças</div>
        </td>
        <td onclick="event.stopPropagation()">
          ${this.renderStatusSelect(enc.id, enc.status)}
        </td>
        <td onclick="event.stopPropagation()">
          <div><strong>${App.formatMoney(enc.valor_total)}</strong></div>
          <div style="margin-top: 4px;">${this.renderPagtoSelect(enc.id, enc.pagamento_status)}</div>
        </td>
        <td>
          <div style="font-weight: 500; color: ${this.isAtrasado(enc.data_entrega_prevista, enc.status) ? 'var(--danger)' : 'var(--text-secondary)'};">
            📅 ${App.formatDate(enc.data_entrega_prevista)}
          </div>
        </td>
        <td style="text-align: right;" onclick="event.stopPropagation()">
          <button class="btn btn-secondary btn-icon" onclick="EncomendasModule.openEditModal('${enc.id}')" title="Editar encomenda">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </button>
        </td>
      </tr>
    `;
  },

  getStatusClass(status) {
    switch (status) {
      case 'Fila': return 'badge-fila';
      case 'Em produção': return 'badge-producao';
      case 'Pronto': return 'badge-pronto';
      case 'Entregue': return 'badge-entregue';
      case 'Cancelada': return 'badge-cancelada';
      default: return 'badge-fila';
    }
  },

  getPagtoClass(pagto) {
    switch (pagto) {
      case 'Pago': return 'badge-pago';
      case 'Parcial': return 'badge-parcial';
      case 'Pendente': return 'badge-pendente';
      default: return 'badge-pendente';
    }
  },

  isAtrasado(dataEntrega, status) {
    if (!dataEntrega || status === 'Entregue' || status === 'Cancelada') return false;
    const hoje = new Date().toISOString().split('T')[0];
    return dataEntrega < hoje;
  },

  renderStatusSelect(id, currentStatus) {
    const statusClass = this.getStatusClass(currentStatus);
    const statuses = ['Fila', 'Em produção', 'Pronto', 'Entregue', 'Cancelada'];
    return `
      <select class="quick-select ${statusClass}" 
              onclick="event.stopPropagation()" 
              onchange="EncomendasModule.quickUpdateStatus('${id}', this.value)" 
              title="Clique para alterar status de produção">
        ${statuses.map(s => `<option value="${s}" ${s === currentStatus ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
    `;
  },

  renderPagtoSelect(id, currentPagto) {
    const pagtoClass = this.getPagtoClass(currentPagto);
    const pagtos = ['Pendente', 'Parcial', 'Pago'];
    return `
      <select class="quick-select ${pagtoClass}" 
              onclick="event.stopPropagation()" 
              onchange="EncomendasModule.quickUpdatePagamento('${id}', this.value)" 
              title="Clique para alterar status financeiro">
        ${pagtos.map(p => `<option value="${p}" ${p === currentPagto ? 'selected' : ''}>${p}</option>`).join('')}
      </select>
    `;
  },

  quickUpdateStatus(id, newStatus) {
    const enc = StorageService.get('encomendas').find(e => e.id === id);
    if (!enc) return;
    
    StorageService.update('encomendas', id, { status: newStatus });
    
    if ((newStatus === 'Pronto' || newStatus === 'Entregue') && enc.pagamento_status === 'Pago') {
      App.toast(`Status alterado para "${newStatus}"! Encomenda movida para Finalizados. 🎉`, 'success');
    } else {
      App.toast(`Status da encomenda #${id.substring(id.length - 5)} alterado para "${newStatus}".`, 'info');
    }
    
    this.render();
    this.renderFinalizados();
    App.renderDashboard();
  },

  quickUpdatePagamento(id, newPagto) {
    const enc = StorageService.get('encomendas').find(e => e.id === id);
    if (!enc) return;
    
    const updateData = { pagamento_status: newPagto };
    if (newPagto === 'Pago') {
      updateData.valor_pago = Number(enc.valor_total) || 0;
    } else if (newPagto === 'Pendente') {
      updateData.valor_pago = 0;
    }
    
    StorageService.update('encomendas', id, updateData);
    
    if (newPagto === 'Pago' && (enc.status === 'Pronto' || enc.status === 'Entregue')) {
      App.toast(`Pagamento quitado! Encomenda movida para Finalizados. 🎉`, 'success');
    } else {
      App.toast(`Financeiro da encomenda #${id.substring(id.length - 5)} alterado para "${newPagto}".`, 'info');
    }
    
    this.render();
    this.renderFinalizados();
    App.renderDashboard();
  },

  openNewModal() {
    this.openNewModalFromLead(null);
  },

  openNewModalFromLead(lead = null) {
    document.getElementById('enc-modal-title').textContent = lead 
      ? `Nova Encomenda — ${lead.lead_name}` 
      : 'Nova Encomenda de Personalizados';
    document.getElementById('enc-form-id').value = '';
    document.getElementById('enc-form-cliente').value = lead?.lead_name || '';
    document.getElementById('enc-form-telefone').value = lead?.phone || '';
    document.getElementById('enc-form-data-pedido').value = new Date().toISOString().split('T')[0];
    
    // Sugere entrega para 5 dias úteis à frente
    const dataEntregaDefault = new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0];
    document.getElementById('enc-form-data-entrega').value = dataEntregaDefault;
    
    document.getElementById('enc-form-status').value = 'Em produção';
    document.getElementById('enc-form-pagto-status').value = 'Pendente';
    document.getElementById('enc-form-forma-pagto').value = 'Pix';
    document.getElementById('enc-form-valor-pago').value = '0';
    document.getElementById('enc-form-obs').value = lead?.last_message || '';
    document.getElementById('enc-btn-delete').style.display = 'none';

    const valorEstimado = parseFloat(lead?.value) || 0;
    encomendaItensTemp = [
      {
        produto_nome: lead?.last_message ? 'Pedido Personalizado' : '',
        personalizacao: lead?.last_message || '',
        quantidade: 1,
        preco_unitario: valorEstimado,
        subtotal: valorEstimado
      }
    ];
    this.renderItensTable();

    App.openModal('modal-encomenda');
  },

  openEditModal(id) {
    const enc = StorageService.get('encomendas').find(e => e.id === id);
    if (!enc) return;

    document.getElementById('enc-modal-title').textContent = `Editar Encomenda #${enc.id.substring(enc.id.length - 5)}`;
    document.getElementById('enc-form-id').value = enc.id;
    document.getElementById('enc-form-cliente').value = enc.cliente_nome || '';
    document.getElementById('enc-form-telefone').value = enc.telefone || '';
    document.getElementById('enc-form-data-pedido').value = enc.data_pedido || '';
    document.getElementById('enc-form-data-entrega').value = enc.data_entrega_prevista || '';
    document.getElementById('enc-form-status').value = enc.status || 'Fila';
    document.getElementById('enc-form-pagto-status').value = enc.pagamento_status || 'Pendente';
    document.getElementById('enc-form-forma-pagto').value = enc.forma_pagamento || 'Pix';
    document.getElementById('enc-form-valor-pago').value = enc.valor_pago || 0;
    document.getElementById('enc-form-obs').value = enc.observacoes || '';
    document.getElementById('enc-btn-delete').style.display = 'inline-block';

    encomendaItensTemp = (enc.itens && enc.itens.length > 0)
      ? JSON.parse(JSON.stringify(enc.itens))
      : [{ produto_nome: '', personalizacao: '', quantidade: 1, preco_unitario: 0, subtotal: 0 }];

    this.renderItensTable();
    App.openModal('modal-encomenda');
  },

  addItemRow() {
    encomendaItensTemp.push({
      produto_nome: '',
      personalizacao: '',
      quantidade: 1,
      preco_unitario: 0,
      subtotal: 0
    });
    this.renderItensTable();
  },

  removeItemRow(index) {
    if (encomendaItensTemp.length > 1) {
      encomendaItensTemp.splice(index, 1);
      this.renderItensTable();
    }
  },

  updateItemRow(index, field, value) {
    const item = encomendaItensTemp[index];
    if (!item) return;

    item[field] = value;
    if (field === 'quantidade' || field === 'preco_unitario') {
      const q = Number(item.quantidade) || 0;
      const p = Number(item.preco_unitario) || 0;
      item.subtotal = q * p;
    }
    this.renderItensTable();
  },

  renderItensTable() {
    const container = document.getElementById('enc-itens-tbody');
    if (!container) return;

    let total = 0;

    container.innerHTML = encomendaItensTemp.map((item, idx) => {
      total += (Number(item.subtotal) || 0);
      return `
        <tr>
          <td>
            <input type="text" class="form-control" style="padding: 6px 10px;" value="${App.escapeHtml(item.produto_nome)}" 
                   placeholder="Ex: Taça de Gin Acrílica" onchange="EncomendasModule.updateItemRow(${idx}, 'produto_nome', this.value)">
          </td>
          <td>
            <input type="text" class="form-control" style="padding: 6px 10px;" value="${App.escapeHtml(item.personalizacao || '')}" 
                   placeholder="Ex: Nome da Aniversariante" onchange="EncomendasModule.updateItemRow(${idx}, 'personalizacao', this.value)">
          </td>
          <td style="width: 80px;">
            <input type="number" min="1" class="form-control" style="padding: 6px 10px;" value="${item.quantidade}" 
                   onchange="EncomendasModule.updateItemRow(${idx}, 'quantidade', this.value)">
          </td>
          <td style="width: 110px;">
            <input type="number" step="0.5" class="form-control" style="padding: 6px 10px;" value="${item.preco_unitario}" 
                   onchange="EncomendasModule.updateItemRow(${idx}, 'preco_unitario', this.value)">
          </td>
          <td style="width: 110px; font-weight: 600; vertical-align: middle;">
            ${App.formatMoney(item.subtotal || 0)}
          </td>
          <td style="width: 40px; text-align: center; vertical-align: middle;">
            <button type="button" class="btn-icon" style="background: transparent; color: var(--danger); border: none; cursor: pointer;" 
                    onclick="EncomendasModule.removeItemRow(${idx})">✕</button>
          </td>
        </tr>
      `;
    }).join('');

    const totalEl = document.getElementById('enc-itens-total-badge');
    if (totalEl) totalEl.textContent = App.formatMoney(total);
  },

  save() {
    const id = document.getElementById('enc-form-id').value;
    const cliente = document.getElementById('enc-form-cliente').value.trim();
    const telefone = document.getElementById('enc-form-telefone').value.trim();
    const dataPedido = document.getElementById('enc-form-data-pedido').value;
    const dataEntrega = document.getElementById('enc-form-data-entrega').value;
    const status = document.getElementById('enc-form-status').value;
    const pagtoStatus = document.getElementById('enc-form-pagto-status').value;
    const formaPagto = document.getElementById('enc-form-forma-pagto').value;
    const valorPago = parseFloat(document.getElementById('enc-form-valor-pago').value) || 0;
    const obs = document.getElementById('enc-form-obs').value.trim();

    if (!cliente) {
      App.toast('Por favor, informe o nome do cliente.', 'error');
      return;
    }

    const valorTotal = encomendaItensTemp.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);

    const payload = {
      cliente_nome: cliente,
      telefone: telefone,
      data_pedido: dataPedido,
      data_entrega_prevista: dataEntrega,
      status: status,
      pagamento_status: pagtoStatus,
      forma_pagamento: formaPagto,
      valor_total: valorTotal,
      valor_pago: valorPago,
      observacoes: obs,
      itens: encomendaItensTemp
    };

    if (id) {
      StorageService.update('encomendas', id, payload);
      App.toast('Encomenda atualizada!', 'success');
    } else {
      StorageService.insert('encomendas', payload);
      App.toast('Encomenda registrada na produção!', 'success');
    }

    App.closeModal('modal-encomenda');
    this.render();
  },

  deleteCurrent() {
    const id = document.getElementById('enc-form-id').value;
    if (!id) return;
    if (confirm('Tem certeza que deseja cancelar e excluir esta encomenda?')) {
      StorageService.delete('encomendas', id);
      App.toast('Encomenda excluída.', 'info');
      App.closeModal('modal-encomenda');
      this.render();
    }
  },
  quitarPagamento(id) {
    const enc = StorageService.get('encomendas').find(e => e.id === id);
    if (!enc) return;
    const total = Number(enc.valor_total) || 0;
    StorageService.update('encomendas', id, {
      pagamento_status: 'Pago',
      valor_pago: total
    });
    App.toast('Pagamento quitado! Encomenda movida para Finalizados. 🎉', 'success');
    this.render();
    this.renderFinalizados();
  },

  marcarEntregue(id) {
    const enc = StorageService.get('encomendas').find(e => e.id === id);
    if (!enc) return;
    StorageService.update('encomendas', id, {
      status: 'Entregue'
    });
    App.toast('Encomenda marcada como Entregue!', 'success');
    this.render();
    this.renderFinalizados();
  },

  renderFinalizados() {
    const encomendas = StorageService.get('encomendas');
    const finalizadas = encomendas.filter(e => {
      if (e.status === 'Cancelada') return false;
      return (e.status === 'Entregue' || e.status === 'Pronto') && e.pagamento_status === 'Pago';
    }).sort((a, b) => ((b.data_entrega_prevista || b.data_pedido || '') > (a.data_entrega_prevista || a.data_pedido || '') ? 1 : -1));

    const totalFaturado = finalizadas.reduce((acc, e) => acc + (Number(e.valor_pago) || Number(e.valor_total) || 0), 0);
    const totalEl = document.getElementById('finalizados-total-valor');
    if (totalEl) totalEl.textContent = App.formatMoney(totalFaturado);

    const tbody = document.getElementById('finalizados-table-body');
    if (!tbody) return;

    if (finalizadas.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 36px; color: var(--text-muted);">Nenhuma encomenda finalizada ainda. Quando uma encomenda estiver pronta e com o pagamento quitado, ela aparecerá automaticamente aqui no histórico.</td></tr>`;
      return;
    }

    tbody.innerHTML = finalizadas.map(enc => {
      const totalItens = (enc.itens || []).reduce((acc, it) => acc + (Number(it.quantidade) || 0), 0);
      const nomesProdutos = (enc.itens || []).map(i => `${i.quantidade}x ${i.produto_nome}`).join(', ');

      return `
        <tr class="dash-row-clickable" onclick="EncomendasModule.openEditModal('${enc.id}')" title="Clique para abrir detalhes da encomenda #${enc.id.substring(enc.id.length - 5)}">
          <td>
            <strong>#${enc.id.substring(enc.id.length - 5)}</strong>
            <div style="font-size: 0.76rem; color: var(--text-muted);">${App.formatDate(enc.data_pedido)}</div>
          </td>
          <td>
            <div style="font-weight: 600; color: var(--text-primary);">${App.escapeHtml(enc.cliente_nome)}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">${App.escapeHtml(enc.telefone || 'Sem fone')}</div>
          </td>
          <td>
            <div style="font-size: 0.85rem; max-width: 280px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${App.escapeHtml(nomesProdutos)}">
              ${App.escapeHtml(nomesProdutos || 'Item personalizado')}
            </div>
            <div style="font-size: 0.74rem; color: var(--accent);">Total: ${totalItens} peças</div>
          </td>
          <td onclick="event.stopPropagation()">
            ${this.renderStatusSelect(enc.id, enc.status)}
          </td>
          <td onclick="event.stopPropagation()">
            <div><strong>${App.formatMoney(enc.valor_total)}</strong></div>
            <div style="margin-top: 4px;">${this.renderPagtoSelect(enc.id, enc.pagamento_status)}</div>
          </td>
          <td>
            <div style="font-weight: 500; color: var(--text-secondary);">
              📅 ${App.formatDate(enc.data_entrega_prevista || enc.data_pedido)}
            </div>
          </td>
          <td style="text-align: right;" onclick="event.stopPropagation()">
            <button class="btn btn-secondary btn-icon" onclick="EncomendasModule.openEditModal('${enc.id}')" title="Ver detalhes / reabrir">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },


  attachEvents() {
    document.getElementById('filtro-enc-status')?.addEventListener('change', () => this.render());
    document.getElementById('filtro-enc-pagto')?.addEventListener('change', () => this.render());
  }
};
