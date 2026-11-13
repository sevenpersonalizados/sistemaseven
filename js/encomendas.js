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
      if (e.detail?.table === 'encomendas') this.render();
    });
  },

  render() {
    const encomendas = StorageService.get('encomendas');
    const filtroStatus = document.getElementById('filtro-enc-status')?.value || '';
    const filtroPagto = document.getElementById('filtro-enc-pagto')?.value || '';

    const filtradas = encomendas.filter(e => {
      const matchStatus = !filtroStatus || e.status === filtroStatus;
      const matchPagto = !filtroPagto || e.pagamento_status === filtroPagto;
      return matchStatus && matchPagto;
    });

    const tbody = document.getElementById('encomendas-table-body');
    if (!tbody) return;

    if (filtradas.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 32px; color: var(--text-muted);">Nenhuma encomenda encontrada com os filtros selecionados.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtradas.map(enc => {
      const statusClass = this.getStatusClass(enc.status);
      const pagtoClass = this.getPagtoClass(enc.pagamento_status);
      const totalItens = (enc.itens || []).reduce((acc, it) => acc + (Number(it.quantidade) || 0), 0);
      const nomesProdutos = (enc.itens || []).map(i => `${i.quantidade}x ${i.produto_nome}`).join(', ');

      return `
        <tr>
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
          <td>
            <span class="status-badge ${statusClass}">${enc.status}</span>
          </td>
          <td>
            <div><strong>${App.formatMoney(enc.valor_total)}</strong></div>
            <span class="status-badge ${pagtoClass}" style="margin-top: 4px;">${enc.pagamento_status}</span>
          </td>
          <td>
            <div style="font-weight: 500; color: ${this.isAtrasado(enc.data_entrega_prevista, enc.status) ? 'var(--danger)' : 'var(--text-secondary)'};">
              📅 ${App.formatDate(enc.data_entrega_prevista)}
            </div>
          </td>
          <td style="text-align: right;">
            <button class="btn btn-secondary btn-icon" onclick="EncomendasModule.openEditModal('${enc.id}')" title="Editar encomenda">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </button>
          </td>
        </tr>
      `;
    }).join('');
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

  openNewModal() {
    document.getElementById('enc-modal-title').textContent = 'Nova Encomenda de Personalizados';
    document.getElementById('enc-form-id').value = '';
    document.getElementById('enc-form-cliente').value = '';
    document.getElementById('enc-form-telefone').value = '';
    document.getElementById('enc-form-data-pedido').value = new Date().toISOString().split('T')[0];
    document.getElementById('enc-form-data-entrega').value = '';
    document.getElementById('enc-form-status').value = 'Fila';
    document.getElementById('enc-form-pagto-status').value = 'Pendente';
    document.getElementById('enc-form-forma-pagto').value = 'Pix';
    document.getElementById('enc-form-valor-pago').value = '0';
    document.getElementById('enc-form-obs').value = '';
    document.getElementById('enc-btn-delete').style.display = 'none';

    encomendaItensTemp = [
      { produto_nome: '', personalizacao: '', quantidade: 1, preco_unitario: 0, subtotal: 0 }
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

  attachEvents() {
    document.getElementById('filtro-enc-status')?.addEventListener('change', () => this.render());
    document.getElementById('filtro-enc-pagto')?.addEventListener('change', () => this.render());
  }
};
