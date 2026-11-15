/**
 * SEVEN PERSONALIZADOS — MÓDULO DE ORÇAMENTOS & PROPOSTAS COMERCIAIS
 * Criação, edição e gestão de orçamentos com itens, geração de propostas timbradas e
 * aprovação direta movendo a encomenda para a subaba "Fila de Espera".
 */

let propostaItensTemp = [];

const PropostasModule = {
  filtroAtivo: 'pendentes', // 'pendentes' | 'aprovadas' | 'todos'

  init() {
    this.renderList();
    window.addEventListener('seven_data_updated', (e) => {
      if (!e.detail || e.detail?.table === 'propostas') this.renderList();
    });
  },

  setFiltro(tipo) {
    this.filtroAtivo = tipo;
    const btnPendentes = document.getElementById('btn-prop-tab-pendentes');
    const btnAprovadas = document.getElementById('btn-prop-tab-aprovadas');
    const btnTodos = document.getElementById('btn-prop-tab-todos');

    if (btnPendentes) btnPendentes.className = `btn btn-sm ${tipo === 'pendentes' ? 'btn-primary' : 'btn-secondary'}`;
    if (btnAprovadas) btnAprovadas.className = `btn btn-sm ${tipo === 'aprovadas' ? 'btn-primary' : 'btn-secondary'}`;
    if (btnTodos) btnTodos.className = `btn btn-sm ${tipo === 'todos' ? 'btn-primary' : 'btn-secondary'}`;

    this.renderList();
  },

  renderList() {
    const propostas = StorageService.get('propostas') || [];

    const pendentesCount = propostas.filter(p => p.status !== 'Aprovada').length;
    const aprovadasCount = propostas.filter(p => p.status === 'Aprovada').length;

    // Atualiza contadores do cabeçalho e abas
    const pendQtdEl = document.getElementById('propostas-pendentes-qtd');
    if (pendQtdEl) pendQtdEl.textContent = pendentesCount;

    const aprovQtdEl = document.getElementById('propostas-aprovadas-qtd');
    if (aprovQtdEl) aprovQtdEl.textContent = aprovadasCount;

    const contPend = document.getElementById('cont-filtro-pendentes');
    if (contPend) contPend.textContent = pendentesCount;

    const contAprov = document.getElementById('cont-filtro-aprovadas');
    if (contAprov) contAprov.textContent = aprovadasCount;

    const contTodos = document.getElementById('cont-filtro-todos');
    if (contTodos) contTodos.textContent = propostas.length;

    const container = document.getElementById('propostas-cards-container');
    if (!container) return;

    if (propostas.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 48px 20px; color: var(--text-muted);">
          <div style="font-size: 2.2rem; margin-bottom: 12px;">📑</div>
          <h4 style="color: var(--text-primary); margin-bottom: 6px;">Nenhum orçamento cadastrado ainda</h4>
          <p style="font-size: 0.88rem; max-width: 480px; margin: 0 auto 16px auto;">
            Crie um novo orçamento para o cliente. Ele ficará salvo aqui na aba Orçamentos até que seja aprovado e movido para a Fila de Espera!
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

    let filtradas = [...propostas];

    if (termoBusca) {
      filtradas = filtradas.filter(p =>
        (p.cliente || '').toLowerCase().includes(termoBusca) ||
        (p.titulo || '').toLowerCase().includes(termoBusca) ||
        (p.telefone || '').includes(termoBusca)
      );
    }

    if (this.filtroAtivo === 'pendentes') {
      filtradas = filtradas.filter(p => p.status !== 'Aprovada');
    } else if (this.filtroAtivo === 'aprovadas') {
      filtradas = filtradas.filter(p => p.status === 'Aprovada');
    }

    if (filtradas.length === 0) {
      const msgVazio = this.filtroAtivo === 'pendentes'
        ? 'Nenhum orçamento aguardando aprovação no momento. Todos os orçamentos foram aprovados ou não há registros.'
        : (this.filtroAtivo === 'aprovadas'
          ? 'Nenhum orçamento aprovado ainda.'
          : 'Nenhum orçamento localizado para esta busca.');

      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px; color: var(--text-muted);">
          <div style="font-size: 1.8rem; margin-bottom: 8px;">🔍</div>
          <div style="font-size: 0.95rem;">${msgVazio}</div>
        </div>
      `;
      return;
    }

    // Ordena da mais recente para a mais antiga
    filtradas.sort((a, b) => ((b.criada_em || '') > (a.criada_em || '') ? 1 : -1));

    container.innerHTML = filtradas.map(p => {
      const isAprovada = p.status === 'Aprovada';
      const itensResumo = (p.itens && p.itens.length > 0)
        ? p.itens.map(i => `${i.quantidade}x ${i.produto_nome}`).join(', ')
        : (p.escopo || 'Itens personalizados');

      return `
        <div class="panel-box" style="margin-bottom: 0; display: flex; flex-direction: column; justify-content: space-between; border-color: ${isAprovada ? 'rgba(16, 185, 129, 0.45)' : 'rgba(245, 158, 11, 0.45)'}; box-shadow: ${isAprovada ? '0 4px 18px rgba(16, 185, 129, 0.08)' : '0 4px 18px rgba(245, 158, 11, 0.08)'};">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; gap: 8px; flex-wrap: wrap;">
              <div>
                <span class="status-badge" style="${isAprovada ? 'background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.5);' : 'background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.5);'}">
                  ${isAprovada ? '✅ Aprovada (Na Fila de Espera)' : '⏳ Aguardando Aprovação'}
                </span>
                ${!isAprovada ? `
                  <div style="font-size: 0.70rem; color: #fbbf24; margin-top: 3px; font-weight: 600;">
                    • Permanece em Orçamentos até aprovação
                  </div>
                ` : ''}
              </div>
              <span style="font-size: 0.75rem; color: var(--text-muted);">${App.formatDate(p.criada_em)}</span>
            </div>

            <h4 style="font-family: var(--font-display); font-size: 1.1rem; color: var(--text-primary); margin: 6px 0 4px 0;">
              ${App.escapeHtml(p.titulo || 'Orçamento Comercial')}
            </h4>
            <div style="font-size: 0.86rem; color: var(--accent); margin-bottom: 8px; font-weight: 600;">
              👤 Cliente: ${App.escapeHtml(p.cliente)} ${p.telefone ? `<span style="color: var(--text-muted); font-size: 0.78rem;">(${App.escapeHtml(p.telefone)})</span>` : ''}
            </div>

            <div style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 14px; background: rgba(255,255,255,0.02); padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border);">
              <div style="font-size: 0.70rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Itens Orçados:</div>
              <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px;" title="${App.escapeHtml(itensResumo)}">
                ${App.escapeHtml(itensResumo)}
              </div>
            </div>
          </div>

          <div style="border-top: 1px solid var(--border); padding-top: 14px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
            <div>
              <div style="font-size: 0.70rem; color: var(--text-muted);">Investimento Total</div>
              <div style="font-size: 1.18rem; font-weight: 700; color: var(--text-primary);">${App.formatMoney(p.investimento)}</div>
            </div>

            <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
              ${isAprovada ? `
                <button class="btn btn-secondary" onclick="PropostasModule.irParaFilaDeEspera()" style="padding: 6px 10px; font-size: 0.78rem; color: #34d399; border-color: rgba(16, 185, 129, 0.4);" title="Ver esta encomenda na Fila de Espera">
                  📦 Ver na Fila
                </button>
              ` : `
                <button class="btn btn-primary" onclick="PropostasModule.aprovarProposta('${p.id}')" title="Aprovar proposta e mover direto para Fila de Espera" style="padding: 6px 12px; font-size: 0.78rem; background: #10b981; border-color: #10b981; font-weight: 600;">
                  ✅ Aprovar (Mover p/ Fila)
                </button>
                <button class="btn btn-secondary btn-icon" onclick="PropostasModule.openEditModal('${p.id}')" style="padding: 6px 8px; font-size: 0.78rem;" title="Editar orçamento">
                  ✏️
                </button>
              `}
              <button class="btn btn-secondary" onclick="PropostasModule.visualizarProposta('${p.id}')" style="padding: 6px 10px; font-size: 0.78rem;" title="Visualizar proposta formatada timbrada">
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
    document.getElementById('prop-titulo').value = 'Orçamento de Produtos Personalizados Exclusivos';
    document.getElementById('prop-escopo').value = 'Fabricação e personalização a laser / 3D de peças conforme especificações do cliente com garantia de acabamento fino.';
    document.getElementById('prop-metodo').value = '1. Envio e aprovação de maquete digital 3D\n2. Fabricação com controle milimétrico de corte e gravação\n3. Limpeza, acabamento artesanal e controle de qualidade\n4. Embalagem reforçada e pronta para entrega';
    document.getElementById('prop-prazo').value = '5 a 7 dias úteis após aprovação da arte final';
    document.getElementById('prop-condicoes').value = '50% de sinal no pedido e 50% na conclusão da produção via Pix.';
    document.getElementById('prop-status').value = 'Aguardando Aprovação';

    propostaItensTemp = [
      {
        produto_nome: 'Taça de Gin Personalizada',
        personalizacao: 'Gravação frente (Arte / Nome)',
        quantidade: 20,
        preco_unitario: 15.00,
        subtotal: 300.00
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
    document.getElementById('prop-titulo').value = p.titulo || '';
    document.getElementById('prop-escopo').value = p.escopo || '';
    document.getElementById('prop-metodo').value = p.metodo || '';
    document.getElementById('prop-prazo').value = p.prazo || '';
    document.getElementById('prop-condicoes').value = p.condicoes || '';
    document.getElementById('prop-status').value = p.status || 'Aguardando Aprovação';

    propostaItensTemp = (p.itens && p.itens.length > 0)
      ? JSON.parse(JSON.stringify(p.itens))
      : [
          {
            produto_nome: p.titulo || 'Item Personalizado',
            personalizacao: p.escopo || '',
            quantidade: 1,
            preco_unitario: Number(p.investimento) || 0,
            subtotal: Number(p.investimento) || 0
          }
        ];

    this.renderItensTable();
    App.openModal('modal-proposta');
  },

  addItemRow() {
    propostaItensTemp.push({
      produto_nome: '',
      personalizacao: '',
      quantidade: 1,
      preco_unitario: 0,
      subtotal: 0
    });
    this.renderItensTable();
  },

  removeItemRow(index) {
    if (propostaItensTemp.length > 1) {
      propostaItensTemp.splice(index, 1);
      this.renderItensTable();
    }
  },

  updateItemRow(index, field, value) {
    const item = propostaItensTemp[index];
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
    const container = document.getElementById('prop-itens-tbody');
    if (!container) return;

    let total = 0;

    container.innerHTML = propostaItensTemp.map((item, idx) => {
      total += (Number(item.subtotal) || 0);
      return `
        <tr>
          <td>
            <input type="text" class="form-control" style="padding: 6px 10px;" value="${App.escapeHtml(item.produto_nome)}" 
                   placeholder="Ex: Taça de Gin Acrílica" onchange="PropostasModule.updateItemRow(${idx}, 'produto_nome', this.value)">
          </td>
          <td>
            <input type="text" class="form-control" style="padding: 6px 10px;" value="${App.escapeHtml(item.personalizacao || '')}" 
                   placeholder="Ex: Nome da Aniversariante" onchange="PropostasModule.updateItemRow(${idx}, 'personalizacao', this.value)">
          </td>
          <td style="width: 80px;">
            <input type="number" min="1" class="form-control" style="padding: 6px 10px;" value="${item.quantidade}" 
                   onchange="PropostasModule.updateItemRow(${idx}, 'quantidade', this.value)">
          </td>
          <td style="width: 110px;">
            <input type="number" step="0.5" class="form-control" style="padding: 6px 10px;" value="${item.preco_unitario}" 
                   onchange="PropostasModule.updateItemRow(${idx}, 'preco_unitario', this.value)">
          </td>
          <td style="width: 110px; font-weight: 600; vertical-align: middle;">
            ${App.formatMoney(item.subtotal || 0)}
          </td>
          <td style="width: 40px; text-align: center; vertical-align: middle;">
            <button type="button" class="btn-icon" style="background: transparent; color: var(--danger); border: none; cursor: pointer;" 
                    onclick="PropostasModule.removeItemRow(${idx})">✕</button>
          </td>
        </tr>
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
    const titulo = document.getElementById('prop-titulo').value.trim();
    const escopo = document.getElementById('prop-escopo').value.trim();
    const metodo = document.getElementById('prop-metodo').value.trim();
    const prazo = document.getElementById('prop-prazo').value.trim();
    let statusEscolhido = document.getElementById('prop-status')?.value || 'Aguardando Aprovação';
    const condicoes = document.getElementById('prop-condicoes').value.trim();

    if (aprovarDireto === true) {
      statusEscolhido = 'Aprovada';
    } else if (statusEscolhido !== 'Aprovada') {
      statusEscolhido = 'Aguardando Aprovação';
    }

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
      titulo: titulo || 'Orçamento de Produtos Personalizados',
      escopo,
      metodo,
      prazo: prazo || '5 a 7 dias úteis',
      investimento: investimentoTotal,
      condicoes,
      status: statusEscolhido,
      itens: JSON.parse(JSON.stringify(propostaItensTemp))
    };

    let idOrcamento = idExistente;
    if (idExistente) {
      StorageService.update('propostas', idExistente, payload);
    } else {
      payload.criada_em = new Date().toISOString();
      const novo = StorageService.insert('propostas', payload);
      idOrcamento = novo.id;
    }

    App.closeModal('modal-proposta');

    if (statusEscolhido === 'Aprovada' || aprovarDireto === true) {
      this.aprovarProposta(idOrcamento);
    } else {
      App.toast('Orçamento salvo com sucesso! Permanece na aba Orçamentos aguardando aprovação.', 'success');
      this.renderList();
    }
  },

  aprovarProposta(id) {
    const p = StorageService.get('propostas').find(item => item.id === id);
    if (!p) return;

    if (p.status === 'Aprovada' && p.encomenda_id) {
      App.toast('Este orçamento já foi aprovado e está na Fila de Espera.', 'info');
      this.irParaFilaDeEspera();
      return;
    }

    // Calcula prazo padrão de entrega (7 dias à frente)
    const dataEntregaDefault = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0];

    const itensEncomenda = (p.itens && p.itens.length > 0)
      ? p.itens
      : [{
          produto_nome: p.titulo || 'Pedido Personalizado',
          personalizacao: p.escopo || '',
          quantidade: 1,
          preco_unitario: Number(p.investimento) || 0,
          subtotal: Number(p.investimento) || 0
        }];

    const novaEncomenda = {
      cliente_nome: p.cliente,
      telefone: p.telefone || p.contato || '',
      data_pedido: new Date().toISOString().split('T')[0],
      data_entrega_prevista: dataEntregaDefault,
      status: 'Fila', // Fila de Espera!
      pagamento_status: 'Pendente',
      forma_pagamento: 'Pix',
      valor_total: Number(p.investimento) || 0,
      valor_pago: 0,
      observacoes: `Origem: Orçamento "${p.titulo}".\nPrazo Comercial: ${p.prazo || '5 a 7 dias'}.\nCondições: ${p.condicoes || ''}`,
      itens: itensEncomenda
    };

    const encCriada = StorageService.insert('encomendas', novaEncomenda);

    StorageService.update('propostas', id, {
      status: 'Aprovada',
      encomenda_id: encCriada.id,
      aprovada_em: new Date().toISOString()
    });

    App.toast('Orçamento aprovado com sucesso! Encomenda movida para a Fila de Espera. 🎉', 'success');
    App.closeModal('modal-preview-proposta');
    App.closeModal('modal-proposta');
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
        ${p.status !== 'Aprovada' ? `
          <button class="btn btn-primary" onclick="PropostasModule.aprovarProposta('${p.id}')" style="background: #10b981; border-color: #10b981; font-weight: 600;">
            ✅ Aprovar & Mover p/ Fila de Espera
          </button>
        ` : `
          <span style="font-size: 0.85rem; color: #10b981; font-weight: 600; margin-right: 8px;">
            ✅ Orçamento Aprovado (Na Fila de Espera)
          </span>
          <button class="btn btn-secondary" onclick="PropostasModule.irParaFilaDeEspera()" style="font-size: 0.82rem; color: #34d399; border-color: rgba(16, 185, 129, 0.4);">
            📦 Ver na Fila
          </button>
        `}
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
          <div><strong style="color: #00a8f3;">Status:</strong> ${p.status === 'Aprovada' ? 'Aprovado (Na Fila de Produção)' : 'Aguardando Aprovação'}</div>
        </div>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
        <div style="font-size: 0.76rem; text-transform: uppercase; color: #0284c7; font-weight: 700; letter-spacing: 0.05em;">Orçamento Comercial Preparado Para</div>
        <div style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-top: 4px;">${App.escapeHtml(p.cliente)}</div>
        ${p.contato ? `<div style="font-size: 0.88rem; color: #475569;">A/C: ${App.escapeHtml(p.contato)} ${p.telefone ? `(${p.telefone})` : ''}</div>` : ''}
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
                <th style="padding: 10px 12px;">Personalização & Arte</th>
                <th style="padding: 10px 12px; text-align: center; width: 70px;">Qtd</th>
                <th style="padding: 10px 12px; text-align: right; width: 110px;">Valor Unit.</th>
                <th style="padding: 10px 12px; text-align: right; width: 120px;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itensList.map(item => `
                <tr style="border-bottom: 1px solid #e2e8f0; color: #1e293b;">
                  <td style="padding: 10px 12px; font-weight: 600;">${App.escapeHtml(item.produto_nome || 'Item')}</td>
                  <td style="padding: 10px 12px; color: #475569;">${App.escapeHtml(item.personalizacao || 'Padrão')}</td>
                  <td style="padding: 10px 12px; text-align: center; font-weight: 600;">${item.quantidade}</td>
                  <td style="padding: 10px 12px; text-align: right;">${App.formatMoney(item.preco_unitario || 0)}</td>
                  <td style="padding: 10px 12px; text-align: right; font-weight: 700; color: #0284c7;">${App.formatMoney(item.subtotal || 0)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background: #f8fafc; border-top: 2px solid #00a8f3;">
                <td colspan="4" style="padding: 12px; font-weight: 700; color: #0f172a; text-align: right; font-size: 0.95rem;">Investimento Total:</td>
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
  }
};
