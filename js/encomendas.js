/**
 * SEVEN PERSONALIZADOS — MÓDULO DE ENCOMENDAS & PRODUÇÃO
 * Gestão de pedidos personalizados, itens detalhados, prazos de entrega e pagamentos
 */

let encomendaItensTemp = [];
let encomendaFotoTemp = { dataUrl: '', nome: '' };

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
    const filtroCat = document.getElementById('filtro-enc-categoria')?.value || '';
    const filtroPagto = document.getElementById('filtro-enc-pagto')?.value || '';
    const termoBusca = (document.getElementById('filtro-enc-busca')?.value || '').toLowerCase().trim();

    // Atualiza contadores do cabeçalho de Encomendas (ativas em aberto)
    const encAtivasAll = encomendas.filter(e => {
      if (e.status === 'Entregue' || e.status === 'Cancelada') return false;
      if (e.status === 'Pronto' && e.pagamento_status === 'Pago') return false;
      return true;
    });
    const headerQtdEl = document.getElementById('enc-header-qtd');
    if (headerQtdEl) headerQtdEl.textContent = encAtivasAll.length;
    const headerValEl = document.getElementById('enc-header-valor');
    if (headerValEl) {
      const somaAtivas = encAtivasAll.reduce((acc, e) => acc + (Number(e.valor_total) || 0), 0);
      headerValEl.textContent = App.formatMoney(somaAtivas);
    }
    if (typeof App !== 'undefined' && App.updateBadges) {
      App.updateBadges();
    }

    // Atualiza opções do filtro de categoria caso ainda não preenchido
    const filtroCatEl = document.getElementById('filtro-enc-categoria');
    if (filtroCatEl && filtroCatEl.options.length <= 1) {
      const cats = StorageService.getCategoriasProducao();
      const valAtual = filtroCatEl.value;
      filtroCatEl.innerHTML = `<option value="">Todas as Categorias</option>` +
        cats.map(c => `<option value="${App.escapeHtml(c)}" ${c === valAtual ? 'selected' : ''}>${App.escapeHtml(c)}</option>`).join('');
    }

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
        definicoesGrupos['Fila'],
        definicoesGrupos['Em produção'],
        definicoesGrupos['Pronto']
      ];
    } else if (filtroStatus === 'TODOS') {
      statusGrupos = [
        definicoesGrupos['Fila'],
        definicoesGrupos['Em produção'],
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
          return e.status === 'Entregue' || e.status === 'Cancelada' || (e.status === 'Pronto' && e.pagamento_status === 'Pago');
        }
        if (!filtroStatus && grupo.key === 'Pronto') {
          const isFin = e.status === 'Entregue' || e.status === 'Cancelada' || (e.status === 'Pronto' && e.pagamento_status === 'Pago');
          if (isFin) return false;
        }
        return e.status === grupo.key;
      });

      if (filtroPagto) {
        ordensGrupo = ordensGrupo.filter(e => e.pagamento_status === filtroPagto);
      }

      if (filtroCat) {
        ordensGrupo = ordensGrupo.filter(e => (e.categoria || '3D') === filtroCat);
      }

      if (termoBusca) {
        ordensGrupo = ordensGrupo.filter(e => {
          const itensStr = (e.itens || []).map(i => `${i.produto_nome || ''} ${i.cor || ''} ${i.personalizacao || ''}`).join(' ').toLowerCase();
          return (e.cliente_nome || '').toLowerCase().includes(termoBusca) ||
            (e.telefone || '').toLowerCase().includes(termoBusca) ||
            (e.numero_pedido || '').toLowerCase().includes(termoBusca.replace(/^#/, '')) ||
            (e.id || '').toLowerCase().includes(termoBusca) ||
            (e.observacoes || '').toLowerCase().includes(termoBusca) ||
            itensStr.includes(termoBusca);
        });
      }

      totalGeralEncontrado += ordensGrupo.length;
      const totalValor = ordensGrupo.reduce((acc, it) => acc + (Number(it.valor_total) || 0), 0);

      ordensGrupo.sort((a, b) => ((a.data_entrega_prevista || '') > (b.data_entrega_prevista || '') ? 1 : -1));

      return `
        <div class="panel-box" id="grupo-enc-${grupo.key}" style="margin-bottom: 24px; padding: 0; overflow: hidden; border: 1px solid ${grupo.borderColor}; border-left: 6px solid ${grupo.themeColor}; box-shadow: ${grupo.glowShadow}; border-radius: var(--radius-md);">
          <div class="panel-header" style="background: ${grupo.headerBg}; padding: 14px 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid ${grupo.borderColor}; flex-wrap: wrap; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 10px; background: rgba(0, 0, 0, 0.4); border: 1px solid ${grupo.borderColor}; font-size: 1.25rem; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
                ${grupo.icon}
              </span>
              <div>
                <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                  <h3 style="font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; color: #ffffff; margin: 0; letter-spacing: 0.02em;">
                    ${grupo.title}
                  </h3>
                  <span style="font-size: 0.70rem; font-weight: 700; text-transform: uppercase; padding: 3px 10px; border-radius: 999px; ${grupo.badgeStyle}">
                    ${grupo.key}
                  </span>
                </div>
                <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 2px;">
                  ${grupo.subtitle}
                </div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <span style="font-size: 0.78rem; font-weight: 600; padding: 5px 11px; background: rgba(0, 0, 0, 0.45); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: var(--radius-sm); color: var(--text-secondary);">
                📦 <strong style="color: #ffffff;">${ordensGrupo.length}</strong> ${ordensGrupo.length === 1 ? 'encomenda' : 'encomendas'}
              </span>
              <span style="font-size: 0.80rem; font-weight: 700; padding: 5px 12px; background: rgba(0, 0, 0, 0.45); border: 1px solid ${grupo.borderColor}; border-radius: var(--radius-sm); color: ${grupo.titleColor};">
                💰 ${App.formatMoney(totalValor)}
              </span>
            </div>
          </div>

          <div style="padding: 16px;">
            ${ordensGrupo.length === 0 ? `
              <div style="text-align: center; padding: 28px 16px; color: var(--text-muted); font-size: 0.88rem;">
                <div style="font-size: 1.4rem; margin-bottom: 6px; opacity: 0.6;">${grupo.icon}</div>
                Nenhuma encomenda nesta etapa no momento.
              </div>
            ` : `
              <div class="enc-cards-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(min(330px, 100%), 1fr)); gap: 16px;">
                ${ordensGrupo.map(enc => this.renderOrderCard(enc, grupo)).join('')}
              </div>
            `}
          </div>
        </div>
      `;
    }).join('');

    if (totalGeralEncontrado === 0 && (filtroPagto || termoBusca || filtroCat)) {
      container.innerHTML = `
        <div class="panel-box" style="text-align: center; padding: 40px; color: var(--text-muted);">
          <div style="font-size: 1.8rem; margin-bottom: 8px;">🔍</div>
          Nenhuma encomenda encontrada com os filtros selecionados.
        </div>
      `;
      return;
    }

    container.innerHTML = htmlGrupos;
  },

  renderOrderCard(enc, grupo) {
    const hojeIso = new Date().toISOString().split('T')[0];
    const isLate = enc.data_entrega_prevista && enc.data_entrega_prevista < hojeIso && enc.status !== 'Entregue' && enc.status !== 'Cancelada';
    const totalItens = (enc.itens || []).reduce((acc, it) => acc + (Number(it.quantidade) || 0), 0);
    const coresList = [...new Set((enc.itens || []).filter(i => i.cor).map(i => i.cor))];

    const itensList = (enc.itens && enc.itens.length > 0) ? enc.itens : [];
    const multiItens = itensList.length > 1;
    const hasItemPhotos = itensList.some(i => i.foto_anexo);

    const itensHtml = itensList.length > 0
      ? itensList.map((i, idx) => {
        const corStr = i.cor ? ` <span style="color: #38bdf8;">[${App.escapeHtml(i.cor)}]</span>` : '';
        const thumbHtml = i.foto_anexo
          ? `
              <div onclick="event.stopPropagation(); App.openOrderItemPhoto('encomendas', '${enc.id}', ${idx})" title="Foto de ${App.escapeHtml(i.produto_nome || 'Item')} — Clique para tela cheia e download"
                   style="flex-shrink: 0; position: relative; cursor: pointer;">
                <img src="${i.foto_anexo}" alt="Anexo Item ${idx + 1}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 7px; border: 1.5px solid rgba(56, 189, 248, 0.6); box-shadow: 0 2px 8px rgba(0,0,0,0.35); display: block;">
                <span style="position: absolute; right: 2px; bottom: 2px; background: rgba(15, 23, 42, 0.88); border: 1px solid rgba(56,189,248,0.65); border-radius: 999px; font-size: 0.54rem; line-height: 1; padding: 2px 3px;">🔍</span>
              </div>
            `
          : '';
        const descParts = [];
        if (i.personalizacao && i.personalizacao.trim()) {
          descParts.push(`<div style="font-size: 0.78rem; color: #e2e8f0; margin-top: 3px; white-space: pre-line; line-height: 1.4;">${App.escapeHtml(i.personalizacao.trim())}</div>`);
        }
        if (i.observacao && i.observacao.trim()) {
          descParts.push(`<div style="font-size: 0.74rem; color: #fbbf24; margin-top: 2px;">Obs: ${App.escapeHtml(i.observacao.trim())}</div>`);
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
      : `<div style="color: var(--text-muted);">• Item personalizado</div>`;

    // Oculta o texto automático antigo ("Origem: Orçamento... Prazo Comercial... Condições...")
    // exibindo apenas observações/descrições reais da encomenda
    const obsLimpa = (enc.observacoes || '').trim();
    const isObsComercialAntiga = /^Origem:\s*Orçamento/i.test(obsLimpa);
    const obsParaExibir = isObsComercialAntiga ? '' : obsLimpa;

    const valorTotal = Number(enc.valor_total) || 0;
    const valorPago = Number(enc.valor_pago) || 0;
    const faltaPagar = Math.max(0, valorTotal - valorPago);

    const borderColor = isLate ? 'rgba(239, 68, 68, 0.6)' : (grupo?.borderColor || 'rgba(0, 168, 243, 0.4)');
    const cardShadow = isLate ? '0 4px 18px rgba(239, 68, 68, 0.14)' : '0 4px 16px rgba(0, 0, 0, 0.25)';
    const numPedido = StorageService.formatOrderNumber(enc);

    return `
      <div class="panel-box dash-row-clickable" data-enc-id="${enc.id}"
           onclick="EncomendasModule.openEditModal('${enc.id}')"
           title="Clique para abrir detalhes completos da encomenda ${numPedido}"
           style="margin-bottom: 0; display: flex; flex-direction: column; justify-content: space-between; border-color: ${borderColor}; box-shadow: ${cardShadow}; background: rgba(15, 23, 42, 0.65); padding: 16px;">
        <div>
          <!-- Topo: #Número do Pedido, Categoria e Prazo de Entrega -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; gap: 8px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <span style="font-size: 0.76rem; font-weight: 800; color: #ffffff; background: rgba(255,255,255,0.08); padding: 2px 8px; border-radius: 6px;">
                ${numPedido}
              </span>
              ${this.getCategoriaBadge(enc.categoria)}
            </div>
            <span style="font-size: 0.74rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; ${isLate ? 'background: rgba(239, 68, 68, 0.22); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.55);' : 'background: rgba(255, 255, 255, 0.05); color: var(--text-secondary); border: 1px solid var(--border);'}">
              ${isLate ? '🚨 Atrasado:' : '📅 Entrega:'} ${App.formatDate(enc.data_entrega_prevista)}
            </span>
          </div>

          <!-- Cliente, Telefone e Miniatura Discreta da Foto Anexada -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
            <div style="flex: 1; min-width: 0;">
              <h4 style="font-family: var(--font-display); font-size: 1.05rem; color: var(--text-primary); margin: 4px 0 2px 0;">
                👤 ${App.escapeHtml(enc.cliente_nome)}
              </h4>
              <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 10px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                <span>📞 ${App.escapeHtml(enc.telefone || 'Sem telefone')}</span>
                <span>• Pedido em ${App.formatDate(enc.data_pedido)}</span>
              </div>
            </div>
            ${(enc.foto_anexo && !hasItemPhotos) ? `
              <div onclick="event.stopPropagation(); App.openOrderPhoto('encomendas', '${enc.id}')" title="Clique para ampliar a foto em tela cheia e fazer download"
                   style="flex-shrink: 0; position: relative; cursor: pointer; margin-top: 2px;">
                <img src="${enc.foto_anexo}" alt="Anexo do pedido"
                     style="width: 48px; height: 48px; object-fit: cover; border-radius: 8px; border: 1.5px solid rgba(56, 189, 248, 0.55); box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: block;">
                <span style="position: absolute; right: -4px; bottom: -4px; background: #0f172a; border: 1px solid rgba(56,189,248,0.65); border-radius: 999px; font-size: 0.62rem; padding: 1px 4px;">🔍</span>
              </div>
            ` : ''}
          </div>

          <!-- Caixa de Itens em Tópicos (separados em retângulos quando há mais de 1 item) -->
          <div style="font-size: 0.81rem; color: var(--text-secondary); line-height: 1.45; margin-bottom: 12px; background: rgba(255,255,255,0.025); padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; gap: 6px; flex-wrap: wrap;">
              <span style="font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">
                Itens do Pedido (${totalItens} ${totalItens === 1 ? 'peça' : 'peças'}):
              </span>
              ${coresList.length > 0 ? `
                <span class="badge-cor-tag" style="font-size: 0.68rem; padding: 1px 7px;" title="Cores: ${coresList.join(', ')}">
                  🎨 ${App.escapeHtml(coresList.join(', '))}
                </span>
              ` : ''}
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px; overflow: visible;">
              ${itensHtml}
            </div>
            ${obsParaExibir ? `
              <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed rgba(255,255,255,0.08); font-size: 0.76rem; color: #93c5fd; white-space: pre-line;">
                📝 <strong>Descrição:</strong> ${App.escapeHtml(obsParaExibir)}
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Rodapé: Valor Total + Selects Rápidos + Botão Editar -->
        <div style="border-top: 1px solid var(--border); padding-top: 12px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
          <div>
            <div style="font-size: 0.68rem; color: var(--text-muted);">Valor Total</div>
            <div style="font-size: 1.12rem; font-weight: 800; color: var(--text-primary);">${App.formatMoney(valorTotal)}</div>
            ${faltaPagar > 0 && enc.pagamento_status !== 'Pago' ? `
              <div style="font-size: 0.70rem; color: #fbbf24;">Falta: ${App.formatMoney(faltaPagar)}</div>
            ` : `
              <div style="font-size: 0.70rem; color: #34d399;">Quitado ✅</div>
            `}
          </div>

          <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;" onclick="event.stopPropagation()">
            ${this.renderStatusSelect(enc.id, enc.status)}
            ${this.renderPagtoSelect(enc.id, enc.pagamento_status)}
            <button type="button" class="btn btn-secondary btn-icon" onclick="EncomendasModule.openEditModal('${enc.id}')" style="padding: 6px 9px; font-size: 0.78rem;" title="Editar encomenda">
              ✏️
            </button>
          </div>
        </div>
      </div>
    `;
  },

  getCategoriaBadge(categoria) {
    const cat = (categoria || '3D').trim();
    let icon = '🏷️';
    let cls = 'badge-cat-custom';
    const catLower = cat.toLowerCase();
    if (cat === '3D' || catLower === '3d') {
      icon = '🧵';
      cls = 'badge-cat-3d';
    } else if (catLower.includes('gravação') && !catLower.includes('corte')) {
      icon = '⚡';
      cls = 'badge-cat-gravacao';
    } else if (catLower.includes('corte') && !catLower.includes('gravação')) {
      icon = '✂️';
      cls = 'badge-cat-corte';
    } else if (catLower.includes('corte') && catLower.includes('gravação')) {
      icon = '🔥';
      cls = 'badge-cat-corte-gravacao';
    }
    return `<span class="badge-cat-pill ${cls}">${icon} ${App.escapeHtml(cat)}</span>`;
  },

  renderOrderRow(enc) {
    const statusClass = this.getStatusClass(enc.status);
    const pagtoClass = this.getPagtoClass(enc.pagamento_status);
    const totalItens = (enc.itens || []).reduce((acc, it) => acc + (Number(it.quantidade) || 0), 0);
    const nomesProdutos = (enc.itens || []).map(i => {
      const corStr = i.cor ? ` [${i.cor}]` : '';
      const obsStr = i.observacao ? ` (Obs: ${i.observacao})` : '';
      return `${i.quantidade}x ${i.produto_nome || 'Item'}${corStr}${obsStr}`;
    }).join(', ');

    const coresList = [...new Set((enc.itens || []).filter(i => i.cor).map(i => i.cor))];
    const hasItemObs = (enc.itens || []).some(i => i.observacao && i.observacao.trim());
    const numPedido = StorageService.formatOrderNumber(enc);

    return `
      <tr class="dash-row-clickable" data-enc-id="${enc.id}" onclick="EncomendasModule.openEditModal('${enc.id}')" title="Clique para abrir detalhes da encomenda ${numPedido}">
        <td>
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px; flex-wrap: wrap;">
            <strong>${numPedido}</strong>
            ${this.getCategoriaBadge(enc.categoria)}
          </div>
          <div style="font-size: 0.76rem; color: var(--text-muted);">${App.formatDate(enc.data_pedido)}</div>
        </td>
        <td>
          <div style="font-weight: 600; color: var(--text-primary);">${App.escapeHtml(enc.cliente_nome)}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${App.escapeHtml(enc.telefone || 'Sem fone')}</div>
        </td>
        <td>
          <div style="font-size: 0.85rem; max-width: 290px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${App.escapeHtml(nomesProdutos)}">
            ${App.escapeHtml(nomesProdutos || 'Item personalizado')}
          </div>
          <div style="font-size: 0.74rem; display: flex; align-items: center; gap: 6px; margin-top: 2px; flex-wrap: wrap;">
            <span style="color: var(--accent);">Total: ${totalItens} peças</span>
            ${coresList.length > 0 ? `
              <span class="badge-cor-tag" title="Cores personalizadas: ${coresList.join(', ')}">
                🎨 ${App.escapeHtml(coresList.join(', '))}
              </span>
            ` : ''}
            ${hasItemObs ? `
              <span class="badge-cor-tag" style="background: rgba(168, 85, 247, 0.14); color: #c084fc; border-color: rgba(168, 85, 247, 0.4);" title="Há observações nos produtos">
                📌 Obs no Item
              </span>
            ` : ''}
            ${(enc.itens || []).some(i => i.qtd_deduzida_estoque > 0) ? `
              <span class="badge-cor-tag" style="background: rgba(16, 185, 129, 0.14); color: #34d399; border-color: rgba(16, 185, 129, 0.4);" title="Insumos deduzidos do estoque em tempo real">
                📦 Estoque Baixado
              </span>
            ` : ''}
            ${enc.observacoes ? `
              <span class="badge-cor-tag" style="background: rgba(245, 158, 11, 0.12); color: #fbbf24; border-color: rgba(245, 158, 11, 0.35);" title="Observações Gerais: ${App.escapeHtml(enc.observacoes)}">
                📝 Obs Geral
              </span>
            ` : ''}
          </div>
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

    // Gerencia estorno ou baixa no estoque se o status for alterado para/de Cancelada
    if (newStatus === 'Cancelada' && enc.status !== 'Cancelada') {
      this.estornarEstoque(enc);
      window.dispatchEvent(new CustomEvent('seven_data_updated', { detail: { table: 'estoque' } }));
    } else if (newStatus !== 'Cancelada' && enc.status === 'Cancelada') {
      this.deduzirEstoque(enc);
      window.dispatchEvent(new CustomEvent('seven_data_updated', { detail: { table: 'estoque' } }));
    }

    StorageService.update('encomendas', id, { status: newStatus });

    if (newStatus === 'Entregue' || newStatus === 'Cancelada' || (newStatus === 'Pronto' && enc.pagamento_status === 'Pago')) {
      App.toast(`Status alterado para "${newStatus}"! Encomenda movida para Finalizados. 🎉`, 'success');
    } else {
      App.toast(`Status da encomenda ${StorageService.formatOrderNumber(enc)} alterado para "${newStatus}".`, 'info');
    }

    this.render();
    this.renderFinalizados();
    if (typeof EstoqueModule !== 'undefined') EstoqueModule.render();
    if (typeof FinanceiroModule !== 'undefined') FinanceiroModule.render();
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

    if (enc.status === 'Entregue' || enc.status === 'Cancelada' || (enc.status === 'Pronto' && newPagto === 'Pago')) {
      App.toast(`Pagamento atualizado! Encomenda no histórico de Finalizados. 🎉`, 'success');
    } else {
      App.toast(`Financeiro da encomenda ${StorageService.formatOrderNumber(enc)} alterado para "${newPagto}".`, 'info');
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

    // Popula categorias cadastradas dinamicamente
    const catSelect = document.getElementById('enc-form-categoria');
    if (catSelect) {
      const cats = StorageService.getCategoriasProducao();
      catSelect.innerHTML = cats.map(c => `<option value="${App.escapeHtml(c)}">${App.escapeHtml(c)}</option>`).join('');
      catSelect.value = cats[0] || '3D';
    }

    const hojeIso = new Date().toISOString().split('T')[0];
    const dataOrcEl = document.getElementById('enc-form-data-orcamento');
    const dataConfEl = document.getElementById('enc-form-data-confirmacao');
    if (dataOrcEl) dataOrcEl.value = hojeIso;
    if (dataConfEl) dataConfEl.value = hojeIso;

    const padroes = StorageService.getPadroesOrcamentoPedido();
    const diasEntrega = parseInt(padroes.pedido_dias_entrega, 10);
    const dias = Number.isFinite(diasEntrega) && diasEntrega >= 0 ? diasEntrega : 5;

    // Sugere entrega conforme prazo padrão configurado em Configurações
    const dataEntregaDefault = new Date(Date.now() + dias * 24 * 3600 * 1000).toISOString().split('T')[0];
    document.getElementById('enc-form-data-entrega').value = dataEntregaDefault;

    // Popula formas de pagamento cadastradas dinamicamente
    const formaPagtoSelect = document.getElementById('enc-form-forma-pagto');
    if (formaPagtoSelect) {
      const formas = StorageService.getFormasPagamento();
      formaPagtoSelect.innerHTML = formas.map(f => `<option value="${App.escapeHtml(f)}">${App.escapeHtml(f)}</option>`).join('');
      const formaPadrao = padroes.pedido_forma_pagto || formas[0] || 'Pix';
      formaPagtoSelect.value = formas.includes(formaPadrao) ? formaPadrao : (formas[0] || 'Pix');
    }

    document.getElementById('enc-form-status').value = 'Fila';
    document.getElementById('enc-form-pagto-status').value = 'Pendente';
    document.getElementById('enc-form-valor-pago').value = '0';
    document.getElementById('enc-form-obs').value = lead?.last_message || padroes.pedido_obs || '';
    document.getElementById('enc-btn-delete').style.display = 'none';

    encomendaFotoTemp = { dataUrl: '', nome: '' };

    const valorEstimado = parseFloat(lead?.value) || 0;
    encomendaItensTemp = [
      {
        produto_nome: lead?.last_message ? 'Pedido Personalizado' : '',
        cor: '',
        personalizacao: lead?.last_message || '',
        observacao: '',
        quantidade: 1,
        preco_unitario: valorEstimado,
        subtotal: valorEstimado,
        foto_anexo: '',
        foto_nome: '',
        estoque_id: 'auto',
        estoque_item_id: null,
        estoque_item_nome: null,
        qtd_deduzida_estoque: 0
      }
    ];
    this.renderItensTable();

    App.openModal('modal-encomenda');
  },

  openEditModal(id) {
    const enc = StorageService.get('encomendas').find(e => e.id === id);
    if (!enc) return;

    document.getElementById('enc-modal-title').textContent = `Editar Encomenda ${StorageService.formatOrderNumber(enc)}`;
    document.getElementById('enc-form-id').value = enc.id;
    document.getElementById('enc-form-cliente').value = enc.cliente_nome || '';
    document.getElementById('enc-form-telefone').value = enc.telefone || '';

    // Popula categorias cadastradas dinamicamente
    const catSelect = document.getElementById('enc-form-categoria');
    if (catSelect) {
      const cats = StorageService.getCategoriasProducao();
      catSelect.innerHTML = cats.map(c => `<option value="${App.escapeHtml(c)}">${App.escapeHtml(c)}</option>`).join('');
      catSelect.value = enc.categoria || cats[0] || '3D';
    }

    const dataOrcEl = document.getElementById('enc-form-data-orcamento');
    const dataConfEl = document.getElementById('enc-form-data-confirmacao');
    if (dataOrcEl) dataOrcEl.value = enc.data_orcamento || enc.data_pedido || '';
    if (dataConfEl) dataConfEl.value = enc.data_confirmacao || enc.data_pedido || '';
    document.getElementById('enc-form-data-entrega').value = enc.data_entrega_prevista || '';
    document.getElementById('enc-form-status').value = enc.status || 'Fila';
    document.getElementById('enc-form-pagto-status').value = enc.pagamento_status || 'Pendente';

    // Popula formas de pagamento cadastradas dinamicamente
    const formaPagtoSelect = document.getElementById('enc-form-forma-pagto');
    if (formaPagtoSelect) {
      const formas = StorageService.getFormasPagamento();
      const formaAtual = enc.forma_pagamento || 'Pix';
      const listaFormas = formas.includes(formaAtual) ? formas : [...formas, formaAtual];
      formaPagtoSelect.innerHTML = listaFormas.map(f => `<option value="${App.escapeHtml(f)}">${App.escapeHtml(f)}</option>`).join('');
      formaPagtoSelect.value = formaAtual;
    }

    document.getElementById('enc-form-valor-pago').value = enc.valor_pago || 0;
    document.getElementById('enc-form-obs').value = enc.observacoes || '';
    document.getElementById('enc-btn-delete').style.display = 'inline-block';

    encomendaFotoTemp = {
      dataUrl: enc.foto_anexo || '',
      nome: enc.foto_nome || (enc.foto_anexo ? 'anexo-encomenda.jpg' : '')
    };

    encomendaItensTemp = (enc.itens && enc.itens.length > 0)
      ? enc.itens.map(it => ({
        produto_nome: it.produto_nome || '',
        cor: it.cor || '',
        personalizacao: it.personalizacao || '',
        observacao: it.observacao || it.obs || '',
        quantidade: Number(it.quantidade) || 1,
        preco_unitario: Number(it.preco_unitario) || 0,
        subtotal: Number(it.subtotal) || 0,
        foto_anexo: it.foto_anexo || '',
        foto_nome: it.foto_nome || '',
        calc_3d_historico_id: it.calc_3d_historico_id || '',
        calc_3d_filamento_id: it.calc_3d_filamento_id || '',
        gramas_unitario: Number(it.gramas_unitario) || 0,
        filamentos_usados_unitario: Array.isArray(it.filamentos_usados_unitario) ? it.filamentos_usados_unitario : [],
        filamentos_deduzidos: Array.isArray(it.filamentos_deduzidos) ? it.filamentos_deduzidos : [],
        filamento_deduzido_id: it.filamento_deduzido_id || null,
        filamento_deduzido_g: Number(it.filamento_deduzido_g) || 0,
        estoque_id: it.estoque_id || (it.estoque_item_id ? it.estoque_item_id : 'auto'),
        estoque_item_id: it.estoque_item_id || null,
        estoque_item_nome: it.estoque_item_nome || null,
        qtd_deduzida_estoque: Number(it.qtd_deduzida_estoque) || 0
      }))
      : [{ produto_nome: '', cor: '', personalizacao: '', observacao: '', quantidade: 1, preco_unitario: 0, subtotal: 0, foto_anexo: '', foto_nome: '', estoque_id: 'auto', estoque_item_id: null, estoque_item_nome: null, qtd_deduzida_estoque: 0 }];

    this.renderItensTable();
    App.openModal('modal-encomenda');
  },

  addItemRow() {
    encomendaItensTemp.push({
      produto_nome: '',
      cor: '',
      personalizacao: '',
      observacao: '',
      quantidade: 1,
      preco_unitario: 0,
      subtotal: 0,
      foto_anexo: '',
      foto_nome: '',
      estoque_id: 'auto',
      estoque_item_id: null,
      estoque_item_nome: null,
      qtd_deduzida_estoque: 0
    });
    this.renderItensTable();
  },

  removeItemRow(index) {
    if (encomendaItensTemp.length > 1) {
      encomendaItensTemp.splice(index, 1);
      this.renderItensTable();
    }
  },

  selecionarHistorico3D(index, historicoId) {
    const item = encomendaItensTemp[index];
    if (!item) return;
    if (!historicoId) {
      item.calc_3d_historico_id = '';
      return;
    }
    const historico = StorageService.get('calc_3d_historico') || [];
    const h = historico.find(rec => rec.id === historicoId);
    if (!h) return;

    const precoUnit = Number(h.preco_venda_unitario) || (Number(h.preco_venda_total) / (Number(h.quantidade_pecas) || 1)) || Number(h.custo_unitario) || 0;
    const qtdLote = Math.max(1, Number(h.quantidade_pecas) || 1);
    const gramasUnit = (Number(h.gramas) || 0) / qtdLote;
    item.calc_3d_historico_id = h.id;
    item.calc_3d_filamento_id = h.filamento_id || '';
    item.gramas_unitario = Number(gramasUnit.toFixed(2));
    item.filamentos_usados_unitario = (Array.isArray(h.filamentos_usados) && h.filamentos_usados.length > 0)
      ? h.filamentos_usados.map(u => ({
          filamento_id: u.filamento_id || '',
          cor: u.cor || '',
          material: u.material || '',
          gramas_unitario: Number(((Number(u.gramas) || 0) / qtdLote).toFixed(2))
        }))
      : [];
    item.produto_nome = h.produto_nome || item.produto_nome;
    item.preco_unitario = Number(precoUnit.toFixed(2));
    item.subtotal = (Number(item.quantidade) || 1) * item.preco_unitario;

    const coresDisponiveis = StorageService.getCoresDisponiveis() || [];
    const filamentos = StorageService.get('filamentos') || [];
    const fil = h.filamento_id ? filamentos.find(f => f.id === h.filamento_id) : null;
    const corCandidata = fil?.cor || '';
    let corEncontrada = coresDisponiveis.find(c => c.toLowerCase() === corCandidata.toLowerCase());
    if (!corEncontrada && h.filamento_nome) {
      const fnLower = h.filamento_nome.toLowerCase();
      corEncontrada = coresDisponiveis.find(c => fnLower.includes(c.toLowerCase()));
    }
    if (corEncontrada) item.cor = corEncontrada;

    if (h.observacoes && !item.observacao) {
      item.observacao = h.observacoes;
    }

    this.renderItensTable();
    App.toast(`Item 3D carregado: "${item.produto_nome}" (${App.formatMoney(item.preco_unitario)}/un) 🧵`, 'success');
  },

  updateItemField(index, field, value) {
    const item = encomendaItensTemp[index];
    if (!item) return;
    item[field] = value;
    if (field === 'produto_nome') {
      const titleEl = document.getElementById(`enc-item-title-${index}`);
      if (titleEl) {
        titleEl.textContent = value.trim() || 'Selecione ou digite o produto';
      }
      this.atualizarBadgeEstoqueItem(index);
    } else if (field === 'cor') {
      this.atualizarBadgeEstoqueItem(index);
    }
  },

  updateItemEstoqueId(index, value) {
    const item = encomendaItensTemp[index];
    if (!item) return;
    item.estoque_id = value;
    this.atualizarBadgeEstoqueItem(index);
  },

  updateItemCalc(index, field, value) {
    const item = encomendaItensTemp[index];
    if (!item) return;
    item[field] = value;
    const q = Number(item.quantidade) || 0;
    const p = Number(item.preco_unitario) || 0;
    item.subtotal = q * p;

    const subtotalEl = document.getElementById(`enc-item-subtotal-${index}`);
    if (subtotalEl) {
      subtotalEl.textContent = App.formatMoney(item.subtotal);
    }

    const total = encomendaItensTemp.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);
    const totalEl = document.getElementById('enc-itens-total-badge');
    if (totalEl) totalEl.textContent = App.formatMoney(total);

    if (field === 'quantidade') {
      this.atualizarBadgeEstoqueItem(index);
    }
  },

  encontrarItemEstoque(produtoNome, cor, estoqueId = null) {
    const itensEstoque = StorageService.get('estoque') || [];
    if (estoqueId && estoqueId !== 'auto' && estoqueId !== 'none') {
      return itensEstoque.find(e => e.id === estoqueId) || null;
    }
    if (estoqueId === 'none' || !produtoNome) return null;

    const norm = (s) => String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

    const nomeNorm = norm(produtoNome);
    const corNorm = norm(cor);

    const matchNomeExato = (e) => norm(e.nome) === nomeNorm;
    const matchNomeInclusao = (e) => {
      const eNome = norm(e.nome);
      return eNome && (eNome.includes(nomeNorm) || nomeNorm.includes(eNome));
    };

    if (corNorm) {
      // 1. Nome exato + mesma cor
      const m1 = itensEstoque.find(e => matchNomeExato(e) && norm(e.cor) === corNorm);
      if (m1) return m1;

      // 2. Nome por inclusão + mesma cor
      const m2 = itensEstoque.find(e => matchNomeInclusao(e) && norm(e.cor) === corNorm);
      if (m2) return m2;

      // 3. Fallback seguro: somente itens de estoque SEM cor definida (nunca baixa de outra cor!)
      const m3 = itensEstoque.find(e => matchNomeExato(e) && !norm(e.cor));
      if (m3) return m3;

      const m4 = itensEstoque.find(e => matchNomeInclusao(e) && !norm(e.cor));
      if (m4) return m4;

      return null;
    }

    // Sem cor informada no pedido: prioriza item sem cor, depois qualquer cor com nome exato ou inclusão
    return (
      itensEstoque.find(e => matchNomeExato(e) && !norm(e.cor)) ||
      itensEstoque.find(e => matchNomeExato(e)) ||
      itensEstoque.find(e => matchNomeInclusao(e) && !norm(e.cor)) ||
      itensEstoque.find(e => matchNomeInclusao(e)) ||
      null
    );
  },

  atualizarBadgeEstoqueItem(index) {
    const item = encomendaItensTemp[index];
    if (!item) return;
    const badgeEl = document.getElementById(`enc-item-estoque-badge-${index}`);
    if (!badgeEl) return;

    const estoqueMatch = this.encontrarItemEstoque(item.produto_nome, item.cor, item.estoque_id);
    if (!estoqueMatch) {
      if (item.estoque_id === 'none') {
        badgeEl.innerHTML = `<span style="font-size: 0.74rem; color: var(--text-muted);">🚫 Baixa desativada para este item</span>`;
      } else {
        badgeEl.innerHTML = `<span style="font-size: 0.74rem; color: #fbbf24;">⚠️ Nenhum insumo coincidente (selecione abaixo ou cadastre no Estoque)</span>`;
      }
      return;
    }

    const qtdItem = Number(item.quantidade) || 1;
    const saldoAtual = Number(estoqueMatch.quantidade_atual) || 0;
    const qtdJaDeduzida = Number(item.qtd_deduzida_estoque) || 0;
    const saldoPrevisto = saldoAtual + qtdJaDeduzida - qtdItem;
    const isNegativo = saldoPrevisto < 0;

    badgeEl.innerHTML = `
      <span style="font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 6px; ${isNegativo ? 'background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4);' : 'background: rgba(52, 211, 153, 0.15); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.35);'}">
        Saldo atual: ${saldoAtual} ${estoqueMatch.unidade} ➔ Restará: ${saldoPrevisto} ${estoqueMatch.unidade} ${isNegativo ? '⚠️ Insuficiente!' : '✅'}
      </span>
    `;
  },

  encontrarFilamentoPorCor(cor, filamentoIdPreferido = null) {
    const filamentos = (StorageService.get('filamentos') || []).filter(f => f.ativo !== false);
    if (filamentos.length === 0) return null;

    const corNorm = (cor || '').toLowerCase().trim();
    if (corNorm) {
      if (filamentoIdPreferido) {
        const pref = filamentos.find(f => f.id === filamentoIdPreferido && (f.cor || '').toLowerCase().trim() === corNorm);
        if (pref) return pref;
      }
      const mesmaCor = filamentos.filter(f => (f.cor || '').toLowerCase().trim() === corNorm);
      if (mesmaCor.length > 0) {
        // Prioriza o rolo da mesma cor com maior peso atual disponível
        mesmaCor.sort((a, b) => {
          const pa = (a.peso_atual_g !== undefined && a.peso_atual_g !== null) ? Number(a.peso_atual_g) : (Number(a.peso_rolo_g) || 0);
          const pb = (b.peso_atual_g !== undefined && b.peso_atual_g !== null) ? Number(b.peso_atual_g) : (Number(b.peso_rolo_g) || 0);
          return pb - pa;
        });
        return mesmaCor[0];
      }
    }

    if (filamentoIdPreferido) {
      return filamentos.find(f => f.id === filamentoIdPreferido) || null;
    }
    return null;
  },

  deduzirFilamentosItens(itens) {
    const baixasFilamento = [];
    if (!itens || !Array.isArray(itens)) return baixasFilamento;
    const historico3D = StorageService.get('calc_3d_historico') || [];

    itens.forEach(item => {
      // Evita dupla baixa caso já tenha sido deduzido ao salvar o orçamento
      const jaDeduzidoMulti = Array.isArray(item.filamentos_deduzidos) && item.filamentos_deduzidos.length > 0;
      const jaDeduzidoUnico = item.filamento_deduzido_id && Number(item.filamento_deduzido_g) > 0;
      if (jaDeduzidoMulti || jaDeduzidoUnico) {
        return;
      }

      const qtd = Math.max(1, Number(item.quantidade) || 1);

      // 1. Verifica se o item possui múltiplas cores/filamentos salvos (impressão multicolorida)
      let listaMulti = (Array.isArray(item.filamentos_usados_unitario) && item.filamentos_usados_unitario.length > 0)
        ? item.filamentos_usados_unitario
        : [];

      if (listaMulti.length === 0 && item.calc_3d_historico_id) {
        const h = historico3D.find(rec => rec.id === item.calc_3d_historico_id);
        if (h && Array.isArray(h.filamentos_usados) && h.filamentos_usados.length > 0) {
          const qtdLote = Math.max(1, Number(h.quantidade_pecas) || 1);
          listaMulti = h.filamentos_usados.map(u => ({
            filamento_id: u.filamento_id || '',
            cor: u.cor || '',
            material: u.material || '',
            gramas_unitario: Number(((Number(u.gramas) || 0) / qtdLote).toFixed(2))
          }));
          item.filamentos_usados_unitario = listaMulti;
        }
      }

      if (listaMulti.length > 0) {
        const deduzidos = [];
        listaMulti.forEach(u => {
          const gUnit = Number(u.gramas_unitario) || 0;
          if (gUnit <= 0) return;
          const pesoConsumido = Math.round(gUnit * qtd * 10) / 10;
          const fil = this.encontrarFilamentoPorCor(u.cor || item.cor, u.filamento_id || null);
          if (fil) {
            const pesoOriginal = Number(fil.peso_rolo_g) || 1000;
            const pesoAtual = (fil.peso_atual_g !== undefined && fil.peso_atual_g !== null) ? Number(fil.peso_atual_g) : pesoOriginal;
            const novoPesoAtual = Math.max(0, Math.round((pesoAtual - pesoConsumido) * 10) / 10);

            StorageService.update('filamentos', fil.id, { peso_atual_g: novoPesoAtual });
            deduzidos.push({ filamento_id: fil.id, gramas: pesoConsumido });
            baixasFilamento.push(`-${pesoConsumido}g ${fil.material || 'Filamento'} ${fil.cor || ''} (restam ${novoPesoAtual}g)`);
          }
        });
        item.filamentos_deduzidos = deduzidos;
        item.filamento_deduzido_id = null;
        item.filamento_deduzido_g = 0;
        return;
      }

      // 2. Fallback: item de cor única
      let gramasUnit = Number(item.gramas_unitario) || 0;
      let filIdPref = item.calc_3d_filamento_id || null;

      if ((!gramasUnit || !filIdPref) && item.calc_3d_historico_id) {
        const h = historico3D.find(rec => rec.id === item.calc_3d_historico_id);
        if (h) {
          if (!gramasUnit) {
            gramasUnit = (Number(h.gramas) || 0) / Math.max(1, Number(h.quantidade_pecas) || 1);
            item.gramas_unitario = Number(gramasUnit.toFixed(2));
          }
          if (!filIdPref && h.filamento_id) {
            filIdPref = h.filamento_id;
            item.calc_3d_filamento_id = filIdPref;
          }
        }
      }

      if (gramasUnit <= 0) {
        item.filamento_deduzido_id = null;
        item.filamento_deduzido_g = 0;
        item.filamentos_deduzidos = [];
        return;
      }

      const pesoConsumido = Math.round(gramasUnit * qtd * 10) / 10;
      const fil = this.encontrarFilamentoPorCor(item.cor, filIdPref);

      if (fil) {
        const pesoOriginal = Number(fil.peso_rolo_g) || 1000;
        const pesoAtual = (fil.peso_atual_g !== undefined && fil.peso_atual_g !== null) ? Number(fil.peso_atual_g) : pesoOriginal;
        const novoPesoAtual = Math.max(0, Math.round((pesoAtual - pesoConsumido) * 10) / 10);

        StorageService.update('filamentos', fil.id, {
          peso_atual_g: novoPesoAtual
        });

        item.filamento_deduzido_id = fil.id;
        item.filamento_deduzido_g = pesoConsumido;
        item.filamentos_deduzidos = [{ filamento_id: fil.id, gramas: pesoConsumido }];
        baixasFilamento.push(`-${pesoConsumido}g ${fil.material || 'Filamento'} ${fil.cor || ''} (restam ${novoPesoAtual}g)`);
      } else {
        item.filamento_deduzido_id = null;
        item.filamento_deduzido_g = 0;
        item.filamentos_deduzidos = [];
      }
    });

    if (baixasFilamento.length > 0 && typeof EstoqueModule !== 'undefined' && EstoqueModule.renderFilamentos) {
      EstoqueModule.renderFilamentos();
    }
    return baixasFilamento;
  },

  estornarFilamentosItens(itens) {
    if (!itens || !Array.isArray(itens)) return;
    let houveEstorno = false;
    itens.forEach(it => {
      if (Array.isArray(it.filamentos_deduzidos) && it.filamentos_deduzidos.length > 0) {
        it.filamentos_deduzidos.forEach(d => {
          if (d.filamento_id && Number(d.gramas) > 0) {
            const fil = (StorageService.get('filamentos') || []).find(f => f.id === d.filamento_id);
            if (fil) {
              const pesoAtual = (fil.peso_atual_g !== undefined && fil.peso_atual_g !== null) ? Number(fil.peso_atual_g) : (Number(fil.peso_rolo_g) || 0);
              const novoPesoAtual = Math.round((pesoAtual + Number(d.gramas)) * 10) / 10;
              StorageService.update('filamentos', fil.id, { peso_atual_g: novoPesoAtual });
              houveEstorno = true;
            }
          }
        });
        it.filamentos_deduzidos = [];
        it.filamento_deduzido_id = null;
        it.filamento_deduzido_g = 0;
      } else if (it.filamento_deduzido_id && Number(it.filamento_deduzido_g) > 0) {
        const fil = (StorageService.get('filamentos') || []).find(f => f.id === it.filamento_deduzido_id);
        if (fil) {
          const pesoAtual = (fil.peso_atual_g !== undefined && fil.peso_atual_g !== null) ? Number(fil.peso_atual_g) : (Number(fil.peso_rolo_g) || 0);
          const novoPesoAtual = Math.round((pesoAtual + Number(it.filamento_deduzido_g)) * 10) / 10;
          StorageService.update('filamentos', fil.id, { peso_atual_g: novoPesoAtual });
          houveEstorno = true;
        }
        it.filamento_deduzido_id = null;
        it.filamento_deduzido_g = 0;
      }
    });
    if (houveEstorno && typeof EstoqueModule !== 'undefined' && EstoqueModule.renderFilamentos) {
      EstoqueModule.renderFilamentos();
    }
  },

  estornarEstoque(enc) {
    if (!enc || !enc.itens) return;
    enc.itens.forEach(it => {
      if (it.estoque_item_id && it.qtd_deduzida_estoque) {
        const mat = StorageService.get('estoque').find(m => m.id === it.estoque_item_id);
        if (mat) {
          const estornado = Number(mat.quantidade_atual) + Number(it.qtd_deduzida_estoque);
          StorageService.update('estoque', mat.id, { quantidade_atual: estornado });
        }
      }
    });
    this.estornarFilamentosItens(enc.itens);
  },

  deduzirEstoque(enc) {
    if (!enc || !enc.itens) return;
    enc.itens.forEach(it => {
      if (it.estoque_item_id && it.qtd_deduzida_estoque) {
        const mat = StorageService.get('estoque').find(m => m.id === it.estoque_item_id);
        if (mat) {
          const novoSaldo = Math.max(0, Number(mat.quantidade_atual) - Number(it.qtd_deduzida_estoque));
          StorageService.update('estoque', mat.id, { quantidade_atual: novoSaldo });
        }
      }
    });
    this.deduzirFilamentosItens(enc.itens);
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
    const container = document.getElementById('enc-itens-container') || document.getElementById('enc-itens-tbody');
    if (!container) return;

    // Atualiza opções do datalist com produtos estabelecidos (apenas nomes!)
    const datalist = document.getElementById('enc-datalist-produtos');
    const estoqueItens = StorageService.get('estoque') || [];

    if (datalist) {
      const prodsEstabelecidos = StorageService.getProdutosEstabelecidos();
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

    const coresDisponiveis = StorageService.getCoresDisponiveis();
    const historico3D = [...(StorageService.get('calc_3d_historico') || [])].sort((a, b) =>
      String(a.produto_nome || '').localeCompare(String(b.produto_nome || ''), 'pt-BR', { numeric: true, sensitivity: 'base' })
    );

    let total = 0;

    container.innerHTML = encomendaItensTemp.map((item, idx) => {
      total += (Number(item.subtotal) || 0);
      const corAtual = item.cor || '';

      const estoqueMatch = this.encontrarItemEstoque(item.produto_nome, item.cor, item.estoque_id);
      const qtdItem = Number(item.quantidade) || 1;
      const saldoAtual = estoqueMatch ? Number(estoqueMatch.quantidade_atual) || 0 : 0;
      const qtdJaDeduzida = Number(item.qtd_deduzida_estoque) || 0;
      const saldoPrevisto = estoqueMatch ? (saldoAtual + qtdJaDeduzida - qtdItem) : 0;
      const isNegativo = saldoPrevisto < 0;

      return `
        <div class="enc-item-card" style="background: rgba(255, 255, 255, 0.025); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 10px; padding: 14px 16px; margin-bottom: 14px; box-shadow: 0 4px 14px rgba(0,0,0,0.25);">
          <!-- Topo do Item -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; margin-bottom: 12px; border-bottom: 1px solid rgba(255, 255, 255, 0.07);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 0.72rem; font-weight: 800; text-transform: uppercase; padding: 2px 8px; border-radius: 999px; background: rgba(0, 168, 243, 0.18); color: #38bdf8; border: 1px solid rgba(0, 168, 243, 0.45);">
                Item #${idx + 1}
              </span>
              <span id="enc-item-title-${idx}" style="font-size: 0.84rem; font-weight: 600; color: #ffffff;">
                ${App.escapeHtml(item.produto_nome || 'Selecione ou digite o produto')}
              </span>
            </div>
            ${encomendaItensTemp.length > 1 ? `
              <button type="button" style="display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; flex-shrink: 0; background: rgba(239, 68, 68, 0.14); border: 1px solid rgba(239, 68, 68, 0.45); color: #f87171; cursor: pointer; padding: 5px 10px; border-radius: 6px; font-size: 0.76rem; font-weight: 600;" 
                      onclick="EncomendasModule.removeItemRow(${idx})" title="Remover este item">
                ✕ Excluir Item
              </button>
            ` : ''}
          </div>

          <!-- Puxar item pré-salvo da Calculadora de Filamentos (Histórico 3D) -->
          <div class="form-group" style="margin-bottom: 10px; background: rgba(245, 158, 11, 0.06); border: 1px dashed rgba(245, 158, 11, 0.35); border-radius: 8px; padding: 8px 10px;">
            <label style="font-size: 0.74rem; font-weight: 700; color: #fbbf24; display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 5px;">
              <span>🏷️ Itens Pré-salvos — Tabela de Preço (Histórico 3D)</span>
              <span style="font-size: 0.68rem; font-weight: 600; color: var(--text-muted);">${historico3D.length} ${historico3D.length === 1 ? 'item salvo' : 'itens salvos'}</span>
            </label>
            <select class="form-control" style="height: 36px; font-size: 0.82rem;"
                    onchange="EncomendasModule.selecionarHistorico3D(${idx}, this.value)">
              <option value="">${historico3D.length > 0 ? '— Selecionar peça salva no Histórico 3D (preenche nome e preço) —' : 'Nenhum item salvo no Histórico 3D ainda'}</option>
              ${historico3D.map(h => {
        const precoUnit = Number(h.preco_venda_unitario) || (Number(h.preco_venda_total) / (Number(h.quantidade_pecas) || 1)) || Number(h.custo_unitario) || 0;
        const label = `${h.produto_nome || 'Peça 3D'} — ${App.formatMoney(precoUnit)}/un (${h.filamento_nome || '3D'}${h.gramas ? ` • ${h.gramas}g` : ''})`;
        return `<option value="${App.escapeHtml(h.id)}" ${item.calc_3d_historico_id === h.id ? 'selected' : ''}>${App.escapeHtml(label)}</option>`;
      }).join('')}
            </select>
          </div>

          <!-- Linha 1: Produto e Cor -->
          <div class="form-row" style="margin-bottom: 10px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 0.78rem; font-weight: 600; color: var(--text-primary);">Produto *</label>
              <input type="text" list="enc-datalist-produtos" class="form-control" style="height: 38px;" 
                     value="${App.escapeHtml(item.produto_nome || '')}" 
                     placeholder="Selecione da lista ou digite..." 
                     oninput="EncomendasModule.updateItemField(${idx}, 'produto_nome', this.value)">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 0.78rem; font-weight: 600; color: var(--text-primary);">Cor</label>
              <select class="form-control" style="height: 38px;" 
                      onchange="EncomendasModule.updateItemField(${idx}, 'cor', this.value)">
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
                      oninput="EncomendasModule.updateItemField(${idx}, 'personalizacao', this.value)">${App.escapeHtml(item.personalizacao || '')}</textarea>
          </div>

          <!-- Linha 2B: Observação do Item -->
          <div class="form-group" style="margin-bottom: 10px;">
            <label style="font-size: 0.78rem; font-weight: 600; color: var(--text-primary);">Observação do Item</label>
            <input type="text" class="form-control" style="height: 38px;" 
                   value="${App.escapeHtml(item.observacao || '')}" 
                   placeholder="Ex: Acabamento especial, tamanho, embalagem..." 
                   oninput="EncomendasModule.updateItemField(${idx}, 'observacao', this.value)">
          </div>

          <!-- Linha 2C: Foto / Arte de Referência individual deste Item -->
          <div class="form-group" style="margin-bottom: 12px;">
            <label style="font-size: 0.78rem; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 5px;">
              <span>📷</span> Foto / Arte de Referência (Item #${idx + 1})
            </label>
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; background: rgba(255,255,255,0.02); border: 1px dashed rgba(56, 189, 248, 0.35); border-radius: 6px; padding: 8px 10px;">
              <input type="file" id="enc-item-foto-input-${idx}" accept="image/*" style="display: none;" onchange="EncomendasModule.onItemFotoSelected(${idx}, this)">
              <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('enc-item-foto-input-${idx}').click()" style="font-size: 0.76rem; padding: 5px 10px;">
                📎 ${item.foto_anexo ? 'Trocar Foto' : 'Inserir Foto'}
              </button>
              ${item.foto_anexo ? `
                <div style="display: flex; align-items: center; gap: 8px; flex: 1; min-width: 160px;">
                  <img src="${item.foto_anexo}" alt="Referência Item #${idx + 1}" onclick="EncomendasModule.abrirItemFotoPreview(${idx})" title="Clique para ampliar em tela cheia e baixar"
                       style="width: 42px; height: 42px; object-fit: cover; border-radius: 6px; border: 1.5px solid rgba(56, 189, 248, 0.55); cursor: pointer;">
                  <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 0.74rem; color: #ffffff; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${App.escapeHtml(item.foto_nome || 'foto-anexo.jpg')}</div>
                    <div style="font-size: 0.66rem; color: var(--text-muted);">Clique na foto para ampliar</div>
                  </div>
                  <button type="button" class="btn btn-secondary btn-icon" onclick="EncomendasModule.removerItemFoto(${idx})" title="Remover foto deste item" style="padding: 4px 7px; color: #f87171;">
                    🗑️
                  </button>
                </div>
              ` : `
                <span style="font-size: 0.73rem; color: var(--text-muted);">Opcional — arte ou foto de referência exclusiva deste item</span>
              `}
            </div>
          </div>

          <!-- Linha 3: Quantidade, Valor Unitário e Subtotal -->
          <div class="form-row" style="margin-bottom: 12px; align-items: flex-end;">
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 0.78rem; font-weight: 600; color: var(--text-primary);">Quantidade</label>
              <input type="number" min="1" class="form-control" style="height: 38px;" 
                     value="${item.quantidade || 1}" 
                     oninput="EncomendasModule.updateItemCalc(${idx}, 'quantidade', this.value)">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 0.78rem; font-weight: 600; color: var(--text-primary);">Valor Unitário (R$)</label>
              <input type="number" step="0.5" class="form-control" style="height: 38px;" 
                     value="${item.preco_unitario || 0}" 
                     placeholder="0,00"
                     oninput="EncomendasModule.updateItemCalc(${idx}, 'preco_unitario', this.value)">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 0.78rem; font-weight: 600; color: var(--text-primary);">Subtotal</label>
              <div id="enc-item-subtotal-${idx}" style="height: 38px; display: flex; align-items: center; font-size: 1.05rem; font-weight: 700; color: #34d399; background: rgba(0,0,0,0.25); border: 1px solid var(--border); border-radius: 6px; padding: 0 12px;">
                ${App.formatMoney(item.subtotal || 0)}
              </div>
            </div>
          </div>

          <!-- Linha 4: Baixa de Material do Estoque em Tempo Real -->
          <div style="background: rgba(0, 0, 0, 0.28); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 10px 12px; margin-bottom: 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 6px;">
              <span style="font-size: 0.78rem; font-weight: 700; color: #38bdf8; display: inline-flex; align-items: center; gap: 5px;">
                📦 Baixa no Estoque (Diminui automaticamente ao salvar):
              </span>
              <div id="enc-item-estoque-badge-${idx}">
                ${estoqueMatch ? `
                  <span style="font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 6px; ${isNegativo ? 'background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.4);' : 'background: rgba(52, 211, 153, 0.15); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.35);'}">
                    Saldo atual: ${saldoAtual} ${estoqueMatch.unidade} ➔ Restará: ${saldoPrevisto} ${estoqueMatch.unidade} ${isNegativo ? '⚠️ Insuficiente!' : '✅'}
                  </span>
                ` : `
                  <span style="font-size: 0.74rem; color: ${item.estoque_id === 'none' ? 'var(--text-muted)' : '#fbbf24'};">
                    ${item.estoque_id === 'none' ? '🚫 Baixa desativada' : '⚠️ Nenhum insumo coincidente (selecione abaixo ou cadastre no Estoque)'}
                  </span>
                `}
              </div>
            </div>

            <select class="form-control" style="height: 36px; font-size: 0.82rem;" 
                    onchange="EncomendasModule.updateItemEstoqueId(${idx}, this.value)">
              <option value="auto" ${item.estoque_id === 'auto' || !item.estoque_id ? 'selected' : ''}>
                ⚡ Automático (Detectar pelo Produto e Cor)
              </option>
              <option value="none" ${item.estoque_id === 'none' ? 'selected' : ''}>
                🚫 Não dar baixa de estoque neste item
              </option>
              <optgroup label="Ou vincule manualmente a um insumo do estoque:">
                ${estoqueItens.map(e => `
                  <option value="${e.id}" ${item.estoque_id === e.id ? 'selected' : ''}>
                    ${App.escapeHtml(e.nome)} ${e.cor ? '🎨 ' + App.escapeHtml(e.cor) : ''} (Saldo: ${e.quantidade_atual} ${e.unidade})
                  </option>
                `).join('')}
              </optgroup>
            </select>
          </div>
        </div>
      `;
    }).join('');

    const totalEl = document.getElementById('enc-itens-total-badge');
    if (totalEl) totalEl.textContent = App.formatMoney(total);
  },

  save() {
    const id = document.getElementById('enc-form-id').value;
    const cliente = document.getElementById('enc-form-cliente').value.trim();
    const categoria = document.getElementById('enc-form-categoria')?.value || '3D';
    const telefone = document.getElementById('enc-form-telefone').value.trim();
    const dataOrcamento = document.getElementById('enc-form-data-orcamento')?.value || '';
    const dataConfirmacao = document.getElementById('enc-form-data-confirmacao')?.value || '';
    const dataPedido = dataConfirmacao || dataOrcamento || new Date().toISOString().split('T')[0];
    const dataEntrega = document.getElementById('enc-form-data-entrega').value;
    const status = document.getElementById('enc-form-status').value || 'Fila';
    const pagtoStatus = document.getElementById('enc-form-pagto-status').value;
    const formaPagto = document.getElementById('enc-form-forma-pagto').value;
    const valorPago = parseFloat(document.getElementById('enc-form-valor-pago').value) || 0;
    const obs = document.getElementById('enc-form-obs').value.trim();

    if (!cliente) {
      App.toast('Por favor, informe o nome do cliente.', 'error');
      return;
    }

    const valorTotal = encomendaItensTemp.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);

    // 1. Se estiver editando uma encomenda existente que não estava Cancelada, estorna baixas anteriores
    const encAntiga = id ? StorageService.get('encomendas').find(e => e.id === id) : null;
    if (encAntiga && encAntiga.status !== 'Cancelada' && encAntiga.itens) {
      this.estornarEstoque(encAntiga);
    }

    // 2. Processa as novas baixas no estoque de materiais e filamentos em tempo real
    const baixasRealizadas = [];
    encomendaItensTemp.forEach(item => {
      item.filamento_deduzido_id = null;
      item.filamento_deduzido_g = 0;
      item.filamentos_deduzidos = [];
    });

    if (status !== 'Cancelada') {
      encomendaItensTemp.forEach(item => {
        const mat = this.encontrarItemEstoque(item.produto_nome, item.cor, item.estoque_id);
        if (mat) {
          const qtdADeduzir = Number(item.quantidade) || 0;
          const matAtualizado = StorageService.get('estoque').find(m => m.id === mat.id) || mat;
          const novoSaldo = Math.max(0, Number(matAtualizado.quantidade_atual) - qtdADeduzir);

          StorageService.update('estoque', mat.id, { quantidade_atual: novoSaldo });

          item.estoque_item_id = mat.id;
          item.estoque_item_nome = mat.nome;
          item.qtd_deduzida_estoque = qtdADeduzir;

          baixasRealizadas.push(`${qtdADeduzir}x ${mat.nome} (restam ${novoSaldo} ${mat.unidade})`);
        } else {
          item.estoque_item_id = null;
          item.estoque_item_nome = null;
          item.qtd_deduzida_estoque = 0;
        }
      });

      const baixasFil = this.deduzirFilamentosItens(encomendaItensTemp);
      baixasFil.forEach(b => baixasRealizadas.push(`🧵 ${b}`));
    } else {
      encomendaItensTemp.forEach(item => {
        item.qtd_deduzida_estoque = 0;
      });
    }

    const payload = {
      cliente_nome: cliente,
      categoria: categoria,
      telefone: telefone,
      data_orcamento: dataOrcamento || null,
      data_confirmacao: dataConfirmacao || null,
      data_pedido: dataPedido,
      data_entrega_prevista: dataEntrega,
      status: status,
      pagamento_status: pagtoStatus,
      forma_pagamento: formaPagto,
      valor_total: valorTotal,
      valor_pago: valorPago,
      observacoes: obs,
      responsavel: (encAntiga && encAntiga.responsavel && encAntiga.responsavel !== 'Sistema')
        ? encAntiga.responsavel
        : StorageService.getActiveProprietario(),
      foto_anexo: encomendaFotoTemp.dataUrl || null,
      foto_nome: encomendaFotoTemp.nome || null,
      itens: encomendaItensTemp
    };

    if (id) {
      StorageService.update('encomendas', id, payload);
      let msg = 'Encomenda atualizada!';
      if (baixasRealizadas.length > 0) {
        msg += ` 📦 Estoque: ${baixasRealizadas.join(', ')}`;
      }
      App.toast(msg, 'success');
    } else {
      StorageService.insert('encomendas', payload);
      let msg = 'Encomenda registrada na Fila de Espera! ⏳';
      if (baixasRealizadas.length > 0) {
        msg += ` 📦 Estoque: ${baixasRealizadas.join(', ')}`;
      }
      App.toast(msg, 'success');
    }

    App.closeModal('modal-encomenda');
    this.render();
    window.dispatchEvent(new CustomEvent('seven_data_updated', { detail: { table: 'estoque' } }));
    if (typeof EstoqueModule !== 'undefined') EstoqueModule.render();
    if (typeof App !== 'undefined' && App.renderDashboard) App.renderDashboard();
  },

  deleteCurrent() {
    const id = document.getElementById('enc-form-id').value;
    if (!id) return;
    if (confirm('Tem certeza que deseja cancelar e excluir esta encomenda?')) {
      const enc = StorageService.get('encomendas').find(e => e.id === id);
      if (enc && enc.status !== 'Cancelada' && enc.itens) {
        this.estornarEstoque(enc);
      }
      StorageService.delete('encomendas', id);
      App.toast('Encomenda excluída e materiais devolvidos ao estoque.', 'info');
      App.closeModal('modal-encomenda');
      this.render();
      window.dispatchEvent(new CustomEvent('seven_data_updated', { detail: { table: 'estoque' } }));
      if (typeof EstoqueModule !== 'undefined') EstoqueModule.render();
      if (typeof App !== 'undefined' && App.renderDashboard) App.renderDashboard();
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
    App.toast('Encomenda marcada como Entregue e movida para Finalizados! 🎉', 'success');
    this.render();
    this.renderFinalizados();
    App.renderDashboard();
  },

  renderFinalizados() {
    const encomendas = StorageService.get('encomendas');
    const finalizadas = encomendas.filter(e => {
      // Encomendas com status Entregue ou Cancelada vão SEMPRE para Finalizados
      if (e.status === 'Entregue' || e.status === 'Cancelada') return true;
      // Encomendas Prontas com pagamento quitado também vão para Finalizados
      return e.status === 'Pronto' && e.pagamento_status === 'Pago';
    }).sort((a, b) => ((b.data_entrega_prevista || b.data_pedido || '') > (a.data_entrega_prevista || a.data_pedido || '') ? 1 : -1));

    const totalFaturado = finalizadas.reduce((acc, e) => {
      if (e.status === 'Cancelada') return acc;
      return acc + (Number(e.valor_pago) || Number(e.valor_total) || 0);
    }, 0);
    const totalEl = document.getElementById('finalizados-total-valor');
    if (totalEl) totalEl.textContent = App.formatMoney(totalFaturado);

    const totalQtdEl = document.getElementById('finalizados-total-qtd');
    if (totalQtdEl) totalQtdEl.textContent = finalizadas.length;

    const tbody = document.getElementById('finalizados-table-body');
    if (!tbody) return;

    if (finalizadas.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 36px; color: var(--text-muted);"><div style="font-size: 1.5rem; margin-bottom: 8px;">✅</div>Nenhuma encomenda finalizada ainda. Quando uma encomenda for marcada como Entregue, Cancelada ou estiver Pronta e Quitada, ela aparecerá automaticamente aqui no histórico.</td></tr>`;
      return;
    }

    tbody.innerHTML = finalizadas.map(enc => {
      const totalItens = (enc.itens || []).reduce((acc, it) => acc + (Number(it.quantidade) || 0), 0);
      const nomesProdutos = (enc.itens || []).map(i => {
        const corStr = i.cor ? ` [${i.cor}]` : '';
        const obsStr = i.observacao ? ` (Obs: ${i.observacao})` : '';
        return `${i.quantidade}x ${i.produto_nome || 'Item'}${corStr}${obsStr}`;
      }).join(', ');

      const coresList = [...new Set((enc.itens || []).filter(i => i.cor).map(i => i.cor))];
      const hasItemObs = (enc.itens || []).some(i => i.observacao && i.observacao.trim());

      const numPedido = StorageService.formatOrderNumber(enc);

      return `
        <tr class="dash-row-clickable" data-enc-id="${enc.id}" onclick="EncomendasModule.openEditModal('${enc.id}')" title="Clique para abrir detalhes da encomenda ${numPedido}">
          <td>
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px; flex-wrap: wrap;">
              <strong>${numPedido}</strong>
              ${this.getCategoriaBadge(enc.categoria)}
            </div>
            <div style="font-size: 0.76rem; color: var(--text-muted);">${App.formatDate(enc.data_pedido)}</div>
          </td>
          <td>
            <div style="font-weight: 600; color: var(--text-primary);">${App.escapeHtml(enc.cliente_nome)}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">${App.escapeHtml(enc.telefone || 'Sem fone')}</div>
          </td>
          <td>
            <div style="font-size: 0.85rem; max-width: 290px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${App.escapeHtml(nomesProdutos)}">
              ${App.escapeHtml(nomesProdutos || 'Item personalizado')}
            </div>
            <div style="font-size: 0.74rem; display: flex; align-items: center; gap: 6px; margin-top: 2px; flex-wrap: wrap;">
              <span style="color: var(--accent);">Total: ${totalItens} peças</span>
              ${coresList.length > 0 ? `
                <span class="badge-cor-tag" title="Cores: ${coresList.join(', ')}">
                  🎨 ${App.escapeHtml(coresList.join(', '))}
                </span>
              ` : ''}
              ${hasItemObs ? `
                <span class="badge-cor-tag" style="background: rgba(168, 85, 247, 0.14); color: #c084fc; border-color: rgba(168, 85, 247, 0.4);" title="Há observações nos produtos">
                  📌 Obs no Item
                </span>
              ` : ''}
              ${(enc.itens || []).some(i => i.qtd_deduzida_estoque > 0) ? `
                <span class="badge-cor-tag" style="background: rgba(16, 185, 129, 0.14); color: #34d399; border-color: rgba(16, 185, 129, 0.4);" title="Insumos deduzidos do estoque em tempo real">
                  📦 Estoque Baixado
                </span>
              ` : ''}
              ${enc.observacoes ? `
                <span class="badge-cor-tag" style="background: rgba(245, 158, 11, 0.12); color: #fbbf24; border-color: rgba(245, 158, 11, 0.35);" title="Observações Gerais: ${App.escapeHtml(enc.observacoes)}">
                  📝 Obs Geral
                </span>
              ` : ''}
            </div>
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
  },

  async onFotoSelected(input) {
    const file = input?.files?.[0];
    if (!file) return;
    try {
      const res = await App.compressImageFile(file);
      encomendaFotoTemp = res;
      this.renderFotoPreview();
      App.toast('Foto anexada à encomenda! 📷', 'success');
    } catch (err) {
      console.error('Erro ao processar foto da encomenda:', err);
      App.toast('Não foi possível carregar a imagem.', 'error');
    }
    input.value = '';
  },

  renderFotoPreview() {
    const box = document.getElementById('enc-foto-preview-box');
    const img = document.getElementById('enc-foto-preview-img');
    const nome = document.getElementById('enc-foto-preview-nome');
    const hint = document.getElementById('enc-foto-empty-hint');

    if (encomendaFotoTemp.dataUrl) {
      if (img) img.src = encomendaFotoTemp.dataUrl;
      if (nome) nome.textContent = encomendaFotoTemp.nome || 'anexo.jpg';
      if (box) box.style.display = 'flex';
      if (hint) hint.style.display = 'none';
    } else {
      if (img) img.src = '';
      if (box) box.style.display = 'none';
      if (hint) hint.style.display = 'inline';
    }
  },

  abrirFotoPreview() {
    if (!encomendaFotoTemp.dataUrl) return;
    App.openImageLightbox(encomendaFotoTemp.dataUrl, encomendaFotoTemp.nome || 'Foto da Encomenda', encomendaFotoTemp.nome || 'anexo-encomenda.jpg');
  },

  removerFoto() {
    encomendaFotoTemp = { dataUrl: '', nome: '' };
    this.renderFotoPreview();
  },

  async onItemFotoSelected(idx, input) {
    const file = input?.files?.[0];
    if (!file || !encomendaItensTemp[idx]) return;
    try {
      const res = await App.compressImageFile(file);
      encomendaItensTemp[idx].foto_anexo = res.dataUrl;
      encomendaItensTemp[idx].foto_nome = res.nome;
      this.renderItensTable();
      App.toast(`Foto anexada ao Item #${idx + 1}! 📷`, 'success');
    } catch (err) {
      console.error('Erro ao anexar foto ao item da encomenda:', err);
      App.toast('Não foi possível carregar a imagem.', 'error');
    }
    input.value = '';
  },

  abrirItemFotoPreview(idx) {
    const it = encomendaItensTemp[idx];
    if (!it || !it.foto_anexo) return;
    App.openImageLightbox(it.foto_anexo, it.produto_nome || `Item #${idx + 1}`, it.foto_nome || `anexo-item-${idx + 1}.jpg`);
  },

  removerItemFoto(idx) {
    if (!encomendaItensTemp[idx]) return;
    encomendaItensTemp[idx].foto_anexo = '';
    encomendaItensTemp[idx].foto_nome = '';
    this.renderItensTable();
  }
};
