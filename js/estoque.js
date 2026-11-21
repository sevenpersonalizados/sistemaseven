/**
 * SEVEN PERSONALIZADOS — MÓDULO DE ESTOQUE DE INSUMOS
 * Gestão de materiais de corte laser, filamentos 3D, copos, chapas e embalagens
 */

const EstoqueModule = {
  init() {
    this.render();
    window.addEventListener('seven_data_updated', (e) => {
      const table = e.detail?.table;
      if (!table || table === 'estoque' || table === 'filamentos') {
        this.render();
      }
    });
  },

  render() {
    const todos = StorageService.get('estoque') || [];
    const materiaPrima = todos.filter(i => (i.secao || 'materia_prima') !== 'outros');
    const outros = todos.filter(i => i.secao === 'outros');

    const totalQtdEl = document.getElementById('estoque-total-qtd');
    if (totalQtdEl) totalQtdEl.textContent = materiaPrima.length;

    const outrosQtdEl = document.getElementById('estoque-outros-qtd');
    if (outrosQtdEl) outrosQtdEl.textContent = outros.length;

    this.renderTabelaItens('estoque-table-body', materiaPrima, '🧱', 'Nenhuma matéria-prima cadastrada no momento.');
    this.renderTabelaItens('estoque-outros-tbody', outros, '📦', 'Nenhum item cadastrado em Outros no momento.');
    this.renderFilamentos();
  },

  renderTabelaItens(tbodyId, itens, emptyIcon, emptyMsg) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    if (itens.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 32px; color: var(--text-muted);"><div style="font-size: 1.4rem; margin-bottom: 6px;">${emptyIcon}</div>${emptyMsg}</td></tr>`;
      return;
    }

    tbody.innerHTML = itens.map(item => {
      const isBaixo = Number(item.quantidade_atual) <= Number(item.estoque_minimo);
      const cat = item.categoria || '3D';
      const catBadge = (typeof EncomendasModule !== 'undefined' && EncomendasModule.getCategoriaBadge)
        ? EncomendasModule.getCategoriaBadge(cat)
        : `<span class="badge-cat-pill badge-cat-custom">${App.escapeHtml(cat)}</span>`;

      const dataCompraFormatada = item.data_ultima_compra ? App.formatDate(item.data_ultima_compra) : '—';
      const corBadge = item.cor
        ? `<span class="badge-cor-tag" style="display: inline-flex; align-items: center; gap: 4px;">🎨 ${App.escapeHtml(item.cor)}</span>`
        : `<span style="color: var(--text-muted); font-size: 0.82rem;">—</span>`;

      return `
        <tr>
          <td>
            <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">${App.escapeHtml(item.nome)}</div>
            <div>${catBadge}</div>
          </td>
          <td>
            ${corBadge}
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
            <strong>${App.formatMoney(item.custo_unitario)}</strong>
          </td>
          <td>
            <span style="font-size: 0.85rem; color: var(--text-secondary);">📅 ${dataCompraFormatada}</span>
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

  renderFilamentos() {
    const tbody = document.getElementById('estoque-filamentos-tbody');
    const filamentos = StorageService.get('filamentos') || [];
    const qtdEl = document.getElementById('estoque-filamentos-qtd');
    if (qtdEl) qtdEl.textContent = filamentos.length;
    if (!tbody) return;

    if (filamentos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 32px; color: var(--text-muted);"><div style="font-size: 1.4rem; margin-bottom: 6px;">🧵</div>Nenhum filamento cadastrado ainda. Clique em "+ Adicionar Filamento".</td></tr>`;
      return;
    }

    tbody.innerHTML = filamentos.map(f => {
      const preco = Number(f.preco_rolo) || 0;
      const peso = Number(f.peso_rolo_g) || 1000;
      const custoG = (Number(f.custo_por_g) || (peso > 0 ? preco / peso : 0)).toFixed(3);

      return `
        <tr>
          <td>
            <strong style="color: #ffffff; font-size: 0.92rem;">${App.escapeHtml(f.material)}</strong>
            <div style="font-size: 0.74rem; color: #38bdf8; font-weight: 600;">🏷️ ${App.escapeHtml(f.marca || 'Genérica')}</div>
          </td>
          <td>
            <span class="badge-cor-tag" style="display: inline-flex; align-items: center; gap: 4px;">
              🎨 ${App.escapeHtml(f.cor || 'Padrão')}
            </span>
          </td>
          <td>
            ${f.local_compra ? `<div style="font-weight: 600; font-size: 0.82rem; color: #f1f5f9;">🏪 ${App.escapeHtml(f.local_compra)}</div>` : '<span style="color: var(--text-muted); font-size: 0.8rem;">—</span>'}
            ${f.data_compra ? `<div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">📅 ${App.formatDate(f.data_compra)}</div>` : ''}
          </td>
          <td><strong>${peso}g</strong></td>
          <td><strong>${App.formatMoney(preco)}</strong></td>
          <td>
            <span style="font-weight: 700; color: #10b981; background: rgba(16, 185, 129, 0.15); padding: 3px 8px; border-radius: 999px;">
              R$ ${custoG.replace('.', ',')}/g
            </span>
          </td>
          <td style="text-align: right;">
            <div style="display: flex; gap: 6px; justify-content: flex-end;">
              <button class="btn btn-secondary btn-icon" onclick="EstoqueModule.editarFilamento('${f.id}')" title="Editar filamento">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </button>
              <button class="btn btn-secondary btn-icon" onclick="CalculadoraModule.excluirFilamento('${f.id}')" style="color: var(--danger);" title="Excluir filamento">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  editarFilamento(id) {
    if (typeof CalculadoraModule === 'undefined') return;
    CalculadoraModule.abrirModalFilamentos();
    CalculadoraModule.editarFilamento(id);
  },

  openNewModal(secao = 'materia_prima') {
    const isOutros = secao === 'outros';
    document.getElementById('est-modal-title').textContent = isOutros ? 'Novo Item em Outros' : 'Nova Matéria Prima';
    document.getElementById('est-form-id').value = '';
    const secaoEl = document.getElementById('est-form-secao');
    if (secaoEl) secaoEl.value = isOutros ? 'outros' : 'materia_prima';
    document.getElementById('est-form-nome').value = '';

    // Popula categorias cadastradas dinamicamente
    const catSelect = document.getElementById('est-form-categoria');
    if (catSelect) {
      const cats = StorageService.getCategoriasProducao();
      catSelect.innerHTML = cats.map(c => `<option value="${App.escapeHtml(c)}">${App.escapeHtml(c)}</option>`).join('');
      catSelect.value = cats[0] || '3D';
    }

    // Popula cores cadastradas dinamicamente
    const corSelect = document.getElementById('est-form-cor');
    if (corSelect) {
      const cores = StorageService.getCoresDisponiveis();
      corSelect.innerHTML = `<option value="">(Sem cor / Padrão)</option>` + 
        cores.map(c => `<option value="${App.escapeHtml(c)}">${App.escapeHtml(c)}</option>`).join('');
      corSelect.value = '';
    }

    this.popularProdutosEstabelecidos('');

    document.getElementById('est-form-unidade').value = 'un';
    document.getElementById('est-form-qtd').value = '0';
    document.getElementById('est-form-minimo').value = '5';
    document.getElementById('est-form-custo').value = '0';
    document.getElementById('est-form-data-compra').value = new Date().toISOString().split('T')[0];
    document.getElementById('est-form-ativo').checked = true;
    document.getElementById('est-btn-delete').style.display = 'none';

    App.openModal('modal-estoque');
  },

  popularProdutosEstabelecidos(valorAtual = '') {
    const produtos = StorageService.getProdutosEstabelecidos() || [];
    const sel = document.getElementById('est-form-produto-estabelecido');
    if (sel) {
      sel.innerHTML = `<option value="">📋 Produtos Estabelecidos (${produtos.length})...</option>` +
        produtos.map(p => `<option value="${App.escapeHtml(p)}" ${p === valorAtual ? 'selected' : ''}>${App.escapeHtml(p)}</option>`).join('');
    }
    const dl = document.getElementById('est-produtos-estabelecidos-list');
    if (dl) {
      dl.innerHTML = produtos.map(p => `<option value="${App.escapeHtml(p)}"></option>`).join('');
    }
  },

  selecionarProdutoEstabelecido(valor) {
    if (!valor) return;
    const nomeInput = document.getElementById('est-form-nome');
    if (nomeInput) {
      nomeInput.value = valor;
    }
  },

  openEditModal(id) {
    const item = StorageService.get('estoque').find(i => i.id === id);
    if (!item) return;

    document.getElementById('est-modal-title').textContent = 'Editar Item de Estoque';
    document.getElementById('est-form-id').value = item.id;
    const secaoEl = document.getElementById('est-form-secao');
    if (secaoEl) secaoEl.value = item.secao === 'outros' ? 'outros' : 'materia_prima';
    document.getElementById('est-form-nome').value = item.nome || '';
    this.popularProdutosEstabelecidos(item.nome || '');

    // Popula categorias cadastradas dinamicamente
    const catSelect = document.getElementById('est-form-categoria');
    if (catSelect) {
      const cats = StorageService.getCategoriasProducao();
      catSelect.innerHTML = cats.map(c => `<option value="${App.escapeHtml(c)}">${App.escapeHtml(c)}</option>`).join('');
      catSelect.value = item.categoria || cats[0] || '3D';
    }

    // Popula cores cadastradas dinamicamente
    const corSelect = document.getElementById('est-form-cor');
    if (corSelect) {
      const cores = StorageService.getCoresDisponiveis();
      corSelect.innerHTML = `<option value="">(Sem cor / Padrão)</option>` + 
        cores.map(c => `<option value="${App.escapeHtml(c)}">${App.escapeHtml(c)}</option>`).join('');
      corSelect.value = item.cor || '';
    }

    document.getElementById('est-form-unidade').value = item.unidade || 'un';
    document.getElementById('est-form-qtd').value = item.quantidade_atual || 0;
    document.getElementById('est-form-minimo').value = item.estoque_minimo || 0;
    document.getElementById('est-form-custo').value = item.custo_unitario || 0;
    document.getElementById('est-form-data-compra').value = item.data_ultima_compra || '';
    document.getElementById('est-form-ativo').checked = item.ativo !== false;
    document.getElementById('est-btn-delete').style.display = 'inline-block';

    App.openModal('modal-estoque');
  },

  save() {
    const id = document.getElementById('est-form-id').value;
    const secao = document.getElementById('est-form-secao')?.value || 'materia_prima';
    const nome = document.getElementById('est-form-nome').value.trim();
    const categoria = document.getElementById('est-form-categoria').value;
    const cor = document.getElementById('est-form-cor')?.value || '';
    const unidade = document.getElementById('est-form-unidade').value;
    const qtd = parseFloat(document.getElementById('est-form-qtd').value) || 0;
    const minimo = parseFloat(document.getElementById('est-form-minimo').value) || 0;
    const custo = parseFloat(document.getElementById('est-form-custo').value) || 0;
    const dataCompra = document.getElementById('est-form-data-compra')?.value || '';
    const ativo = document.getElementById('est-form-ativo').checked;

    if (!nome) {
      App.toast('Por favor, informe o nome do material.', 'error');
      return;
    }

    const payload = {
      secao,
      nome,
      categoria,
      cor,
      unidade,
      quantidade_atual: qtd,
      estoque_minimo: minimo,
      custo_unitario: custo,
      data_ultima_compra: dataCompra,
      ativo
    };

    if (id) {
      StorageService.update('estoque', id, payload);
      App.toast('Item de estoque atualizado!', 'success');
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
