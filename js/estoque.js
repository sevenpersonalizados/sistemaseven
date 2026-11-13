/**
 * SEVEN PERSONALIZADOS — MÓDULO DE ESTOQUE DE INSUMOS
 * Gestão de materiais de corte laser, filamentos 3D, copos, chapas e embalagens
 */

const EstoqueModule = {
  init() {
    this.render();
    window.addEventListener('seven_data_updated', (e) => {
      if (e.detail?.table === 'estoque') this.render();
    });
  },

  render() {
    const itens = StorageService.get('estoque');
    const tbody = document.getElementById('estoque-table-body');
    if (!tbody) return;

    if (itens.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 32px; color: var(--text-muted);">Nenhum item em estoque cadastrado.</td></tr>`;
      return;
    }

    tbody.innerHTML = itens.map(item => {
      const isBaixo = Number(item.quantidade_atual) <= Number(item.estoque_minimo);
      const margem = (Number(item.preco_venda) || 0) - (Number(item.custo_unitario) || 0);

      return `
        <tr>
          <td>
            <div style="font-weight: 600; color: var(--text-primary);">${App.escapeHtml(item.nome)}</div>
            <div style="font-size: 0.76rem; color: var(--text-muted);">${item.categoria}</div>
          </td>
          <td>
            <span style="font-size: 0.95rem; font-weight: 700; color: ${isBaixo ? 'var(--danger)' : 'var(--text-primary)'};">
              ${item.quantidade_atual} ${item.unidade}
            </span>
            ${isBaixo ? `<div class="badge-alerta-estoque status-badge" style="margin-top: 4px;">⚠️ Repor Estoque</div>` : ''}
          </td>
          <td>
            <span style="color: var(--text-muted); font-size: 0.85rem;">Mín: ${item.estoque_minimo} ${item.unidade}</span>
          </td>
          <td>
            ${App.formatMoney(item.custo_unitario)}
          </td>
          <td>
            <strong>${App.formatMoney(item.preco_venda)}</strong>
            <div style="font-size: 0.74rem; color: var(--success);">Margem: ${App.formatMoney(margem)}</div>
          </td>
          <td>
            <span class="status-badge ${item.ativo ? 'badge-pago' : 'badge-fila'}">${item.ativo ? 'Ativo' : 'Inativo'}</span>
          </td>
          <td style="text-align: right;">
            <button class="btn btn-secondary btn-icon" onclick="EstoqueModule.openEditModal('${item.id}')" title="Editar item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  openNewModal() {
    document.getElementById('est-modal-title').textContent = 'Novo Insumo ou Produto';
    document.getElementById('est-form-id').value = '';
    document.getElementById('est-form-nome').value = '';
    document.getElementById('est-form-categoria').value = 'Impressão 3D';
    document.getElementById('est-form-unidade').value = 'un';
    document.getElementById('est-form-qtd').value = '0';
    document.getElementById('est-form-minimo').value = '5';
    document.getElementById('est-form-custo').value = '0';
    document.getElementById('est-form-venda').value = '0';
    document.getElementById('est-form-ativo').checked = true;
    document.getElementById('est-btn-delete').style.display = 'none';

    App.openModal('modal-estoque');
  },

  openEditModal(id) {
    const item = StorageService.get('estoque').find(i => i.id === id);
    if (!item) return;

    document.getElementById('est-modal-title').textContent = 'Editar Item de Estoque';
    document.getElementById('est-form-id').value = item.id;
    document.getElementById('est-form-nome').value = item.nome || '';
    document.getElementById('est-form-categoria').value = item.categoria || 'Outro';
    document.getElementById('est-form-unidade').value = item.unidade || 'un';
    document.getElementById('est-form-qtd').value = item.quantidade_atual || 0;
    document.getElementById('est-form-minimo').value = item.estoque_minimo || 0;
    document.getElementById('est-form-custo').value = item.custo_unitario || 0;
    document.getElementById('est-form-venda').value = item.preco_venda || 0;
    document.getElementById('est-form-ativo').checked = item.ativo !== false;
    document.getElementById('est-btn-delete').style.display = 'inline-block';

    App.openModal('modal-estoque');
  },

  save() {
    const id = document.getElementById('est-form-id').value;
    const nome = document.getElementById('est-form-nome').value.trim();
    const categoria = document.getElementById('est-form-categoria').value;
    const unidade = document.getElementById('est-form-unidade').value;
    const qtd = parseFloat(document.getElementById('est-form-qtd').value) || 0;
    const minimo = parseFloat(document.getElementById('est-form-minimo').value) || 0;
    const custo = parseFloat(document.getElementById('est-form-custo').value) || 0;
    const venda = parseFloat(document.getElementById('est-form-venda').value) || 0;
    const ativo = document.getElementById('est-form-ativo').checked;

    if (!nome) {
      App.toast('Por favor, informe o nome do material.', 'error');
      return;
    }

    const payload = {
      nome,
      categoria,
      unidade,
      quantidade_atual: qtd,
      estoque_minimo: minimo,
      custo_unitario: custo,
      preco_venda: venda,
      ativo
    };

    if (id) {
      StorageService.update('estoque', id, payload);
      App.toast('Insumo atualizado!', 'success');
    } else {
      StorageService.insert('estoque', payload);
      App.toast('Material adicionado ao estoque!', 'success');
    }

    App.closeModal('modal-estoque');
    this.render();
  },

  deleteCurrent() {
    const id = document.getElementById('est-form-id').value;
    if (!id) return;
    if (confirm('Tem certeza que deseja excluir este item do estoque?')) {
      StorageService.delete('estoque', id);
      App.toast('Item removido do estoque.', 'info');
      App.closeModal('modal-estoque');
      this.render();
    }
  }
};
