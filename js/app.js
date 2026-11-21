/**
 * SEVEN PERSONALIZADOS — APLICAÇÃO PRINCIPAL (APP CORE)
 * Gerencia navegação SPA, dashboard geral, modais, toasts e inicialização
 */

const App = {
  currentView: 'dashboard',

  init() {
    if (typeof AuthModule !== 'undefined') {
      AuthModule.init();
    }
    this.setupNavigation();
    this.setupModals();
    this.renderDashboard();

    // Inicializa os submódulos
    if (typeof NotificationModule !== 'undefined') {
      NotificationModule.init();
    }
    EncomendasModule.init();
    EstoqueModule.init();
    FinanceiroModule.init();
    PropostasModule.init();
    if (typeof CalculadoraModule !== 'undefined') {
      CalculadoraModule.init();
    }
    if (typeof CalendarModule !== 'undefined') {
      CalendarModule.init();
    }
    if (typeof ConfiguracoesModule !== 'undefined') {
      ConfiguracoesModule.init();
    }
    this.loadConfigView();

    window.addEventListener('seven_data_updated', () => {
      this.updateBadges();
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
    if (viewName === 'crm' || viewName === 'orcamentos') {
      viewName = 'propostas';
    }
    this.currentView = viewName;

    // Atualiza botões do sidebar desktop
    document.querySelectorAll('.nav-item button[data-view]').forEach(btn => {
      if (btn.getAttribute('data-view') === viewName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Atualiza botões da barra inferior mobile (estilo App iOS)
    document.querySelectorAll('.bottom-nav-item[data-view]').forEach(btn => {
      if (btn.getAttribute('data-view') === viewName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Fecha a gaveta lateral no celular se estiver aberta
    this.closeSidebar();

    // Rola para o topo suavemente
    window.scrollTo({ top: 0, behavior: 'smooth' });

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
      propostas: { title: 'Orçamentos & Propostas', sub: 'Crie orçamentos de alto valor prontos para aprovar e produzir' },
      encomendas: { title: 'Encomendas & Produção', sub: 'Controle de prazos, etapas e personalizações' },
      finalizados: { title: 'Histórico de Finalizados', sub: 'Encomendas entregues, canceladas e concluídas' },
      estoque: { title: 'Estoque', sub: 'Matéria-prima, filamentos 3D e outros materiais' },
      financeiro: { title: 'Gestão Financeira', sub: 'Entradas, despesas operacionais e balanço' },
      'tabela-preco': { title: 'Tabela de Preço', sub: 'Histórico de Impressões & Produção 3D com edição de preço de venda' },
      calculadora: { title: 'Calculadora de Filamentos', sub: 'Custos de produção 3D: filamento, energia elétrica e desgaste operacional' },
      'calculadora-laser': { title: 'Calculadora Laser', sub: 'Corte & Gravação: R$ 30,00/h de máquina, chapas de MDF por cores e acrílicos' },
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
    } else if (viewName === 'financeiro') {
      if (typeof FinanceiroModule !== 'undefined') {
        FinanceiroModule.render();
      }
    } else if (viewName === 'tabela-preco') {
      if (typeof CalculadoraModule !== 'undefined') {
        CalculadoraModule.renderHistorico(document.getElementById('calc-historico-busca')?.value || '');
      }
    } else if (viewName === 'calculadora') {
      if (typeof CalculadoraModule !== 'undefined') {
        CalculadoraModule.renderFilamentoSelect();
        CalculadoraModule.carregarParametrosConfig();
        CalculadoraModule.calcular();
        CalculadoraModule.renderHistorico();
      }
    } else if (viewName === 'calculadora-laser') {
      if (typeof CalculadoraLaserModule !== 'undefined') {
        CalculadoraLaserModule.render();
      }
    } else if (viewName === 'configuracoes') {
      if (typeof ConfiguracoesModule !== 'undefined') {
        ConfiguracoesModule.render();
      }
    }

    this.updateBadges();
  },

  updateBadges() {
    const enc = StorageService.get('encomendas') || [];
    const est = StorageService.get('estoque') || [];
    const propostas = StorageService.get('propostas') || [];

    // Orçamentos em aberto (exatamente os mesmos exibidos na página de Orçamentos)
    const propostasAbertas = propostas.filter(p => !p.status || !p.status.toLowerCase().includes('aprovad'));

    // Encomendas Finalizadas (exatamente as mesmas exibidas na página de Finalizados)
    const encFinalizadas = enc.filter(e => {
      return e.status === 'Entregue' || e.status === 'Cancelada' || (e.status === 'Pronto' && e.pagamento_status === 'Pago');
    });

    // Encomendas Ativas (exatamente as mesmas exibidas na página de Encomendas)
    const encAbertas = enc.filter(e => {
      if (e.status === 'Entregue' || e.status === 'Cancelada') return false;
      const isFin = e.status === 'Pronto' && e.pagamento_status === 'Pago';
      return !isFin;
    });

    // Itens em Estoque e Filamentos abaixo de 300g (com destaque caso haja itens em nível crítico)
    const filamentos = (StorageService.get('filamentos') || []).filter(f => f.ativo !== false);
    const estoqueBaixo = est.filter(i => Number(i.quantidade_atual) <= Number(i.estoque_minimo));
    const filamentosBaixos = filamentos.filter(f => {
      const pesoAtual = (f.peso_atual_g !== undefined && f.peso_atual_g !== null) ? Number(f.peso_atual_g) : (Number(f.peso_rolo_g) || 0);
      return pesoAtual < 300;
    });
    const totalCriticos = estoqueBaixo.length + filamentosBaixos.length;
    const totalEstoque = est.length + filamentos.length;

    // Atualiza badges do menu lateral e da barra inferior mobile
    const bProp = document.getElementById('nav-badge-propostas');
    if (bProp) bProp.textContent = propostasAbertas.length;
    const bbProp = document.getElementById('bottom-badge-propostas');
    if (bbProp) {
      bbProp.textContent = propostasAbertas.length;
      bbProp.style.display = propostasAbertas.length > 0 ? 'inline-block' : 'none';
    }

    const bEnc = document.getElementById('nav-badge-encomendas');
    if (bEnc) bEnc.textContent = encAbertas.length;
    const bbEnc = document.getElementById('bottom-badge-encomendas');
    if (bbEnc) {
      bbEnc.textContent = encAbertas.length;
      bbEnc.style.display = encAbertas.length > 0 ? 'inline-block' : 'none';
    }

    const bFin = document.getElementById('nav-badge-finalizados');
    if (bFin) bFin.textContent = encFinalizadas.length;

    const bEst = document.getElementById('nav-badge-estoque');
    if (bEst) {
      bEst.textContent = totalEstoque;
      bEst.className = totalCriticos > 0 ? 'badge-counter highlight' : 'badge-counter';
      bEst.title = totalCriticos > 0
        ? `${totalEstoque} itens cadastrados (${totalCriticos} em nível crítico)`
        : `${totalEstoque} itens cadastrados no estoque`;
    }
  },

  renderDashboard() {
    const enc = StorageService.get('encomendas');
    const desp = StorageService.get('despesas');
    const est = StorageService.get('estoque');
    const crm = StorageService.get('crm_cards');

    // 1. Encomendas Finalizadas (Entregues, Canceladas ou Prontas e Quitadas)
    const encFinalizadas = enc.filter(e => {
      return e.status === 'Entregue' || e.status === 'Cancelada' || (e.status === 'Pronto' && e.pagamento_status === 'Pago');
    });

    const encAbertas = enc.filter(e => {
      if (e.status === 'Entregue' || e.status === 'Cancelada') return false;
      const isFin = e.status === 'Pronto' && e.pagamento_status === 'Pago';
      return !isFin;
    });

    const elEncAbertas = document.getElementById('dash-kpi-enc-abertas');
    if (elEncAbertas) elEncAbertas.textContent = encAbertas.length;

    const elCalEncAbertas = document.getElementById('dash-cal-enc-abertas');
    if (elCalEncAbertas) {
      elCalEncAbertas.textContent = `${encAbertas.length} ${encAbertas.length === 1 ? 'Encomenda em Aberto' : 'Encomendas em Aberto'}`;
    }

    // 2. Receita e Despesas (interligado com Lançamentos Financeiros + Encomendas)
    const lancamentosFin = (typeof FinanceiroModule !== 'undefined' && FinanceiroModule.getLancamentos)
      ? FinanceiroModule.getLancamentos()
      : (StorageService.get('financeiro_lancamentos') || []);
    let receitaMes = 0;
    let despMes = 0;
    if (lancamentosFin.length > 0) {
      lancamentosFin.forEach(l => {
        if (l.estornado || l.status === 'estornado') return;
        const val = Number(l.valor) || 0;
        if (l.tipo === 'receita' && (l.status === 'recebido' || l.status === 'pago')) {
          receitaMes += val;
        } else if (l.tipo === 'despesa' && (l.status === 'pago' || l.status === 'recebido')) {
          despMes += val;
        }
      });
    } else {
      receitaMes = enc.reduce((s, e) => s + (Number(e.valor_pago) || 0), 0);
      despMes = desp.reduce((s, d) => s + (Number(d.valor) || 0), 0);
    }
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

    // 3. Atualiza Badges de alerta no menu lateral e na barra inferior mobile
    this.updateBadges();
    const estoqueBaixo = est.filter(i => Number(i.quantidade_atual) <= Number(i.estoque_minimo));
    const filamentosAtivos = (StorageService.get('filamentos') || []).filter(f => f.ativo !== false);
    const filamentosBaixos = filamentosAtivos.filter(f => {
      const pesoAtual = (f.peso_atual_g !== undefined && f.peso_atual_g !== null) ? Number(f.peso_atual_g) : (Number(f.peso_rolo_g) || 0);
      return pesoAtual < 300;
    });

    // 4. Próximas Entregas (Apenas encomendas em Fila ou Em Produção — pedidos 'Pronto' saem daqui)
    const proximas = enc
      .filter(e => {
        if (e.status === 'Cancelada' || e.status === 'Pronto' || e.status === 'Entregue') return false;
        return !!e.data_entrega_prevista;
      })
      .sort((a, b) => (a.data_entrega_prevista > b.data_entrega_prevista ? 1 : -1))
      .slice(0, 5);

    const containerEntregas = document.getElementById('dash-proximas-entregas');
    if (containerEntregas) {
      if (proximas.length === 0) {
        containerEntregas.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 24px;">Nenhuma entrega pendente no momento! 🎉</div>`;
      } else {
        containerEntregas.innerHTML = proximas.map(e => `
          <div class="dash-row-clickable" onclick="EncomendasModule.openEditModal('${e.id}')" title="Clique para abrir detalhes da encomenda ${StorageService.formatOrderNumber(e)}" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid var(--border); border-radius: 6px;">
            <div style="flex: 1; min-width: 0; padding-right: 12px;">
              <div style="font-weight: 600; color: var(--text-primary);">${this.escapeHtml(e.cliente_nome)} <span style="font-size: 0.76rem; color: var(--text-muted); font-weight: normal;">${StorageService.formatOrderNumber(e)}</span></div>
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

    // 5. Alerta de Estoque Baixo na Home (Matéria-Prima, Outros e Filamentos < 300g)
    const containerEstoque = document.getElementById('dash-estoque-critico');
    if (containerEstoque) {
      const alertasUnificados = [
        ...filamentosBaixos.map(f => {
          const pesoAtual = (f.peso_atual_g !== undefined && f.peso_atual_g !== null) ? Number(f.peso_atual_g) : (Number(f.peso_rolo_g) || 0);
          return {
            titulo: `🧵 ${f.material || 'Filamento'}${f.marca ? ` — ${f.marca}` : ''}`,
            categoria: 'Filamento 3D',
            cor: f.cor || '',
            badge: `${pesoAtual}g (Mín: 300g)`
          };
        }),
        ...estoqueBaixo.map(item => ({
          titulo: item.nome || 'Material',
          categoria: item.categoria || '',
          cor: item.cor || '',
          badge: `${item.quantidade_atual} ${item.unidade} (Mín: ${item.estoque_minimo})`
        }))
      ];

      if (alertasUnificados.length === 0) {
        containerEstoque.innerHTML = `<div style="color: var(--success); text-align: center; padding: 24px;">Estoque saudável! Nenhum item ou filamento abaixo do mínimo. ✅</div>`;
      } else {
        containerEstoque.innerHTML = alertasUnificados.map(alerta => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid var(--border); gap: 10px;">
            <div style="min-width: 0;">
              <div style="font-weight: 600; color: var(--text-primary);">${this.escapeHtml(alerta.titulo)}</div>
              <div style="font-size: 0.76rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <span>${this.escapeHtml(alerta.categoria)}</span>
                ${alerta.cor ? `<span style="color: #38bdf8; font-weight: 600;">• 🎨 ${this.escapeHtml(alerta.cor)}</span>` : ''}
              </div>
            </div>
            <div style="text-align: right; flex-shrink: 0;">
              <span class="status-badge badge-alerta-estoque">${this.escapeHtml(alerta.badge)}</span>
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
                    <tr class="dash-row-clickable" onclick="EncomendasModule.openEditModal('${e.id}')" title="Clique para abrir detalhes da encomenda ${StorageService.formatOrderNumber(e)}">
                      <td>
                        <div style="font-weight: 600; color: var(--text-primary);">${this.escapeHtml(e.cliente_nome)}</div>
                        <div style="font-size: 0.78rem; color: var(--text-muted);">${StorageService.formatOrderNumber(e)} • ${this.escapeHtml(e.telefone || 'Sem fone')}</div>
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

    // 7. Renderiza o Calendário de Entregas & Prazos
    if (typeof CalendarModule !== 'undefined') {
      CalendarModule.render();
    }
  },

  // Modais
  setupModals() {
    // Apenas modais somente-leitura fecham ao clicar fora.
    // Modais de formulário (Orçamento, Encomenda, Financeiro, Estoque, etc.) só fecham ao Cancelar, Salvar ou clicar no X.
    const readonlyModals = new Set(['modal-preview-proposta', 'modal-detalhes-financeiro']);
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay && readonlyModals.has(overlay.id)) {
          this.closeModal(overlay.id);
        }
      });
    });
  },

  openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) {
      el.classList.add('active');
      document.body.classList.add('modal-open');
      const bottomNav = document.querySelector('.mobile-bottom-nav');
      if (bottomNav) bottomNav.style.setProperty('display', 'none', 'important');
    }
  },

  closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('active');
    // Se não há outros modais ativos, restaura o menu inferior
    if (!document.querySelector('.modal-overlay.active')) {
      document.body.classList.remove('modal-open');
      const bottomNav = document.querySelector('.mobile-bottom-nav');
      if (bottomNav) bottomNav.style.removeProperty('display');
    }
  },

  // Compressão automática de imagens anexadas (mantém qualidade nítida e tamanho leve no Supabase)
  compressImageFile(file, maxSize = 1280, quality = 0.82) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error('Arquivo inválido'));
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Erro ao ler imagem'));
      reader.onload = (ev) => {
        const img = new Image();
        img.onerror = () => resolve({ dataUrl: ev.target.result, nome: file.name || 'anexo.jpg' });
        img.onload = () => {
          let w = img.width;
          let h = img.height;
          if (w > maxSize || h > maxSize) {
            if (w >= h) {
              h = Math.round((h * maxSize) / w);
              w = maxSize;
            } else {
              w = Math.round((w * maxSize) / h);
              h = maxSize;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          const baseName = (file.name || 'anexo').replace(/\.[^.]+$/, '');
          resolve({ dataUrl, nome: `${baseName}.jpg` });
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  },

  _lightboxData: { src: '', filename: 'imagem-seven.jpg' },

  openOrderPhoto(table, id) {
    const list = StorageService.get(table) || [];
    const item = list.find(x => x.id === id);
    if (!item || !item.foto_anexo) return;
    const titulo = item.cliente_nome || item.cliente || item.titulo || 'Anexo do Pedido';
    const nomeArq = item.foto_nome || `anexo-${(item.id || 'pedido').slice(-5)}.jpg`;
    this.openImageLightbox(item.foto_anexo, titulo, nomeArq);
  },

  openOrderItemPhoto(table, id, itemIdx) {
    const list = StorageService.get(table) || [];
    const record = list.find(x => x.id === id);
    const it = record?.itens?.[itemIdx];
    if (!it || !it.foto_anexo) return;
    const cliente = record.cliente_nome || record.cliente || '';
    const prod = it.produto_nome || `Item #${itemIdx + 1}`;
    const titulo = cliente ? `${cliente} — ${prod}` : prod;
    const nomeArq = it.foto_nome || `anexo-item-${itemIdx + 1}.jpg`;
    this.openImageLightbox(it.foto_anexo, titulo, nomeArq);
  },

  openImageLightbox(src, title = 'Anexo do Pedido', filename = 'anexo-seven.jpg') {
    if (!src) return;
    this._lightboxData = { src, filename };
    const overlay = document.getElementById('modal-image-lightbox');
    const imgEl = document.getElementById('lightbox-img-el');
    const titleEl = document.getElementById('lightbox-img-title');
    if (imgEl) imgEl.src = src;
    if (titleEl) titleEl.textContent = title;
    if (overlay) overlay.style.display = 'flex';
  },

  closeImageLightbox() {
    const overlay = document.getElementById('modal-image-lightbox');
    if (overlay) overlay.style.display = 'none';
  },

  downloadLightboxImage() {
    if (!this._lightboxData?.src) return;
    const a = document.createElement('a');
    a.href = this._lightboxData.src;
    a.download = this._lightboxData.filename || 'anexo-seven.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    this.toast('Download da imagem iniciado! ⬇️', 'success');
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
    if (typeof ConfiguracoesModule !== 'undefined') {
      ConfiguracoesModule.render();
      return;
    }
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
  },

  // Gerenciamento da Gaveta Lateral no Celular (com proteção contra clique duplo)
  _lastToggle: 0,

  toggleSidebar(e) {
    if (e && e.stopPropagation) {
      e.stopPropagation();
      e.preventDefault();
    }
    const now = Date.now();
    if (now - this._lastToggle < 350) return;
    this._lastToggle = now;

    const sb = document.getElementById('app-sidebar');
    if (!sb) return;
    if (sb.classList.contains('open')) {
      this.closeSidebar(e);
    } else {
      this.openSidebar(e);
    }
  },

  openSidebar(e) {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    this._lastToggle = Date.now();
    const sb = document.getElementById('app-sidebar');
    const bd = document.getElementById('sidebar-backdrop');
    if (sb) {
      sb.classList.add('open');
      sb.style.setProperty('-webkit-transform', 'translateX(0)', 'important');
      sb.style.setProperty('transform', 'translateX(0)', 'important');
      sb.style.setProperty('display', 'flex', 'important');
      sb.style.setProperty('z-index', '99999', 'important');
    }
    if (bd) {
      bd.classList.add('active');
      bd.style.setProperty('display', 'block', 'important');
      bd.style.setProperty('z-index', '99980', 'important');
    }
    document.body.classList.add('sidebar-open');
    document.body.style.overflow = 'hidden';
  },

  closeSidebar(e) {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    this._lastToggle = Date.now();
    const sb = document.getElementById('app-sidebar');
    const bd = document.getElementById('sidebar-backdrop');
    if (sb) {
      sb.classList.remove('open');
      sb.style.removeProperty('-webkit-transform');
      sb.style.removeProperty('transform');
      sb.style.removeProperty('display');
      sb.style.removeProperty('z-index');
    }
    if (bd) {
      bd.classList.remove('active');
      bd.style.setProperty('display', 'none', 'important');
      bd.style.removeProperty('z-index');
    }
    document.body.classList.remove('sidebar-open');
    document.body.style.overflow = '';
  }
};

// Inicia ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
