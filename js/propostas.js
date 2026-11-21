/**
 * SEVEN PERSONALIZADOS — MÓDULO DE ORÇAMENTOS & PROPOSTAS COMERCIAIS
 * Criação, edição e gestão de orçamentos com itens.
 * - Os orçamentos permanecem nesta aba aguardando aprovação.
 * - Ao serem aprovados, eles SAEM da aba de Orçamentos e são movidos para Encomendas na subaba "Fila de Espera".
 */

let propostaItensTemp = [];
let propostaFotoTemp = { dataUrl: '', nome: '' };

const PropostasModule = {
  init() {
    this.renderList();
    window.addEventListener('seven_data_updated', (e) => {
      if (!e.detail || e.detail?.table === 'propostas') {
        this.renderList();
      }
    });
  },

  renderList() {
    const propostas = StorageService.get('propostas') || [];

    // Considera apenas orçamentos em aberto (não aprovados)
    const pendentes = propostas.filter(p => !p.status || !p.status.toLowerCase().includes('aprovad'));

    // Atualiza contadores
    const pendQtdEl = document.getElementById('propostas-pendentes-qtd');
    if (pendQtdEl) pendQtdEl.textContent = pendentes.length;

    const totalBadge = document.getElementById('propostas-total-badge');
    if (totalBadge) totalBadge.textContent = pendentes.length;

    if (typeof App !== 'undefined' && App.updateBadges) {
      App.updateBadges();
    }

    const container = document.getElementById('propostas-cards-container');
    if (!container) return;

    if (pendentes.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 48px 20px; color: var(--text-muted);">
          <div style="font-size: 2.2rem; margin-bottom: 12px;">📑</div>
          <h4 style="color: var(--text-primary); margin-bottom: 6px;">Nenhum orçamento em aberto</h4>
          <p style="font-size: 0.88rem; max-width: 480px; margin: 0 auto 16px auto;">
            Todos os orçamentos foram aprovados e movidos para a <strong>Fila de Espera</strong> em Encomendas, ou nenhum foi criado ainda.
          </p>
          <button class="btn btn-primary" onclick="PropostasModule.openNewModal()">
            <span>+</span> Novo Orçamento
          </button>
        </div>
      `;
      return;
    }

    // Filtro por termo de busca
    const termoBusca = (document.getElementById('prop-filtro-busca')?.value || '').toLowerCase().trim();

    let filtradas = [...pendentes];
    if (termoBusca) {
      filtradas = filtradas.filter(p =>
        (p.cliente || '').toLowerCase().includes(termoBusca) ||
        (p.titulo || '').toLowerCase().includes(termoBusca) ||
        (p.telefone || '').includes(termoBusca)
      );
    }

    if (filtradas.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px; color: var(--text-muted);">
          <div style="font-size: 1.8rem; margin-bottom: 8px;">🔍</div>
          <div style="font-size: 0.95rem;">Nenhum orçamento em aberto localizado para esta busca.</div>
        </div>
      `;
      return;
    }

    // Ordena do mais recente para o mais antigo
    filtradas.sort((a, b) => ((b.criada_em || '') > (a.criada_em || '') ? 1 : -1));

    container.innerHTML = filtradas.map(p => {
      const itensList = (p.itens && p.itens.length > 0) ? p.itens : [];
      const multiItens = itensList.length > 1;
      const hasItemPhotos = itensList.some(i => i.foto_anexo);
      const coresList = [...new Set(itensList.filter(i => i.cor).map(i => i.cor))];

      const itensHtml = itensList.length > 0
        ? itensList.map((i, idx) => {
            const corStr = i.cor ? ` <span style="color: #38bdf8;">[${App.escapeHtml(i.cor)}]</span>` : '';
            const thumbHtml = i.foto_anexo
              ? `
                <div onclick="event.stopPropagation(); App.openOrderItemPhoto('propostas', '${p.id}', ${idx})" title="Foto de ${App.escapeHtml(i.produto_nome || 'Item')} — Clique para ampliar e baixar"
                     style="flex-shrink: 0; position: relative; cursor: pointer;">
                  <img src="${i.foto_anexo}" alt="Anexo Item ${idx + 1}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 7px; border: 1.5px solid rgba(56, 189, 248, 0.6); box-shadow: 0 2px 8px rgba(0,0,0,0.35); display: block;">
                  <span style="position: absolute; right: 2px; bottom: 2px; background: rgba(15, 23, 42, 0.88); border: 1px solid rgba(56,189,248,0.65); border-radius: 999px; font-size: 0.54rem; line-height: 1; padding: 2px 3px;">🔍</span>
                </div>
              `
              : '';
            const descParts = [];
            if (i.personalizacao && i.personalizacao.trim()) {
              descParts.push(`<div style="font-size: 0.77rem; color: #e2e8f0; margin-top: 3px; white-space: pre-line; line-height: 1.4;">${App.escapeHtml(i.personalizacao.trim())}</div>`);
            }
            if (i.observacao && i.observacao.trim()) {
              descParts.push(`<div style="font-size: 0.73rem; color: #fbbf24; margin-top: 2px;">Obs: ${App.escapeHtml(i.observacao.trim())}</div>`);
            }

            if (multiItens) {
              return `
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(148, 163, 184, 0.22); border-radius: 8px; padding: 9px 11px;">
                  <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                      <span style="font-size: 0.64rem; font-weight: 800; color: #38bdf8; background: rgba(56, 189, 248, 0.14); border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 999px; padding: 1px 6px;">#${idx + 1}</span>
                      <span><strong>${i.quantidade}x</strong> ${App.escapeHtml(i.produto_nome || 'Item')}${corStr}</span>
                    </div>
                    ${descParts.join('')}
                  </div>
                  ${thumbHtml}
                </div>
              `;
            }

            return `
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                <div style="flex: 1; min-width: 0;">
                  <div>• <strong>${i.quantidade}x</strong> ${App.escapeHtml(i.produto_nome || 'Item')}${corStr}</div>
                  ${descParts.join('')}
                </div>
                ${thumbHtml}
              </div>
            `;
          }).join('')
        : `<div style="color: var(--text-muted);">${App.escapeHtml(p.escopo || 'Itens personalizados')}</div>`;

      return `
        <div class="panel-box" style="margin-bottom: 0; display: flex; flex-direction: column; justify-content: space-between; border-color: rgba(245, 158, 11, 0.45); box-shadow: 0 4px 18px rgba(245, 158, 11, 0.08);">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; gap: 8px; flex-wrap: wrap;">
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <span class="status-badge" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.5);">
                  ⏳ Aguardando Aprovação
                </span>
                ${p.categoria ? `
                  <span class="badge-cor-tag" style="background: rgba(0, 168, 243, 0.16); color: #38bdf8; border: 1px solid rgba(0, 168, 243, 0.45); font-size: 0.72rem; padding: 2px 8px; border-radius: 999px;">
                    🏷️ ${App.escapeHtml(p.categoria)}
                  </span>
                ` : ''}
              </div>
              <span style="font-size: 0.75rem; color: var(--text-muted);">${App.formatDate(p.criada_em)}</span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
              <div style="flex: 1; min-width: 0;">
                <h4 style="font-family: var(--font-display); font-size: 1.1rem; color: var(--text-primary); margin: 6px 0 4px 0;">
                  ${App.escapeHtml(p.titulo || 'Orçamento Comercial')}
                </h4>
                <div style="font-size: 0.86rem; color: var(--accent); margin-bottom: 8px; font-weight: 600;">
                  👤 Cliente: ${App.escapeHtml(p.cliente)} ${p.telefone ? `<span style="color: var(--text-muted); font-size: 0.78rem;">(${App.escapeHtml(p.telefone)})</span>` : ''}
                </div>
              </div>
              ${(p.foto_anexo && !hasItemPhotos) ? `
                <div onclick="event.stopPropagation(); App.openOrderPhoto('propostas', '${p.id}')" title="Clique para ver a foto em tela cheia e baixar"
                     style="flex-shrink: 0; position: relative; cursor: pointer; margin-top: 4px;">
                  <img src="${p.foto_anexo}" alt="Anexo" style="width: 48px; height: 48px; object-fit: cover; border-radius: 8px; border: 1.5px solid rgba(56, 189, 248, 0.55); box-shadow: 0 2px 8px rgba(0,0,0,0.35); display: block;">
                  <span style="position: absolute; right: -4px; bottom: -4px; background: #0f172a; border: 1px solid rgba(56,189,248,0.6); border-radius: 999px; font-size: 0.62rem; padding: 1px 4px;">🔍</span>
                </div>
              ` : ''}
            </div>

            <div style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.45; margin-bottom: 14px; background: rgba(255,255,255,0.02); padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; gap: 6px; flex-wrap: wrap;">
                <span style="font-size: 0.70rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Itens Orçados:</span>
                ${coresList.length > 0 ? `
                  <span class="badge-cor-tag" style="font-size: 0.70rem; padding: 1px 7px;" title="Cores: ${coresList.join(', ')}">
                    🎨 ${App.escapeHtml(coresList.join(', '))}
                  </span>
                ` : ''}
              </div>
              <div style="display: flex; flex-direction: column; gap: 8px; overflow: visible;">
                ${itensHtml}
              </div>
            </div>
          </div>

          <div style="border-top: 1px solid var(--border); padding-top: 14px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
            <div>
              <div style="font-size: 0.70rem; color: var(--text-muted);">Investimento Total</div>
              <div style="font-size: 1.18rem; font-weight: 700; color: var(--text-primary);">${App.formatMoney(p.investimento)}</div>
            </div>

            <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
              <button class="btn" onclick="PropostasModule.enviarWhatsApp('${p.id}')" title="Encaminhar orçamento via WhatsApp para o cliente" style="padding: 6px 12px; font-size: 0.78rem; background: #25d366; border-color: #25d366; color: #ffffff; font-weight: 700; display: inline-flex; align-items: center; gap: 5px; box-shadow: 0 2px 8px rgba(37, 211, 102, 0.25);">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                WhatsApp
              </button>
              <button class="btn btn-primary" onclick="PropostasModule.aprovarProposta('${p.id}')" title="Aprovar orçamento e mover para a Fila de Espera" style="padding: 6px 12px; font-size: 0.78rem; background: #10b981; border-color: #10b981; font-weight: 600;">
                ✅ Aprovar
              </button>
              <button class="btn btn-secondary btn-icon" onclick="PropostasModule.openEditModal('${p.id}')" style="padding: 6px 8px; font-size: 0.78rem;" title="Editar orçamento">
                ✏️
              </button>
              <button class="btn btn-secondary" onclick="PropostasModule.visualizarProposta('${p.id}')" style="padding: 6px 10px; font-size: 0.78rem;" title="Visualizar orçamento formatado / PDF">
                📄 Ver
              </button>
              <button class="btn btn-secondary btn-icon" onclick="PropostasModule.deleteProposta('${p.id}')" title="Excluir orçamento">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  openNewModal() {
    document.getElementById('prop-form-id').value = '';
    const titleEl = document.getElementById('prop-modal-title');
    if (titleEl) titleEl.textContent = 'Novo Orçamento Comercial';

    document.getElementById('prop-cliente').value = '';
    document.getElementById('prop-contato').value = '';
    document.getElementById('prop-telefone').value = '';

    // Popula categorias cadastradas dinamicamente (igual na Nova Encomenda)
    const catSelect = document.getElementById('prop-categoria');
    if (catSelect) {
      const cats = StorageService.getCategoriasProducao();
      catSelect.innerHTML = cats.map(c => `<option value="${App.escapeHtml(c)}">${App.escapeHtml(c)}</option>`).join('');
      catSelect.value = cats[0] || '3D';
    }

    const padroes = StorageService.getPadroesOrcamentoPedido();
    const hojeIso = new Date().toISOString().split('T')[0];
    const diasEntrega = parseInt(padroes.pedido_dias_entrega, 10);
    const dias = Number.isFinite(diasEntrega) && diasEntrega >= 0 ? diasEntrega : 5;
    const dataEntregaSug = new Date(Date.now() + dias * 24 * 3600 * 1000).toISOString().split('T')[0];

    document.getElementById('prop-titulo').value = padroes.orcamento_titulo || '';
    document.getElementById('prop-data-orcamento').value = hojeIso;
    document.getElementById('prop-data-confirmacao').value = '';
    document.getElementById('prop-data-entrega').value = dataEntregaSug;
    document.getElementById('prop-escopo').value = padroes.orcamento_escopo || '';
    document.getElementById('prop-metodo').value = padroes.orcamento_metodo || '';
    document.getElementById('prop-prazo').value = padroes.orcamento_prazo || '';
    document.getElementById('prop-condicoes').value = padroes.orcamento_condicoes || '';

    propostaFotoTemp = { dataUrl: '', nome: '' };
    this.renderFotoPreview();

    propostaItensTemp = [
      {
        produto_nome: '',
        cor: '',
        personalizacao: '',
        observacao: '',
        quantidade: 1,
        preco_unitario: 0,
        subtotal: 0,
        foto_anexo: '',
        foto_nome: ''
      }
    ];

    this.renderItensTable();
    App.openModal('modal-proposta');
  },

  openEditModal(id) {
    const p = StorageService.get('propostas').find(item => item.id === id);
    if (!p) return;

    document.getElementById('prop-form-id').value = p.id;
    const titleEl = document.getElementById('prop-modal-title');
    if (titleEl) titleEl.textContent = 'Editar Orçamento Comercial';

    document.getElementById('prop-cliente').value = p.cliente || '';
    document.getElementById('prop-contato').value = p.contato || '';
    document.getElementById('prop-telefone').value = p.telefone || '';

    // Popula categorias cadastradas dinamicamente (igual na Nova Encomenda)
    const catSelect = document.getElementById('prop-categoria');
    if (catSelect) {
      const cats = StorageService.getCategoriasProducao();
      catSelect.innerHTML = cats.map(c => `<option value="${App.escapeHtml(c)}">${App.escapeHtml(c)}</option>`).join('');
      catSelect.value = p.categoria || cats[0] || '3D';
    }

    document.getElementById('prop-titulo').value = p.titulo || '';
    document.getElementById('prop-data-orcamento').value = p.data_orcamento || (p.criada_em ? p.criada_em.split('T')[0] : '');
    document.getElementById('prop-data-confirmacao').value = p.data_confirmacao || '';
    document.getElementById('prop-data-entrega').value = p.data_entrega || '';
    document.getElementById('prop-escopo').value = p.escopo || '';
    document.getElementById('prop-metodo').value = p.metodo || '';
    document.getElementById('prop-prazo').value = p.prazo || '';
    document.getElementById('prop-condicoes').value = p.condicoes || '';

    propostaFotoTemp = {
      dataUrl: p.foto_anexo || '',
      nome: p.foto_nome || (p.foto_anexo ? 'anexo-orcamento.jpg' : '')
    };
    this.renderFotoPreview();

    propostaItensTemp = (p.itens && p.itens.length > 0)
      ? p.itens.map(it => ({
          produto_nome: it.produto_nome || '',
          cor: it.cor || '',
          personalizacao: it.personalizacao || '',
          observacao: it.observacao || it.obs || '',
          quantidade: Number(it.quantidade) || 1,
          preco_unitario: Number(it.preco_unitario) || 0,
          subtotal: Number(it.subtotal) || 0,
          foto_anexo: it.foto_anexo || '',
          foto_nome: it.foto_nome || ''
        }))
      : [
          {
            produto_nome: p.titulo || 'Item Personalizado',
            cor: '',
            personalizacao: p.escopo || '',
            observacao: '',
            quantidade: 1,
            preco_unitario: Number(p.investimento) || 0,
            subtotal: Number(p.investimento) || 0,
            foto_anexo: p.foto_anexo || '',
            foto_nome: p.foto_nome || ''
          }
        ];

    this.renderItensTable();
    App.openModal('modal-proposta');
  },

  addItemRow() {
    propostaItensTemp.push({
      produto_nome: '',
      cor: '',
      personalizacao: '',
      observacao: '',
      quantidade: 1,
      preco_unitario: 0,
      subtotal: 0,
      foto_anexo: '',
      foto_nome: ''
    });
    this.renderItensTable();
  },

  async onItemFotoSelected(idx, input) {
    const file = input?.files?.[0];
    if (!file || !propostaItensTemp[idx]) return;
    try {
      const res = await App.compressImageFile(file);
      propostaItensTemp[idx].foto_anexo = res.dataUrl;
      propostaItensTemp[idx].foto_nome = res.nome;
      this.renderItensTable();
      App.toast(`Foto anexada ao Item #${idx + 1}! 📷`, 'success');
    } catch (err) {
      console.error('Erro ao anexar foto ao item:', err);
      App.toast('Não foi possível carregar a imagem.', 'error');
    }
    input.value = '';
  },

  abrirItemFotoPreview(idx) {
    const it = propostaItensTemp[idx];
    if (!it || !it.foto_anexo) return;
    App.openImageLightbox(it.foto_anexo, it.produto_nome || `Item #${idx + 1}`, it.foto_nome || `anexo-item-${idx + 1}.jpg`);
  },

  removerItemFoto(idx) {
    if (!propostaItensTemp[idx]) return;
    propostaItensTemp[idx].foto_anexo = '';
    propostaItensTemp[idx].foto_nome = '';
    this.renderItensTable();
  },

  removeItemRow(index) {
    if (propostaItensTemp.length > 1) {
      propostaItensTemp.splice(index, 1);
      this.renderItensTable();
    }
  },

  updateItemField(index, field, value) {
    const item = propostaItensTemp[index];
    if (!item) return;
    item[field] = value;
    if (field === 'produto_nome') {
      const titleEl = document.getElementById(`prop-item-title-${index}`);
      if (titleEl) {
        titleEl.textContent = value.trim() || 'Selecione ou digite o produto';
      }
    }
  },

  updateItemCalc(index, field, value) {
    const item = propostaItensTemp[index];
    if (!item) return;
    item[field] = value;
    const q = Number(item.quantidade) || 0;
    const p = Number(item.preco_unitario) || 0;
    item.subtotal = q * p;

    const subtotalEl = document.getElementById(`prop-item-subtotal-${index}`);
    if (subtotalEl) {
      subtotalEl.textContent = App.formatMoney(item.subtotal);
    }

    const total = propostaItensTemp.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);
    const totalEl = document.getElementById('prop-itens-total-badge');
    if (totalEl) totalEl.textContent = App.formatMoney(total);
    const invInput = document.getElementById('prop-investimento');
    if (invInput) invInput.value = total;
  },

  renderItensTable() {
    const container = document.getElementById('prop-itens-container') || document.getElementById('prop-itens-tbody');
    if (!container) return;

    // Atualiza opções do datalist com produtos estabelecidos (igual na Nova Encomenda)
    const datalist = document.getElementById('prop-datalist-produtos');
    if (datalist) {
      const prodsEstabelecidos = StorageService.getProdutosEstabelecidos();
      const estoqueItens = StorageService.get('estoque') || [];
      const opcoesUnicas = new Set();
      let optionsHtml = '';
      prodsEstabelecidos.forEach(p => {
        const nome = typeof p === 'object' ? p.nome : p;
        if (nome && !opcoesUnicas.has(nome)) {
          opcoesUnicas.add(nome);
          optionsHtml += `<option value="${App.escapeHtml(nome)}">`;
        }
      });
      estoqueItens.forEach(e => {
        if (e.nome && !opcoesUnicas.has(e.nome)) {
          opcoesUnicas.add(e.nome);
          optionsHtml += `<option value="${App.escapeHtml(e.nome)}">`;
        }
      });
      datalist.innerHTML = optionsHtml;
    }

    // Cores pré-programadas do sistema (igual na Nova Encomenda)
    const coresDisponiveis = StorageService.getCoresDisponiveis();

    let total = 0;

    container.innerHTML = propostaItensTemp.map((item, idx) => {
      total += (Number(item.subtotal) || 0);
      const corAtual = item.cor || '';

      return `
        <div class="prop-item-card" style="background: rgba(255, 255, 255, 0.025); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 14px 16px; margin-bottom: 14px; box-shadow: 0 4px 14px rgba(0,0,0,0.25);">
          <!-- Topo do Item -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; margin-bottom: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.07);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; padding: 2px 8px; border-radius: 999px; background: rgba(0, 168, 243, 0.18); color: #38bdf8; border: 1px solid rgba(0, 168, 243, 0.45);">
                Item #${idx + 1}
              </span>
              <span id="prop-item-title-${idx}" style="font-size: 0.84rem; font-weight: 600; color: #ffffff;">
                ${App.escapeHtml(item.produto_nome || 'Selecione ou digite o produto')}
              </span>
            </div>
            ${propostaItensTemp.length > 1 ? `
              <button type="button" style="display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; flex-shrink: 0; background: rgba(239, 68, 68, 0.14); border: 1px solid rgba(239, 68, 68, 0.45); color: #f87171; cursor: pointer; padding: 5px 10px; border-radius: 6px; font-size: 0.76rem; font-weight: 600;" 
                      onclick="PropostasModule.removeItemRow(${idx})" title="Remover este item">
                ✕ Excluir Item
              </button>
            ` : ''}
          </div>

          <!-- Linha 1: Produto Pré-programado e Cor Pré-programada -->
          <div class="form-row" style="margin-bottom: 10px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 0.78rem; font-weight: 600; color: var(--text-primary);">Produto *</label>
              <input type="text" list="prop-datalist-produtos" class="form-control" style="height: 38px;" 
                     value="${App.escapeHtml(item.produto_nome || '')}" 
                     placeholder="Selecione da lista ou digite..." 
                     oninput="PropostasModule.updateItemField(${idx}, 'produto_nome', this.value)">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 0.78rem; font-weight: 600; color: var(--text-primary);">Cor</label>
              <select class="form-control" style="height: 38px;" 
                      onchange="PropostasModule.updateItemField(${idx}, 'cor', this.value)">
                <option value="">(Sem cor / Padrão)</option>
                ${coresDisponiveis.map(c => `
                  <option value="${App.escapeHtml(c)}" ${c === corAtual ? 'selected' : ''}>
                    ${App.escapeHtml(c)}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- Linha 2: Personalização / Detalhes (campo amplo multi-linha) -->
          <div class="form-group" style="margin-bottom: 10px;">
            <label style="font-size: 0.78rem; font-weight: 600; color: var(--text-primary);">Personalização / Detalhes</label>
            <textarea class="form-control" rows="3" style="min-height: 82px; resize: vertical; line-height: 1.45;" 
                      placeholder="Ex: Nome da Aniversariante, Frase, Logo, Fonte, Medidas, Posição da gravação..." 
                      oninput="PropostasModule.updateItemField(${idx}, 'personalizacao', this.value)">${App.escapeHtml(item.personalizacao || '')}</textarea>
          </div>

          <!-- Linha 2B: Observação do Item -->
          <div class="form-group" style="margin-bottom: 10px;">
            <label style="font-size: 0.78rem; font-weight: 600; color: var(--text-primary);">Observação do Item</label>
            <input type="text" class="form-control" style="height: 38px;" 
                   value="${App.escapeHtml(item.observacao || '')}" 
                   placeholder="Ex: Acabamento especial, tamanho, embalagem..." 
                   oninput="PropostasModule.updateItemField(${idx}, 'observacao', this.value)">
          </div>

          <!-- Linha 2C: Foto / Arte de Referência individual deste Item -->
          <div class="form-group" style="margin-bottom: 12px;">
            <label style="font-size: 0.78rem; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 5px;">
              <span>📷</span> Foto / Arte de Referência (Item #${idx + 1})
            </label>
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; background: rgba(255,255,255,0.02); border: 1px dashed rgba(56, 189, 248, 0.35); border-radius: 6px; padding: 8px 10px;">
              <input type="file" id="prop-item-foto-input-${idx}" accept="image/*" style="display: none;" onchange="PropostasModule.onItemFotoSelected(${idx}, this)">
              <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('prop-item-foto-input-${idx}').click()" style="font-size: 0.76rem; padding: 5px 10px;">
                📎 ${item.foto_anexo ? 'Trocar Foto' : 'Inserir Foto'}
              </button>
              ${item.foto_anexo ? `
                <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 160px;">
                  <img src="${item.foto_anexo}" alt="Referência Item #${idx + 1}" onclick="PropostasModule.abrirItemFotoPreview(${idx})" title="Clique para ampliar em tela cheia e baixar"
                       style="width: 42px; height: 42px; object-fit: cover; border-radius: 6px; border: 1.5px solid rgba(56, 189, 248, 0.55); cursor: pointer;">
                  <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 0.74rem; color: #ffffff; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${App.escapeHtml(item.foto_nome || 'foto-anexo.jpg')}</div>
                    <div style="font-size: 0.66rem; color: var(--text-muted);">Clique na foto para ampliar</div>
                  </div>
                  <button type="button" class="btn btn-secondary btn-icon" onclick="PropostasModule.removerItemFoto(${idx})" title="Remover foto deste item" style="padding: 4px 7px; color: #f87171;">
                    🗑️
                  </button>
                </div>
              ` : `
                <span style="font-size: 0.73rem; color: var(--text-muted);">Opcional — arte ou foto de referência exclusiva deste item</span>
              `}
            </div>
          </div>

          <!-- Linha 3: Quantidade, Valor Unitário e Subtotal -->
          <div class="form-row" style="margin-bottom: 0; align-items: flex-end;">
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 0.78rem; font-weight: 600; color: var(--text-primary);">Quantidade</label>
              <input type="number" min="1" class="form-control" style="height: 38px;" 
                     value="${item.quantidade || 1}" 
                     oninput="PropostasModule.updateItemCalc(${idx}, 'quantidade', this.value)">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 0.78rem; font-weight: 600; color: var(--text-primary);">Valor Unitário (R$)</label>
              <input type="number" step="0.5" class="form-control" style="height: 38px;" 
                     value="${item.preco_unitario || 0}" 
                     oninput="PropostasModule.updateItemCalc(${idx}, 'preco_unitario', this.value)">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 0.78rem; font-weight: 600; color: var(--text-primary);">Subtotal</label>
              <div id="prop-item-subtotal-${idx}" style="height: 38px; display: flex; align-items: center; font-size: 1.05rem; font-weight: 700; color: #34d399; background: rgba(0,0,0,0.25); border: 1px solid var(--border); border-radius: 6px; padding: 0 12px;">
                ${App.formatMoney(item.subtotal || 0)}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const totalBadge = document.getElementById('prop-itens-total-badge');
    if (totalBadge) totalBadge.textContent = App.formatMoney(total);

    const invInput = document.getElementById('prop-investimento');
    if (invInput) invInput.value = total;
  },

  save(aprovarDireto = false) {
    const idExistente = document.getElementById('prop-form-id')?.value;
    const cliente = document.getElementById('prop-cliente').value.trim();
    const contato = document.getElementById('prop-contato').value.trim();
    const telefone = document.getElementById('prop-telefone').value.trim();
    const categoria = document.getElementById('prop-categoria')?.value || '3D';
    const titulo = document.getElementById('prop-titulo').value.trim();
    const data_orcamento = document.getElementById('prop-data-orcamento')?.value || new Date().toISOString().split('T')[0];
    const data_confirmacao = document.getElementById('prop-data-confirmacao')?.value || '';
    const data_entrega = document.getElementById('prop-data-entrega')?.value || '';
    const escopo = document.getElementById('prop-escopo').value.trim();
    const metodo = document.getElementById('prop-metodo').value.trim();
    const prazo = document.getElementById('prop-prazo').value.trim();
    const condicoes = document.getElementById('prop-condicoes').value.trim();

    const investimentoTotal = propostaItensTemp.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);

    if (!cliente) {
      App.toast('Por favor, informe o cliente do orçamento.', 'error');
      return;
    }

    if (investimentoTotal <= 0) {
      App.toast('Adicione ao menos um item com valor no orçamento.', 'error');
      return;
    }

    const payload = {
      cliente,
      contato,
      telefone,
      categoria,
      titulo: titulo || 'Orçamento de Produtos Personalizados',
      data_orcamento,
      data_confirmacao,
      data_entrega,
      escopo,
      metodo,
      prazo: prazo || '5 a 7 dias úteis',
      investimento: investimentoTotal,
      condicoes,
      status: 'Aguardando Aprovação',
      foto_anexo: propostaFotoTemp.dataUrl || null,
      foto_nome: propostaFotoTemp.nome || null,
      itens: JSON.parse(JSON.stringify(propostaItensTemp))
    };

    App.closeModal('modal-proposta');

    if (aprovarDireto === true) {
      // Vai direto para a Fila de Espera em Encomendas SEM inserir em "propostas"
      // (Se estava editando um orçamento já salvo, remove o antigo de "propostas")
      this.converterParaEncomenda(payload, idExistente || null);
    } else {
      if (idExistente) {
        StorageService.update('propostas', idExistente, payload);
      } else {
        payload.criada_em = new Date().toISOString();
        StorageService.insert('propostas', payload);
      }
      App.toast('Orçamento salvo com sucesso! Permanece na aba Orçamentos até ser aprovado.', 'success');
      this.renderList();
    }
  },

  aprovarProposta(id) {
    const p = StorageService.get('propostas').find(item => item.id === id);
    if (!p) return;
    this.converterParaEncomenda(p, id);
  },

  async onFotoSelected(input) {
    const file = input?.files?.[0];
    if (!file) return;
    try {
      const res = await App.compressImageFile(file);
      propostaFotoTemp = res;
      this.renderFotoPreview();
      App.toast('Foto anexada ao orçamento! 📷', 'success');
    } catch (err) {
      console.error('Erro ao processar foto do orçamento:', err);
      App.toast('Não foi possível carregar a imagem.', 'error');
    }
    input.value = '';
  },

  renderFotoPreview() {
    const box = document.getElementById('prop-foto-preview-box');
    const img = document.getElementById('prop-foto-preview-img');
    const nome = document.getElementById('prop-foto-preview-nome');
    const hint = document.getElementById('prop-foto-empty-hint');

    if (propostaFotoTemp.dataUrl) {
      if (img) img.src = propostaFotoTemp.dataUrl;
      if (nome) nome.textContent = propostaFotoTemp.nome || 'anexo.jpg';
      if (box) box.style.display = 'flex';
      if (hint) hint.style.display = 'none';
    } else {
      if (img) img.src = '';
      if (box) box.style.display = 'none';
      if (hint) hint.style.display = 'inline';
    }
  },

  abrirFotoPreview() {
    if (!propostaFotoTemp.dataUrl) return;
    App.openImageLightbox(propostaFotoTemp.dataUrl, propostaFotoTemp.nome || 'Foto do Orçamento', propostaFotoTemp.nome || 'anexo-orcamento.jpg');
  },

  removerFoto() {
    propostaFotoTemp = { dataUrl: '', nome: '' };
    this.renderFotoPreview();
  },

  converterParaEncomenda(p, idPropostaParaExcluir = null) {
    // Calcula prazo padrão de entrega (7 dias à frente)
    const dataEntregaDefault = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0];

    const itensEncomenda = (p.itens && p.itens.length > 0)
      ? p.itens.map(it => ({
          produto_nome: it.produto_nome || '',
          cor: it.cor || '',
          personalizacao: it.personalizacao || '',
          observacao: it.observacao || '',
          quantidade: Number(it.quantidade) || 1,
          preco_unitario: Number(it.preco_unitario) || 0,
          subtotal: Number(it.subtotal) || 0,
          foto_anexo: it.foto_anexo || '',
          foto_nome: it.foto_nome || ''
        }))
      : [{
          produto_nome: p.titulo || 'Pedido Personalizado',
          cor: '',
          personalizacao: p.escopo || '',
          observacao: '',
          quantidade: 1,
          preco_unitario: Number(p.investimento) || 0,
          subtotal: Number(p.investimento) || 0,
          foto_anexo: p.foto_anexo || '',
          foto_nome: p.foto_nome || ''
        }];

    const hojeIso = new Date().toISOString().split('T')[0];
    const novaEncomenda = {
      cliente_nome: p.cliente,
      categoria: p.categoria || '3D',
      telefone: p.telefone || p.contato || '',
      data_orcamento: p.data_orcamento || (p.criada_em ? p.criada_em.split('T')[0] : hojeIso),
      data_confirmacao: p.data_confirmacao || hojeIso,
      data_pedido: p.data_confirmacao || hojeIso,
      data_entrega_prevista: p.data_entrega || dataEntregaDefault,
      status: 'Fila', // Fila de Espera!
      pagamento_status: 'Pendente',
      forma_pagamento: 'Pix',
      valor_total: Number(p.investimento) || 0,
      valor_pago: 0,
      observacoes: '',
      foto_anexo: p.foto_anexo || null,
      foto_nome: p.foto_nome || null,
      itens: itensEncomenda
    };

    // Dá baixa automática no estoque para os materiais dos itens da encomenda convertida
    const baixas = [];
    if (typeof EncomendasModule !== 'undefined' && EncomendasModule.encontrarItemEstoque) {
      novaEncomenda.itens.forEach(item => {
        const mat = EncomendasModule.encontrarItemEstoque(item.produto_nome, item.cor);
        if (mat) {
          const qtdADeduzir = Number(item.quantidade) || 0;
          const matAtual = StorageService.get('estoque').find(m => m.id === mat.id) || mat;
          const novoSaldo = Math.max(0, Number(matAtual.quantidade_atual) - qtdADeduzir);
          StorageService.update('estoque', mat.id, { quantidade_atual: novoSaldo });
          item.estoque_item_id = mat.id;
          item.estoque_item_nome = mat.nome;
          item.qtd_deduzida_estoque = qtdADeduzir;
          baixas.push(`${qtdADeduzir}x ${mat.nome} (restam ${novoSaldo} ${mat.unidade})`);
        }
      });
      if (baixas.length > 0) {
        window.dispatchEvent(new CustomEvent('seven_data_updated', { detail: { table: 'estoque' } }));
      }
    }

    // 1. Cria a encomenda diretamente na "Fila de Espera"
    StorageService.insert('encomendas', novaEncomenda);

    // 2. Se veio de um orçamento já salvo em "propostas", remove-o para não ficar duplicado em Orçamentos
    if (idPropostaParaExcluir) {
      StorageService.delete('propostas', idPropostaParaExcluir);
    }

    let toastMsg = 'Pedido salvo diretamente na Fila de Espera em Encomendas! 🎉';
    if (baixas.length > 0) {
      toastMsg += ` 📦 Estoque: ${baixas.join(', ')}`;
    }
    App.toast(toastMsg, 'success');
    App.closeModal('modal-preview-proposta');
    App.closeModal('modal-proposta');

    // Atualiza imediatamente a lista da tela de Orçamentos
    this.renderList();

    // Redireciona imediatamente para a tela de Encomendas & Produção na subaba "Fila de Espera"
    setTimeout(() => {
      this.irParaFilaDeEspera();
    }, 350);
  },

  irParaFilaDeEspera() {
    App.navigate('encomendas');

    // Se estiver filtrando apenas finalizadas, restaura a visão principal para exibir a fila
    const filtroStatus = document.getElementById('filtro-enc-status');
    if (filtroStatus && filtroStatus.value === 'Finalizadas') {
      filtroStatus.value = '';
    }

    if (typeof EncomendasModule !== 'undefined' && EncomendasModule.render) {
      EncomendasModule.render();
    }

    // Rola suavemente até o container do grupo "Fila de Espera" e aplica pulso visual
    setTimeout(() => {
      const grupoFila = document.getElementById('grupo-enc-Fila');
      if (grupoFila) {
        grupoFila.scrollIntoView({ behavior: 'smooth', block: 'start' });
        grupoFila.style.transition = 'box-shadow 0.4s ease, border-color 0.4s ease';
        const originalBorder = grupoFila.style.borderColor;
        const originalShadow = grupoFila.style.boxShadow;
        grupoFila.style.borderColor = '#fbbf24';
        grupoFila.style.boxShadow = '0 0 28px rgba(245, 158, 11, 0.5)';
        setTimeout(() => {
          grupoFila.style.borderColor = originalBorder;
          grupoFila.style.boxShadow = originalShadow;
        }, 2200);
      }
    }, 180);
  },

  visualizarProposta(id) {
    const p = StorageService.get('propostas').find(item => item.id === id);
    if (!p) return;

    const config = StorageService.getConfig();
    const viewContainer = document.getElementById('proposta-preview-content');
    const actionsContainer = document.getElementById('preview-modal-actions');
    if (!viewContainer) return;

    // Atualiza botões do cabeçalho do preview
    if (actionsContainer) {
      actionsContainer.innerHTML = `
        <button class="btn" onclick="PropostasModule.enviarWhatsApp('${p.id}')" style="background: #25d366; border-color: #25d366; color: #ffffff; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(37, 211, 102, 0.25);">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          Encaminhar via WhatsApp
        </button>
        <button class="btn btn-primary" onclick="PropostasModule.aprovarProposta('${p.id}')" style="background: #10b981; border-color: #10b981; font-weight: 600;">
          ✅ Aprovar & Mover p/ Fila
        </button>
        <button class="btn btn-secondary" onclick="PropostasModule.imprimirPropostaAtual()">🖨️ Imprimir / PDF</button>
        <button class="btn btn-secondary" onclick="App.closeModal('modal-preview-proposta')">Fechar</button>
      `;
    }

    const itensList = p.itens && p.itens.length > 0 ? p.itens : [];

    viewContainer.innerHTML = `
      <div style="background: #05070b; color: #ffffff; border-bottom: 3px solid #00a8f3; border-radius: 10px; padding: 24px 28px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
        <div>
          <img src="logo.png" alt="${App.escapeHtml(config.nomeEmpresa || 'Seven Personalizados')}" style="height: 46px; width: auto; display: block; margin-bottom: 8px;">
          <p style="color: #94a3b8; font-size: 0.82rem; margin: 0;">${App.escapeHtml(config.slogan || 'Corte a Laser, Impressão 3D e Brindes Especiais')}</p>
        </div>
        <div style="text-align: right; font-size: 0.82rem; color: #e2e8f0; line-height: 1.6;">
          <div><strong style="color: #00a8f3;">WhatsApp:</strong> ${App.escapeHtml(config.telefone || '')}</div>
          <div><strong style="color: #00a8f3;">E-mail:</strong> ${App.escapeHtml(config.email || '')}</div>
          <div><strong style="color: #00a8f3;">Emissão:</strong> ${App.formatDate(p.criada_em)}</div>
          <div><strong style="color: #fbbf24;">Status:</strong> Aguardando Aprovação</div>
        </div>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
        <div style="font-size: 0.76rem; text-transform: uppercase; color: #0284c7; font-weight: 700; letter-spacing: 0.05em;">Orçamento Comercial Preparado Para</div>
        <div style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-top: 4px;">${App.escapeHtml(p.cliente)}</div>
        ${p.contato ? `<div style="font-size: 0.88rem; color: #475569;">A/C: ${App.escapeHtml(p.contato)} ${p.telefone ? `(${p.telefone})` : ''}</div>` : ''}
        ${p.categoria ? `<div style="font-size: 0.82rem; color: #64748b; margin-top: 4px;">Categoria de Produção: <strong style="color: #0284c7;">${App.escapeHtml(p.categoria)}</strong></div>` : ''}
      </div>

      <div style="margin-bottom: 24px;">
        <h3 style="color: #0f172a; font-size: 1.05rem; margin-bottom: 8px; border-left: 4px solid #00a8f3; padding-left: 10px;">1. Objetivo e Escopo da Solução</h3>
        <p style="color: #334155; font-size: 0.95rem; line-height: 1.6; white-space: pre-line;">${App.escapeHtml(p.escopo)}</p>
      </div>

      <!-- TABELA DE ITENS DETALHADOS NO PDF/IMPRESSÃO -->
      ${itensList.length > 0 ? `
        <div style="margin-bottom: 28px;">
          <h3 style="color: #0f172a; font-size: 1.05rem; margin-bottom: 10px; border-left: 4px solid #00a8f3; padding-left: 10px;">
            2. Itens do Orçamento & Especificações Técnicas
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 0.88rem; margin-top: 8px;">
            <thead>
              <tr style="background: #f1f5f9; color: #334155; text-align: left; border-bottom: 2px solid #cbd5e1;">
                <th style="padding: 10px 12px;">Produto / Item</th>
                <th style="padding: 10px 12px; width: 100px;">Cor</th>
                <th style="padding: 10px 12px;">Personalização & Detalhes</th>
                <th style="padding: 10px 12px; text-align: center; width: 60px;">Qtd</th>
                <th style="padding: 10px 12px; text-align: right; width: 100px;">Valor Unit.</th>
                <th style="padding: 10px 12px; text-align: right; width: 110px;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itensList.map(item => `
                <tr style="border-bottom: 1px solid #e2e8f0; color: #1e293b;">
                  <td style="padding: 10px 12px; font-weight: 600;">${App.escapeHtml(item.produto_nome || 'Item')}</td>
                  <td style="padding: 10px 12px; color: #0284c7; font-weight: 600;">${item.cor ? App.escapeHtml(item.cor) : '<span style="color:#94a3b8;">—</span>'}</td>
                  <td style="padding: 10px 12px; color: #475569;">
                    ${App.escapeHtml(item.personalizacao || 'Padrão')}
                    ${item.observacao ? `<br><small style="color: #64748b; font-style: italic;">Obs: ${App.escapeHtml(item.observacao)}</small>` : ''}
                  </td>
                  <td style="padding: 10px 12px; text-align: center; font-weight: 600;">${item.quantidade}</td>
                  <td style="padding: 10px 12px; text-align: right;">${App.formatMoney(item.preco_unitario || 0)}</td>
                  <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: #0284c7;">${App.formatMoney(item.subtotal || 0)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background: #f8fafc; border-top: 2px solid #00a8f3;">
                <td colspan="5" style="padding: 12px; font-weight: 700; color: #0f172a; text-align: right; font-size: 0.95rem;">Investimento Total:</td>
                <td style="padding: 12px; font-weight: 800; color: #0284c7; text-align: right; font-size: 1.15rem;">${App.formatMoney(p.investimento)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ` : ''}

      <div style="margin-bottom: 24px;">
        <h3 style="color: #0f172a; font-size: 1.05rem; margin-bottom: 8px; border-left: 4px solid #00a8f3; padding-left: 10px;">3. Nosso Método & Padrão de Entrega</h3>
        <p style="color: #334155; font-size: 0.92rem; line-height: 1.6; white-space: pre-line;">${App.escapeHtml(p.metodo)}</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 28px;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px;">
          <div style="font-size: 0.78rem; font-weight: 700; color: #64748b; text-transform: uppercase;">Prazo de Produção</div>
          <div style="font-size: 1rem; font-weight: 600; color: #0f172a; margin-top: 4px;">⏱️ ${App.escapeHtml(p.prazo)}</div>
        </div>
        <div style="background: #f0f9ff; border: 1px solid #7dd3fc; padding: 16px; border-radius: 8px; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
          <div style="font-size: 0.78rem; font-weight: 700; color: #0284c7; text-transform: uppercase;">Investimento Total</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: #0369a1; margin-top: 2px;">${App.formatMoney(p.investimento)}</div>
        </div>
      </div>

      <div style="margin-bottom: 28px;">
        <h3 style="color: #0f172a; font-size: 1.05rem; margin-bottom: 8px; border-left: 4px solid #00a8f3; padding-left: 10px;">4. Condições de Pagamento</h3>
        <p style="color: #334155; font-size: 0.92rem; line-height: 1.6;">${App.escapeHtml(p.condicoes)}</p>
        ${config.chavePix ? `<p style="margin-top: 8px; font-size: 0.85rem; color: #0369a1; background: #f0f9ff; padding: 8px 12px; border-radius: 6px; border: 1px solid #bae6fd;"><strong>Chave Pix:</strong> ${App.escapeHtml(config.chavePix)}</p>` : ''}
      </div>

      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px dashed #cbd5e1; text-align: center; color: #64748b; font-size: 0.8rem;">
        Seven Personalizados — Excelência, Precisão e Arte em Cada Detalhe.
      </div>
    `;

    App.openModal('modal-preview-proposta');
  },

  deleteProposta(id) {
    if (confirm('Deseja excluir este orçamento?')) {
      StorageService.delete('propostas', id);
      App.toast('Orçamento excluído.', 'info');
      this.renderList();
    }
  },

  imprimirPropostaAtual() {
    window.print();
  },

  enviarWhatsApp(id) {
    const p = StorageService.get('propostas').find(item => item.id === id);
    if (!p) {
      App.toast('Orçamento não localizado.', 'error');
      return;
    }

    const config = StorageService.getConfig();
    const nomeEmpresa = config.nomeEmpresa || 'Seven Personalizados';

    // 1. Obtém telefone do cliente
    let tel = (p.telefone || '').trim();
    if (!tel) {
      tel = prompt(`Informe o WhatsApp de ${p.cliente} com DDD (apenas números):`, '');
      if (!tel || !tel.trim()) {
        App.toast('Envio cancelado: número de WhatsApp não informado.', 'info');
        return;
      }
      p.telefone = tel.trim();
      StorageService.update('propostas', p.id, { telefone: p.telefone });
      this.renderList();
    }

    let foneLimpo = tel.replace(/\D/g, '');
    if (foneLimpo.length === 10 || foneLimpo.length === 11) {
      foneLimpo = '55' + foneLimpo;
    }

    // 2. Detalha os itens orçados
    let itensTexto = '';
    if (p.itens && p.itens.length > 0) {
      itensTexto = p.itens.map(it => {
        const qtd = it.quantidade || 1;
        const nome = it.produto_nome || 'Item Personalizado';
        const cor = it.cor ? ` [Cor: ${it.cor}]` : '';
        const precoUn = it.preco_unitario ? ` (${App.formatMoney(it.preco_unitario)} un)` : '';
        const sub = it.subtotal ? ` = *${App.formatMoney(it.subtotal)}*` : '';
        let lin = `• *${qtd}x ${nome}*${cor}${precoUn}${sub}`;
        if (it.personalizacao && it.personalizacao.trim()) {
          lin += `\n   _Arte / Personalização: ${it.personalizacao.trim()}_`;
        }
        if (it.observacao && it.observacao.trim()) {
          lin += `\n   _Obs: ${it.observacao.trim()}_`;
        }
        return lin;
      }).join('\n');
    } else if (p.escopo) {
      itensTexto = `• ${p.escopo}`;
    }

    // 3. Monta a mensagem completa e elegante para o WhatsApp
    const saudacao = `Olá, *${p.cliente}*! Tudo bem? 😊\nAqui é da *${nomeEmpresa}*.`;
    const titulo = `📄 *ORÇAMENTO: ${(p.titulo || 'Produtos Personalizados').toUpperCase()}*`;

    let msg = `${saudacao}\n\nConforme conversamos, segue o detalhamento do seu orçamento comercial:\n\n${titulo}\n\n🛍️ *ITENS ORÇADOS:*\n${itensTexto}\n\n💰 *INVESTIMENTO TOTAL:* *${App.formatMoney(p.investimento || 0)}*`;

    if (p.prazo) {
      msg += `\n⏱️ *Prazo de Produção:* ${p.prazo}`;
    }
    if (p.condicoes) {
      msg += `\n💳 *Condições de Pagamento:* ${p.condicoes}`;
    }
    if (config.chavePix) {
      msg += `\n🔑 *Chave Pix:* ${config.chavePix}`;
    }

    msg += `\n\nFicamos à sua disposição para qualquer dúvida ou ajuste na arte. Deseja aprovar este orçamento para iniciarmos a sua produção? ✨`;

    const url = `https://wa.me/${foneLimpo}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    App.toast(`Abrindo WhatsApp para enviar orçamento para ${p.cliente}...`, 'success');
  }
};
