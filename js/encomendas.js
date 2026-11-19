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
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(330px, 1fr)); gap: 16px;">
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

    const itensHtml = (enc.itens && enc.itens.length > 0)
      ? enc.itens.map(i => {
          const corStr = i.cor ? ` <span style="color: #38bdf8;">[${App.escapeHtml(i.cor)}]</span>` : '';
          const persStr = i.personalizacao ? ` <span style="color: var(--text-muted);">— ${App.escapeHtml(i.personalizacao)}</span>` : '';
          const obsStr = i.observacao ? `<div style="font-size: 0.72rem; color: #fbbf24; margin-left: 12px;">Obs: ${App.escapeHtml(i.observacao)}</div>` : '';
          return `<div style="margin-bottom: 3px;">• <strong>${i.quantidade}x</strong> ${App.escapeHtml(i.produto_nome || 'Item')}${corStr}${persStr}${obsStr}</div>`;
        }).join('')
      : `<div style="color: var(--text-muted);">• Item personalizado</div>`;

    const valorTotal = Number(enc.valor_total) || 0;
    const valorPago = Number(enc.valor_pago) || 0;
    const faltaPagar = Math.max(0, valorTotal - valorPago);

    const borderColor = isLate ? 'rgba(239, 68, 68, 0.6)' : (grupo?.borderColor || 'rgba(0, 168, 243, 0.4)');
    const cardShadow = isLate ? '0 4px 18px rgba(239, 68, 68, 0.14)' : '0 4px 16px rgba(0, 0, 0, 0.25)';

    return `
      <div class="panel-box dash-row-clickable" data-enc-id="${enc.id}"
           onclick="EncomendasModule.openEditModal('${enc.id}')"
           title="Clique para abrir detalhes completos da encomenda #${enc.id.substring(enc.id.length - 5)}"
           style="margin-bottom: 0; display: flex; flex-direction: column; justify-content: space-between; border-color: ${borderColor}; box-shadow: ${cardShadow}; background: rgba(15, 23, 42, 0.65); padding: 16px;">
        <div>
          <!-- Topo: #ID, Categoria e Prazo de Entrega -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; gap: 8px; flex-wrap: wrap;">
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <span style="font-size: 0.76rem; font-weight: 800; color: #ffffff; background: rgba(255,255,255,0.08); padding: 2px 8px; border-radius: 6px;">
                #${enc.id.substring(enc.id.length - 5)}
              </span>
              ${this.getCategoriaBadge(enc.categoria)}
            </div>
            <span style="font-size: 0.74rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; ${isLate ? 'background: rgba(239, 68, 68, 0.22); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.55);' : 'background: rgba(255, 255, 255, 0.05); color: var(--text-secondary); border: 1px solid var(--border);'}">
              ${isLate ? '🚨 Atrasado:' : '📅 Entrega:'} ${App.formatDate(enc.data_entrega_prevista)}
            </span>
          </div>

          <!-- Cliente e Telefone -->
          <h4 style="font-family: var(--font-display); font-size: 1.05rem; color: var(--text-primary); margin: 4px 0 2px 0;">
            👤 ${App.escapeHtml(enc.cliente_nome)}
          </h4>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 10px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <span>📞 ${App.escapeHtml(enc.telefone || 'Sem telefone')}</span>
            <span>• Pedido em ${App.formatDate(enc.data_pedido)}</span>
          </div>

          <!-- Caixa de Itens em Tópicos (igual ao visual de Orçamentos) -->
          <div style="font-size: 0.81rem; color: var(--text-secondary); line-height: 1.45; margin-bottom: 12px; background: rgba(255,255,255,0.025); padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; gap: 6px; flex-wrap: wrap;">
              <span style="font-size: 0.68rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">
                Itens do Pedido (${totalItens} ${totalItens === 1 ? 'peça' : 'peças'}):
              </span>
              ${coresList.length > 0 ? `
                <span class="badge-cor-tag" style="font-size: 0.68rem; padding: 1px 7px;" title="Cores: ${coresList.join(', ')}">
                  🎨 ${App.escapeHtml(coresList.join(', '))}
                </span>
              ` : ''}
            </div>
            <div style="max-height: 95px; overflow-y: auto;">
              ${itensHtml}
            </div>
            ${enc.observacoes && enc.observacoes.trim() ? `
              <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed rgba(255,255,255,0.08); font-size: 0.74rem; color: #93c5fd;">
                📄 <strong>Obs:</strong> ${App.escapeHtml(enc.observacoes)}
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

    return `
      <tr class="dash-row-clickable" data-enc-id="${enc.id}" onclick="EncomendasModule.openEditModal('${enc.id}')" title="Clique para abrir detalhes da encomenda #${enc.id.substring(enc.id.length - 5)}">
        <td>
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px; flex-wrap: wrap;">
            <strong>#${enc.id.substring(enc.id.length - 5)}</strong>
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
      App.toast(`Status da encomenda #${id.substring(id.length - 5)} alterado para "${newStatus}".`, 'info');
    }
    
    this.render();
    this.renderFinalizados();
    if (typeof EstoqueModule !== 'undefined') EstoqueModule.render();
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

    // Popula categorias cadastradas dinamicamente
    const catSelect = document.getElementById('enc-form-categoria');
    if (catSelect) {
      const cats = StorageService.getCategoriasProducao();
      catSelect.innerHTML = cats.map(c => `<option value="${App.escapeHtml(c)}">${App.escapeHtml(c)}</option>`).join('');
      catSelect.value = cats[0] || '3D';
    }

    document.getElementById('enc-form-data-pedido').value = new Date().toISOString().split('T')[0];

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

    document.getElementById('enc-modal-title').textContent = `Editar Encomenda #${enc.id.substring(enc.id.length - 5)}`;
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

    document.getElementById('enc-form-data-pedido').value = enc.data_pedido || '';
    document.getElementById('enc-form-data-entrega').value = enc.data_entrega_prevista || '';
    document.getElementById('enc-form-status').value = enc.status || 'Fila';
    document.getElementById('enc-form-pagto-status').value = enc.pagamento_status || 'Pendente';
    document.getElementById('enc-form-forma-pagto').value = enc.forma_pagamento || 'Pix';
    document.getElementById('enc-form-valor-pago').value = enc.valor_pago || 0;
    document.getElementById('enc-form-obs').value = enc.observacoes || '';
    document.getElementById('enc-btn-delete').style.display = 'inline-block';

    encomendaItensTemp = (enc.itens && enc.itens.length > 0)
      ? enc.itens.map(it => ({
          produto_nome: it.produto_nome || '',
          cor: it.cor || '',
          personalizacao: it.personalizacao || '',
          observacao: it.observacao || it.obs || '',
          quantidade: Number(it.quantidade) || 1,
          preco_unitario: Number(it.preco_unitario) || 0,
          subtotal: Number(it.subtotal) || 0,
          estoque_id: it.estoque_id || (it.estoque_item_id ? it.estoque_item_id : 'auto'),
          estoque_item_id: it.estoque_item_id || null,
          estoque_item_nome: it.estoque_item_nome || null,
          qtd_deduzida_estoque: Number(it.qtd_deduzida_estoque) || 0
        }))
      : [{ produto_nome: '', cor: '', personalizacao: '', observacao: '', quantidade: 1, preco_unitario: 0, subtotal: 0, estoque_id: 'auto', estoque_item_id: null, estoque_item_nome: null, qtd_deduzida_estoque: 0 }];

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
    
    const nomeNorm = produtoNome.toLowerCase().trim();
    const corNorm = (cor || '').toLowerCase().trim();

    // 1. Match exato: Nome e Cor
    if (corNorm) {
      const matchExato = itensEstoque.find(e => {
        const eNome = (e.nome || '').toLowerCase().trim();
        const eCor = (e.cor || '').toLowerCase().trim();
        return (eNome === nomeNorm || eNome.includes(nomeNorm) || nomeNorm.includes(eNome)) && eCor === corNorm;
      });
      if (matchExato) return matchExato;
    }

    // 2. Match por Nome exato
    const matchNomeExato = itensEstoque.find(e => (e.nome || '').toLowerCase().trim() === nomeNorm);
    if (matchNomeExato) return matchNomeExato;

    // 3. Match por inclusão (ex: "Copo" em "Copo Térmico Inox 473ml (Tipo Stanley)")
    const matchInclusao = itensEstoque.find(e => {
      const eNome = (e.nome || '').toLowerCase().trim();
      return eNome.includes(nomeNorm) || nomeNorm.includes(eNome);
    });
    if (matchInclusao) return matchInclusao;

    return null;
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
              <button type="button" class="btn-icon" style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.4); color: #f87171; cursor: pointer; padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 600;" 
                      onclick="EncomendasModule.removeItemRow(${idx})" title="Remover este item">
                ✕ Excluir Item
              </button>
            ` : ''}
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

          <!-- Linha 2: Personalização / Arte e Observação do Produto -->
          <div class="form-row" style="margin-bottom: 10px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 0.78rem; font-weight: 600; color: var(--text-primary);">Personalização / Arte (Instruções ou Nome)</label>
              <input type="text" class="form-control" style="height: 38px;" 
                     value="${App.escapeHtml(item.personalizacao || '')}" 
                     placeholder="Ex: Nome da Aniversariante, Frase, Logo..." 
                     oninput="EncomendasModule.updateItemField(${idx}, 'personalizacao', this.value)">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label style="font-size: 0.78rem; font-weight: 600; color: var(--text-primary);">Observação do Produto</label>
              <input type="text" class="form-control" style="height: 38px;" 
                     value="${App.escapeHtml(item.observacao || '')}" 
                     placeholder="Ex: Acabamento especial, tamanho, embalagem..." 
                     oninput="EncomendasModule.updateItemField(${idx}, 'observacao', this.value)">
            </div>
          </div>

          <!-- Linha 3: Quantidade, Valor Unitário e Subtotal -->
          <div class="form-row" style="margin-bottom: 10px; align-items: flex-end;">
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
          </div>

          <!-- Linha 4: Baixa de Material do Estoque em Tempo Real -->
          <div style="background: rgba(0, 0, 0, 0.28); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 10px 12px; margin-bottom: 8px;">
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

          <!-- Subtotal do Item -->
          <div style="display: flex; justify-content: flex-end; align-items: center; gap: 8px; margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(255, 255, 255, 0.08);">
            <span style="font-size: 0.76rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">Subtotal do Item:</span>
            <span id="enc-item-subtotal-${idx}" style="font-size: 1.15rem; font-weight: 800; color: #34d399;">
              ${App.formatMoney(item.subtotal || 0)}
            </span>
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
    const dataPedido = document.getElementById('enc-form-data-pedido').value;
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

    // 2. Processa as novas baixas no estoque de materiais em tempo real
    const baixasRealizadas = [];
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
    } else {
      encomendaItensTemp.forEach(item => {
        item.qtd_deduzida_estoque = 0;
      });
    }

    const payload = {
      cliente_nome: cliente,
      categoria: categoria,
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

      return `
        <tr class="dash-row-clickable" data-enc-id="${enc.id}" onclick="EncomendasModule.openEditModal('${enc.id}')" title="Clique para abrir detalhes da encomenda #${enc.id.substring(enc.id.length - 5)}">
          <td>
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px; flex-wrap: wrap;">
              <strong>#${enc.id.substring(enc.id.length - 5)}</strong>
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
  }
};
