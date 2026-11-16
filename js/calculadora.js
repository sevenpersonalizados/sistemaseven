/**
 * SEVEN PERSONALIZADOS — CALCULADORA DE FILAMENTOS & CUSTOS 3D
 * Módulo para cálculo em tempo real de filamento, energia elétrica e custo operacional
 */

const CalculadoraModule = {
  filamentoEditandoId: null,

  init() {
    this.renderFilamentoSelect();
    this.carregarParametrosConfig();
    this.renderHistorico();
    this.calcular();
    this.attachEvents();

    window.addEventListener('seven_data_updated', (e) => {
      const table = e.detail?.table;
      if (!table || table === 'filamentos' || table === 'calc_3d_config' || table === 'calc_3d_historico') {
        this.renderFilamentoSelect();
        this.calcular();
        this.renderHistorico();
      }
    });
  },

  attachEvents() {
    // Inputs do formulário principal da calculadora (cálculo em tempo real)
    const inputsLive = [
      'calc-form-filamento',
      'calc-form-gramas',
      'calc-form-horas',
      'calc-form-minutos',
      'calc-form-qtd-pecas',
      'calc-form-margem',
      'calc-form-produto'
    ];

    inputsLive.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this.calcular());
        el.addEventListener('change', () => this.calcular());
      }
    });

    // Inputs do modal de cadastro de filamento para prévia dinâmica de custo por grama
    const precoInput = document.getElementById('fil-modal-preco');
    const pesoInput = document.getElementById('fil-modal-peso');
    if (precoInput) precoInput.addEventListener('input', () => this.atualizarPreviewCustoGrama());
    if (pesoInput) pesoInput.addEventListener('input', () => this.atualizarPreviewCustoGrama());

    // Busca rápida no histórico
    const buscaHistorico = document.getElementById('calc-historico-busca');
    if (buscaHistorico) {
      buscaHistorico.addEventListener('input', (e) => {
        this.renderHistorico(e.target.value);
      });
    }
  },

  setMargemPreset(val) {
    const input = document.getElementById('calc-form-margem');
    if (input) {
      input.value = val;
      this.calcular();
    }
  },

  // Popula o <select> de filamentos cadastrados
  renderFilamentoSelect(selectedId = null) {
    const select = document.getElementById('calc-form-filamento');
    if (!select) return;

    const filamentos = StorageService.get('filamentos') || [];
    const ativos = filamentos.filter(f => f.ativo !== false);

    if (ativos.length === 0) {
      select.innerHTML = '<option value="">Nenhum filamento cadastrado</option>';
      return;
    }

    const currentVal = selectedId || select.value || (ativos[0] ? ativos[0].id : '');

    select.innerHTML = ativos.map(f => {
      const custoG = (Number(f.custo_por_g) || (Number(f.preco_rolo) / Number(f.peso_rolo_g || 1000))).toFixed(3);
      return `<option value="${f.id}" ${f.id === currentVal ? 'selected' : ''}>
        ${App.escapeHtml(f.material)} ${f.cor ? '— ' + App.escapeHtml(f.cor) : ''} (${App.escapeHtml(f.marca || 'Genérico')}) • R$ ${custoG.replace('.', ',')}/g
      </option>`;
    }).join('');
  },

  // Obtém os dados e calcula tudo em tempo real
  calcular() {
    const gramas = parseFloat(document.getElementById('calc-form-gramas')?.value) || 0;
    const horas = parseFloat(document.getElementById('calc-form-horas')?.value) || 0;
    const minutos = parseFloat(document.getElementById('calc-form-minutos')?.value) || 0;
    const qtdPecas = Math.max(1, parseInt(document.getElementById('calc-form-qtd-pecas')?.value) || 1);
    const filamentoId = document.getElementById('calc-form-filamento')?.value;
    const produtoNome = document.getElementById('calc-form-produto')?.value.trim() || 'Nova Peça 3D';

    const filamentos = StorageService.get('filamentos') || [];
    const filamento = filamentos.find(f => f.id === filamentoId) || filamentos[0];

    const cfg = StorageService.getCalc3DConfig();
    const tarifaKwh = Number(cfg.tarifa_kwh) || 0.85;
    const potenciaW = Number(cfg.potencia_impressora_w) || 200;
    const custoHoraOp = Number(cfg.custo_operacional_hora) || 3.50;

    // 1. Custo do filamento
    let custoPorGrama = 0.11;
    if (filamento) {
      const precoRolo = Number(filamento.preco_rolo) || 0;
      const pesoRolo = Number(filamento.peso_rolo_g) || 1000;
      custoPorGrama = pesoRolo > 0 ? (precoRolo / pesoRolo) : 0;
    }
    const custoMaterial = gramas * custoPorGrama;

    // 2. Tempo total em horas
    const tempoTotalHoras = horas + (minutos / 60);

    // 3. Custo da energia elétrica
    // Consumo em kWh = (Potência em Watts × Tempo em horas) ÷ 1.000
    const consumoKwh = (potenciaW * tempoTotalHoras) / 1000;
    const custoEnergia = consumoKwh * tarifaKwh;

    // 4. Custo operacional da impressora
    // Custo operacional = Tempo em horas × Custo operacional por hora
    const custoOperacional = tempoTotalHoras * custoHoraOp;

    // 5. Custo total e unitário
    const custoTotal = custoMaterial + custoEnergia + custoOperacional;
    const custoUnitario = qtdPecas > 0 ? (custoTotal / qtdPecas) : custoTotal;

    // 6. Margem de lucro e Preço de venda sugerido
    const inputMargem = document.getElementById('calc-form-margem');
    let margemPct = inputMargem ? parseFloat(inputMargem.value) : (Number(cfg.margem_lucro_padrao) || 100);
    if (isNaN(margemPct) || margemPct < 0) margemPct = 0;

    const lucroTotal = custoTotal * (margemPct / 100);
    const precoVendaTotal = custoTotal + lucroTotal;
    const precoVendaUnitario = qtdPecas > 0 ? (precoVendaTotal / qtdPecas) : precoVendaTotal;
    const lucroUnitario = qtdPecas > 0 ? (lucroTotal / qtdPecas) : lucroTotal;

    // Atualiza a visualização no Painel de Resultados
    this.atualizarPainelResultados({
      produtoNome,
      filamento,
      gramas,
      horas,
      minutos,
      tempoTotalHoras,
      qtdPecas,
      custoPorGrama,
      custoMaterial,
      consumoKwh,
      tarifaKwh,
      custoEnergia,
      custoHoraOp,
      custoOperacional,
      custoTotal,
      custoUnitario,
      margemPct,
      lucroTotal,
      lucroUnitario,
      precoVendaTotal,
      precoVendaUnitario
    });

    return {
      produtoNome,
      filamento,
      gramas,
      horas,
      minutos,
      tempoTotalHoras,
      qtdPecas,
      custoMaterial,
      consumoKwh,
      custoEnergia,
      custoOperacional,
      custoTotal,
      custoUnitario,
      margemPct,
      lucroTotal,
      lucroUnitario,
      precoVendaTotal,
      precoVendaUnitario
    };
  },

  atualizarPainelResultados(res) {
    // Títulos e identificação
    const elResumo = document.getElementById('calc-res-produto-resumo');
    if (elResumo) {
      elResumo.textContent = `${res.produtoNome}`;
    }

    const elMaterial = document.getElementById('calc-res-material-resumo');
    if (elMaterial) {
      elMaterial.textContent = res.filamento 
        ? `${res.filamento.material} ${res.filamento.cor} (${res.filamento.marca})`
        : 'Material Padrão';
    }

    const elGramas = document.getElementById('calc-res-gramas-resumo');
    if (elGramas) {
      elGramas.textContent = `${res.gramas.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}g`;
    }

    const elTempo = document.getElementById('calc-res-tempo-resumo');
    if (elTempo) {
      elTempo.textContent = `${res.horas}h ${res.minutos.toString().padStart(2, '0')}m (${res.tempoTotalHoras.toFixed(2).replace('.', ',')}h)`;
    }

    // Mini-cards de componentes
    const elCustoMat = document.getElementById('calc-res-custo-material');
    if (elCustoMat) elCustoMat.textContent = App.formatMoney(res.custoMaterial);

    const elDetMat = document.getElementById('calc-res-detalhe-material');
    if (elDetMat) {
      elDetMat.textContent = `${res.gramas}g × R$ ${res.custoPorGrama.toFixed(3).replace('.', ',')}/g`;
    }

    const elCustoEnergia = document.getElementById('calc-res-custo-energia');
    if (elCustoEnergia) elCustoEnergia.textContent = App.formatMoney(res.custoEnergia);

    const elDetEnergia = document.getElementById('calc-res-detalhe-energia');
    if (elDetEnergia) {
      elDetEnergia.textContent = `${res.consumoKwh.toFixed(3).replace('.', ',')} kWh × ${App.formatMoney(res.tarifaKwh)}/kWh`;
    }

    const elCustoOp = document.getElementById('calc-res-custo-operacional');
    if (elCustoOp) elCustoOp.textContent = App.formatMoney(res.custoOperacional);

    const elDetOp = document.getElementById('calc-res-detalhe-operacional');
    if (elDetOp) {
      elDetOp.textContent = `${res.tempoTotalHoras.toFixed(2).replace('.', ',')}h × ${App.formatMoney(res.custoHoraOp)}/h`;
    }

    // Destaques de Custo
    const elTotal = document.getElementById('calc-res-custo-total');
    if (elTotal) elTotal.textContent = App.formatMoney(res.custoTotal);

    const elUnitario = document.getElementById('calc-res-custo-unitario');
    if (elUnitario) elUnitario.textContent = App.formatMoney(res.custoUnitario);

    const elPecasBadge = document.getElementById('calc-res-qtd-pecas-badge');
    if (elPecasBadge) {
      elPecasBadge.textContent = `${res.qtdPecas} ${res.qtdPecas === 1 ? 'peça produzida' : 'peças produzidas'}`;
    }

    // Destaques de Preço de Venda & Margem de Lucro
    const elPrecoTotal = document.getElementById('calc-res-preco-venda-total');
    if (elPrecoTotal) elPrecoTotal.textContent = App.formatMoney(res.precoVendaTotal);

    const elPrecoUnit = document.getElementById('calc-res-preco-venda-unitario');
    if (elPrecoUnit) elPrecoUnit.textContent = `${App.formatMoney(res.precoVendaUnitario)} / un`;

    const elMargemBadge = document.getElementById('calc-res-margem-badge');
    if (elMargemBadge) elMargemBadge.textContent = `+${res.margemPct}%`;

    const elLucroTotal = document.getElementById('calc-res-lucro-total');
    if (elLucroTotal) elLucroTotal.textContent = App.formatMoney(res.lucroTotal);

    const elLucroUnit = document.getElementById('calc-res-lucro-unitario');
    if (elLucroUnit) elLucroUnit.textContent = `${App.formatMoney(res.lucroUnitario)}`;
  },

  // Salva o cálculo atual no histórico permanente
  salvarNoHistorico() {
    const nome = document.getElementById('calc-form-produto')?.value.trim();
    if (!nome) {
      App.toast('Por favor, informe o nome da peça ou produto.', 'warning');
      document.getElementById('calc-form-produto')?.focus();
      return;
    }

    const obs = document.getElementById('calc-form-obs')?.value.trim() || '';
    const dados = this.calcular();

    const payload = {
      data: new Date().toISOString(),
      produto_nome: dados.produtoNome,
      filamento_id: dados.filamento?.id || '',
      filamento_nome: dados.filamento 
        ? `${dados.filamento.material} ${dados.filamento.cor} (${dados.filamento.marca})`
        : 'Filamento',
      gramas: dados.gramas,
      tempo_horas: dados.horas,
      tempo_minutos: dados.minutos,
      tempo_total_horas: dados.tempoTotalHoras,
      quantidade_pecas: dados.qtdPecas,
      custo_filamento: dados.custoMaterial,
      consumo_kwh: dados.consumoKwh,
      custo_energia: dados.custoEnergia,
      custo_operacional: dados.custoOperacional,
      custo_total: dados.custoTotal,
      custo_unitario: dados.custoUnitario,
      margem_lucro_pct: dados.margemPct,
      preco_venda_total: dados.precoVendaTotal,
      preco_venda_unitario: dados.precoVendaUnitario,
      lucro_total: dados.lucroTotal,
      lucro_unitario: dados.lucroUnitario,
      observacoes: obs
    };

    StorageService.insert('calc_3d_historico', payload);
    App.toast('Impressão 3D e preço sugerido salvos no histórico! 🎉', 'success');
    this.renderHistorico();
  },

  limparFormulario() {
    document.getElementById('calc-form-produto').value = '';
    document.getElementById('calc-form-gramas').value = '';
    document.getElementById('calc-form-horas').value = '';
    document.getElementById('calc-form-minutos').value = '';
    document.getElementById('calc-form-qtd-pecas').value = '1';
    const cfg = StorageService.getCalc3DConfig();
    const inputMargem = document.getElementById('calc-form-margem');
    if (inputMargem) inputMargem.value = cfg.margem_lucro_padrao || 100;
    document.getElementById('calc-form-obs').value = '';
    this.calcular();
    App.toast('Calculadora limpa para novo cálculo.', 'info');
  },

  // Renderiza a lista do Histórico com busca e totais
  renderHistorico(termoBusca = '') {
    const container = document.getElementById('calc-historico-tbody');
    if (!container) return;

    const historico = StorageService.get('calc_3d_historico') || [];
    const termo = (termoBusca || '').toLowerCase().trim();

    const filtrados = historico.filter(item => {
      if (!termo) return true;
      const nome = (item.produto_nome || '').toLowerCase();
      const fil = (item.filamento_nome || '').toLowerCase();
      const obs = (item.observacoes || '').toLowerCase();
      return nome.includes(termo) || fil.includes(termo) || obs.includes(termo);
    });

    // Totais acumulados
    const totalPecas = filtrados.reduce((acc, it) => acc + (Number(it.quantidade_pecas) || 1), 0);
    const totalGramas = filtrados.reduce((acc, it) => acc + (Number(it.gramas) || 0), 0);
    const totalCusto = filtrados.reduce((acc, it) => acc + (Number(it.custo_total) || 0), 0);
    const totalVenda = filtrados.reduce((acc, it) => acc + (Number(it.preco_venda_total) || (Number(it.custo_total) * 2)), 0);
    const totalLucro = filtrados.reduce((acc, it) => acc + (Number(it.lucro_total) || (Number(it.custo_total))), 0);

    const elKpiQtd = document.getElementById('calc-hist-kpi-qtd');
    if (elKpiQtd) elKpiQtd.textContent = filtrados.length;

    const elKpiGramas = document.getElementById('calc-hist-kpi-gramas');
    if (elKpiGramas) {
      if (totalGramas >= 1000) {
        elKpiGramas.textContent = `${(totalGramas / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`;
      } else {
        elKpiGramas.textContent = `${totalGramas.toLocaleString('pt-BR')} g`;
      }
    }

    const elKpiCusto = document.getElementById('calc-hist-kpi-custo');
    if (elKpiCusto) elKpiCusto.textContent = App.formatMoney(totalCusto);

    const elKpiVenda = document.getElementById('calc-hist-kpi-venda');
    if (elKpiVenda) elKpiVenda.textContent = App.formatMoney(totalVenda);

    const elKpiLucro = document.getElementById('calc-hist-kpi-lucro');
    if (elKpiLucro) elKpiLucro.textContent = App.formatMoney(totalLucro);

    if (filtrados.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 36px 16px; color: var(--text-muted);">
            <div style="font-size: 1.6rem; margin-bottom: 8px;">🧵</div>
            ${termo ? 'Nenhum registro encontrado para essa busca.' : 'Nenhuma impressão calculada salva ainda. Calcule uma peça acima e clique em "Salvar no Histórico"!'}
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = filtrados.map(item => {
      const dataFmt = item.data ? App.formatDate(item.data) : 'Hoje';
      const tempoStr = `${item.tempo_horas || 0}h ${(item.tempo_minutos || 0).toString().padStart(2, '0')}m`;
      const margem = item.margem_lucro_pct !== undefined ? item.margem_lucro_pct : 100;
      const precoVenda = item.preco_venda_total || (Number(item.custo_total) * (1 + margem / 100));
      const precoUnit = item.preco_venda_unitario || (precoVenda / (item.quantidade_pecas || 1));
      const lucro = item.lucro_total || (precoVenda - item.custo_total);

      return `
        <tr>
          <td>
            <div style="font-weight: 600; color: #ffffff;">${App.escapeHtml(item.produto_nome)}</div>
            <div style="font-size: 0.76rem; color: var(--text-muted);">📅 ${dataFmt}</div>
          </td>
          <td>
            <span class="status-badge" style="background: rgba(249, 115, 22, 0.15); color: #fb923c; border: 1px solid rgba(249, 115, 22, 0.35);">
              ${App.escapeHtml(item.filamento_nome)}
            </span>
          </td>
          <td>
            <div style="font-weight: 600; color: var(--text-primary);">${item.gramas}g</div>
            <div style="font-size: 0.74rem; color: var(--text-muted);">⏱️ ${tempoStr}</div>
          </td>
          <td style="text-align: center;">
            <span style="font-weight: 700; color: #ffffff; background: rgba(255, 255, 255, 0.08); padding: 3px 9px; border-radius: 999px;">
              ${item.quantidade_pecas || 1} un
            </span>
          </td>
          <td>
            <div style="font-size: 0.78rem; color: var(--text-muted);">
              🧵 Fil: <strong style="color: var(--text-secondary);">${App.formatMoney(item.custo_filamento)}</strong><br>
              ⚡ Elet: <strong style="color: var(--text-secondary);">${App.formatMoney(item.custo_energia)}</strong><br>
              🛠️ Op: <strong style="color: var(--text-secondary);">${App.formatMoney(item.custo_operacional)}</strong>
            </div>
          </td>
          <td>
            <div style="font-size: 0.8rem; color: var(--text-muted);">
              Custo: <strong style="color: #10b981;">${App.formatMoney(item.custo_total)}</strong> (${App.formatMoney(item.custo_unitario)}/un)
            </div>
            <div style="font-size: 0.96rem; font-weight: 800; color: #38bdf8; margin-top: 3px;">
              ${App.formatMoney(precoVenda)}
            </div>
            <div style="font-size: 0.75rem; color: #34d399;">
              ${App.formatMoney(precoUnit)}/un • <span style="color: #fb923c; font-weight: 700;">+${margem}%</span>
            </div>
          </td>
          <td style="text-align: right;">
            <div style="display: flex; gap: 6px; justify-content: flex-end;">
              <button class="btn btn-secondary btn-icon" onclick="CalculadoraModule.carregarNaCalculadora('${item.id}')" title="Reutilizar dados na calculadora">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              </button>
              <button class="btn btn-secondary btn-icon" onclick="CalculadoraModule.verDetalhes('${item.id}')" title="Visualizar ficha de custos e margem">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              </button>
              <button class="btn btn-secondary btn-icon" onclick="CalculadoraModule.excluirHistorico('${item.id}')" style="color: var(--danger);" title="Excluir do histórico">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  carregarNaCalculadora(id) {
    const historico = StorageService.get('calc_3d_historico') || [];
    const item = historico.find(i => i.id === id);
    if (!item) return;

    document.getElementById('calc-form-produto').value = item.produto_nome || '';
    if (item.filamento_id) {
      document.getElementById('calc-form-filamento').value = item.filamento_id;
    }
    document.getElementById('calc-form-gramas').value = item.gramas || '';
    document.getElementById('calc-form-horas').value = item.tempo_horas || '';
    document.getElementById('calc-form-minutos').value = item.tempo_minutos || '';
    document.getElementById('calc-form-qtd-pecas').value = item.quantidade_pecas || '1';
    
    const inputMargem = document.getElementById('calc-form-margem');
    if (inputMargem) {
      inputMargem.value = item.margem_lucro_pct !== undefined ? item.margem_lucro_pct : 100;
    }

    document.getElementById('calc-form-obs').value = item.observacoes || '';

    this.calcular();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    App.toast(`Dados de "${item.produto_nome}" carregados na calculadora!`, 'info');
  },

  verDetalhes(id) {
    const historico = StorageService.get('calc_3d_historico') || [];
    const item = historico.find(i => i.id === id);
    if (!item) return;

    const dataFmt = item.data ? App.formatDate(item.data) : 'Hoje';
    const tempoStr = `${item.tempo_horas || 0}h ${(item.tempo_minutos || 0).toString().padStart(2, '0')}m (${(item.tempo_total_horas || 0).toFixed(2).replace('.', ',')}h)`;
    const margem = item.margem_lucro_pct !== undefined ? item.margem_lucro_pct : 100;
    const precoVenda = item.preco_venda_total || (Number(item.custo_total) * (1 + margem / 100));
    const precoUnit = item.preco_venda_unitario || (precoVenda / (item.quantidade_pecas || 1));
    const lucro = item.lucro_total || (precoVenda - item.custo_total);
    const lucroUnit = lucro / (item.quantidade_pecas || 1);

    const modalBody = document.getElementById('calc-detalhes-modal-body');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 20px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <div>
            <h4 style="font-family: var(--font-display); font-size: 1.25rem; font-weight: 700; color: #ffffff; margin: 0 0 4px;">
              ${App.escapeHtml(item.produto_nome)}
            </h4>
            <div style="font-size: 0.8rem; color: var(--text-muted);">
              Data do Registro: <strong>${dataFmt}</strong>
            </div>
          </div>
          <span class="status-badge" style="background: rgba(249, 115, 22, 0.2); color: #fb923c; border: 1px solid rgba(249, 115, 22, 0.45); font-size: 0.8rem; padding: 4px 10px;">
            🧵 ${App.escapeHtml(item.filamento_nome)}
          </span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-top: 16px;">
          <div style="background: rgba(0, 0, 0, 0.35); padding: 10px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.06);">
            <div style="font-size: 0.72rem; color: var(--text-muted);">Material Consumido</div>
            <div style="font-size: 1.05rem; font-weight: 700; color: #ffffff;">${item.gramas}g</div>
          </div>
          <div style="background: rgba(0, 0, 0, 0.35); padding: 10px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.06);">
            <div style="font-size: 0.72rem; color: var(--text-muted);">Tempo de Impressão</div>
            <div style="font-size: 1.05rem; font-weight: 700; color: #ffffff;">${tempoStr}</div>
          </div>
          <div style="background: rgba(0, 0, 0, 0.35); padding: 10px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.06);">
            <div style="font-size: 0.72rem; color: var(--text-muted);">Lote Fabricado</div>
            <div style="font-size: 1.05rem; font-weight: 700; color: #ffffff;">${item.quantidade_pecas || 1} peças</div>
          </div>
        </div>
      </div>

      <h5 style="color: var(--text-secondary); margin-bottom: 12px; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em;">
        Composição Detalhada dos Custos
      </h5>

      <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: rgba(255, 255, 255, 0.02); border-radius: 8px; border: 1px solid var(--border);">
          <div>
            <div style="font-weight: 600; color: #ffffff;">🧵 1. Custo do Filamento</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${item.gramas}g consumidos</div>
          </div>
          <strong style="font-size: 1rem; color: #fb923c;">${App.formatMoney(item.custo_filamento)}</strong>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: rgba(255, 255, 255, 0.02); border-radius: 8px; border: 1px solid var(--border);">
          <div>
            <div style="font-weight: 600; color: #ffffff;">⚡ 2. Consumo de Energia Elétrica</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${(item.consumo_kwh || 0).toFixed(3).replace('.', ',')} kWh faturados</div>
          </div>
          <strong style="font-size: 1rem; color: #fbbf24;">${App.formatMoney(item.custo_energia)}</strong>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: rgba(255, 255, 255, 0.02); border-radius: 8px; border: 1px solid var(--border);">
          <div>
            <div style="font-weight: 600; color: #ffffff;">🛠️ 3. Custo Operacional & Desgaste</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${item.tempo_total_horas ? item.tempo_total_horas.toFixed(2).replace('.', ',') : 0}h de máquina</div>
          </div>
          <strong style="font-size: 1rem; color: #38bdf8;">${App.formatMoney(item.custo_operacional)}</strong>
        </div>
      </div>

      <!-- CUSTO TOTAL DE PRODUÇÃO -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: rgba(16, 185, 129, 0.08); border: 1.5px solid rgba(16, 185, 129, 0.35); border-radius: 12px; padding: 14px; margin-bottom: 16px;">
        <div>
          <div style="font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">Custo Total Produção</div>
          <div style="font-size: 1.35rem; font-weight: 800; color: #10b981; font-family: var(--font-display);">${App.formatMoney(item.custo_total)}</div>
        </div>
        <div>
          <div style="font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">Custo Unitário p/ Peça</div>
          <div style="font-size: 1.35rem; font-weight: 800; color: #34d399; font-family: var(--font-display);">${App.formatMoney(item.custo_unitario)}</div>
        </div>
      </div>

      <!-- PREÇO DE VENDA E LUCRO COM MARGEM -->
      <div style="background: linear-gradient(135deg, rgba(0, 168, 243, 0.16) 0%, rgba(16, 185, 129, 0.12) 100%); border: 1.5px solid rgba(0, 168, 243, 0.45); border-radius: 12px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 0.76rem; text-transform: uppercase; letter-spacing: 0.05em; color: #93c5fd; font-weight: 700;">
            🏷️ Formação de Preço de Venda
          </span>
          <span style="background: rgba(249, 115, 22, 0.2); color: #fb923c; border: 1px solid rgba(249, 115, 22, 0.45); font-size: 0.78rem; font-weight: 700; padding: 2px 8px; border-radius: 999px;">
            Margem: +${margem}%
          </span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px;">
          <div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">Preço de Venda Sugerido (Total)</div>
            <div style="font-size: 1.5rem; font-weight: 800; color: #38bdf8; font-family: var(--font-display);">${App.formatMoney(precoVenda)}</div>
          </div>
          <div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">Preço Sugerido por Peça</div>
            <div style="font-size: 1.5rem; font-weight: 800; color: #34d399; font-family: var(--font-display);">${App.formatMoney(precoUnit)}</div>
          </div>
        </div>

        <div style="padding-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.1); display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem;">
          <span style="color: var(--text-secondary);">Lucro Líquido Estimado:</span>
          <strong style="color: #10b981; font-size: 1.05rem;">${App.formatMoney(lucro)} (${App.formatMoney(lucroUnit)}/peça)</strong>
        </div>
      </div>

      ${item.observacoes ? `
        <div style="margin-top: 16px; padding: 12px; background: rgba(0, 0, 0, 0.3); border-radius: 8px; font-size: 0.82rem; color: var(--text-secondary);">
          <strong>Observações:</strong> ${App.escapeHtml(item.observacoes)}
        </div>
      ` : ''}
    `;

    App.openModal('modal-calc-detalhes');
  },

  excluirHistorico(id) {
    if (confirm('Deseja realmente excluir este registro do histórico de impressões?')) {
      StorageService.delete('calc_3d_historico', id);
      App.toast('Registro excluído do histórico.', 'info');
      this.renderHistorico();
    }
  },

  // Modal de Parâmetros Gerais (Energia, Impressora e Margem Padrão)
  abrirModalConfig() {
    const cfg = StorageService.getCalc3DConfig();
    document.getElementById('cfg-tarifa-kwh').value = cfg.tarifa_kwh || 0.85;
    document.getElementById('cfg-potencia-watts').value = cfg.potencia_impressora_w || 200;
    document.getElementById('cfg-custo-operacional-hora').value = cfg.custo_operacional_hora || 3.50;
    const inputMargem = document.getElementById('cfg-margem-lucro-padrao');
    if (inputMargem) inputMargem.value = cfg.margem_lucro_padrao || 100;
    App.openModal('modal-calc-config');
  },

  salvarConfigForm() {
    const tarifa = parseFloat(document.getElementById('cfg-tarifa-kwh')?.value) || 0;
    const potencia = parseFloat(document.getElementById('cfg-potencia-watts')?.value) || 0;
    const custoHora = parseFloat(document.getElementById('cfg-custo-operacional-hora')?.value) || 0;
    const margem = parseFloat(document.getElementById('cfg-margem-lucro-padrao')?.value) || 100;

    StorageService.saveCalc3DConfig({
      tarifa_kwh: tarifa,
      potencia_impressora_w: potencia,
      custo_operacional_hora: custoHora,
      margem_lucro_padrao: margem
    });

    App.toast('Parâmetros da impressora, energia e margem atualizados!', 'success');
    App.closeModal('modal-calc-config');
    this.carregarParametrosConfig();
    this.calcular();
  },

  carregarParametrosConfig() {
    const cfg = StorageService.getCalc3DConfig();
    const badgeTarifa = document.getElementById('calc-kpi-param-tarifa');
    if (badgeTarifa) badgeTarifa.textContent = `${App.formatMoney(cfg.tarifa_kwh)}/kWh`;

    const badgePotencia = document.getElementById('calc-kpi-param-potencia');
    if (badgePotencia) badgePotencia.textContent = `${cfg.potencia_impressora_w}W`;

    const badgeOp = document.getElementById('calc-kpi-param-op');
    if (badgeOp) badgeOp.textContent = `${App.formatMoney(cfg.custo_operacional_hora)}/h`;

    const badgeMargem = document.getElementById('calc-kpi-param-margem');
    if (badgeMargem) badgeMargem.textContent = `${cfg.margem_lucro_padrao || 100}%`;
  },

  // Popula os selects de Marca e Cor do formulário de filamentos com as opções pré-programadas
  popularOpcoesFormFilamento(marcaSelecionada = null, corSelecionada = null) {
    const selMarca = document.getElementById('fil-modal-marca');
    if (selMarca) {
      const marcas = StorageService.getMarcasFilamento() || [];
      const listaMarcas = [...marcas];
      if (marcaSelecionada && !listaMarcas.some(m => m.toLowerCase() === marcaSelecionada.toLowerCase())) {
        listaMarcas.push(marcaSelecionada);
      }
      selMarca.innerHTML = listaMarcas.map(m => `
        <option value="${App.escapeHtml(m)}" ${marcaSelecionada && m.toLowerCase() === marcaSelecionada.toLowerCase() ? 'selected' : ''}>
          ${App.escapeHtml(m)}
        </option>
      `).join('');
    }

    const selCor = document.getElementById('fil-modal-cor');
    if (selCor) {
      const cores = StorageService.getCoresDisponiveis() || [];
      const listaCores = [...cores];
      if (corSelecionada && !listaCores.some(c => c.toLowerCase() === corSelecionada.toLowerCase())) {
        listaCores.push(corSelecionada);
      }
      selCor.innerHTML = listaCores.map(c => `
        <option value="${App.escapeHtml(c)}" ${corSelecionada && c.toLowerCase() === corSelecionada.toLowerCase() ? 'selected' : ''}>
          ${App.escapeHtml(c)}
        </option>
      `).join('');
    }
  },

  // Modal de Gestão de Filamentos
  abrirModalFilamentos() {
    this.filamentoEditandoId = null;
    this.popularOpcoesFormFilamento();
    this.limparFormFilamento();
    this.renderFilamentosTabela();
    App.openModal('modal-gerenciar-filamentos');
  },

  limparFormFilamento() {
    this.filamentoEditandoId = null;
    this.popularOpcoesFormFilamento();
    document.getElementById('fil-modal-material').value = 'PLA';
    const localInput = document.getElementById('fil-modal-local-compra');
    if (localInput) localInput.value = '';
    const dataInput = document.getElementById('fil-modal-data-compra');
    if (dataInput) dataInput.value = new Date().toISOString().split('T')[0];
    document.getElementById('fil-modal-peso').value = '1000';
    document.getElementById('fil-modal-preco').value = '';
    document.getElementById('fil-modal-form-title').textContent = 'Cadastrar Novo Filamento';
    document.getElementById('fil-modal-btn-submit').textContent = 'Cadastrar Filamento';
    this.atualizarPreviewCustoGrama();
  },

  atualizarPreviewCustoGrama() {
    const preco = parseFloat(document.getElementById('fil-modal-preco')?.value) || 0;
    const peso = parseFloat(document.getElementById('fil-modal-peso')?.value) || 1000;
    const custoGrama = peso > 0 ? (preco / peso) : 0;
    const el = document.getElementById('fil-modal-custo-preview');
    if (el) {
      el.textContent = `Custo calculado: R$ ${custoGrama.toFixed(4).replace('.', ',')} por grama`;
    }
  },

  renderFilamentosTabela() {
    const container = document.getElementById('filamentos-tbody');
    if (!container) return;

    const filamentos = StorageService.get('filamentos') || [];

    if (filamentos.length === 0) {
      container.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">Nenhum filamento cadastrado ainda.</td></tr>`;
      return;
    }

    container.innerHTML = filamentos.map(f => {
      const preco = Number(f.preco_rolo) || 0;
      const peso = Number(f.peso_rolo_g) || 1000;
      const custoG = (Number(f.custo_por_g) || (preco / peso)).toFixed(3);

      return `
        <tr>
          <td>
            <strong style="color: #ffffff; font-size: 0.92rem;">${App.escapeHtml(f.material)}</strong>
            <div style="font-size: 0.74rem; color: #38bdf8; font-weight: 600;">🏷️ ${App.escapeHtml(f.marca || 'Genérica')}</div>
          </td>
          <td>
            <span style="display: inline-flex; align-items: center; gap: 6px;">
              <span style="width: 10px; height: 10px; border-radius: 50%; background: #fb923c; display: inline-block;"></span>
              ${App.escapeHtml(f.cor || 'Padrão')}
            </span>
          </td>
          <td>
            ${f.local_compra ? `<div style="font-weight: 600; font-size: 0.82rem; color: #f1f5f9;">🏪 ${App.escapeHtml(f.local_compra)}</div>` : '<span style="color: var(--text-muted); font-size: 0.8rem;">—</span>'}
            ${f.data_compra ? `<div style="font-size: 0.72rem; color: #94a3b8; margin-top: 2px;">📅 ${App.formatDate(f.data_compra)}</div>` : ''}
          </td>
          <td>${peso}g</td>
          <td><strong>${App.formatMoney(preco)}</strong></td>
          <td>
            <span style="font-weight: 700; color: #10b981; background: rgba(16, 185, 129, 0.15); padding: 3px 8px; border-radius: 999px;">
              R$ ${custoG.replace('.', ',')}/g
            </span>
          </td>
          <td style="text-align: right;">
            <div style="display: flex; gap: 6px; justify-content: flex-end;">
              <button class="btn btn-secondary btn-icon" onclick="CalculadoraModule.editarFilamento('${f.id}')" title="Editar filamento">
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

  salvarFilamentoForm() {
    const material = document.getElementById('fil-modal-material')?.value.trim();
    const marca = document.getElementById('fil-modal-marca')?.value.trim() || 'Voolt3D';
    const cor = document.getElementById('fil-modal-cor')?.value.trim() || 'Preto';
    const localCompra = document.getElementById('fil-modal-local-compra')?.value.trim() || '';
    const dataCompra = document.getElementById('fil-modal-data-compra')?.value || '';
    const peso = parseFloat(document.getElementById('fil-modal-peso')?.value) || 1000;
    const preco = parseFloat(document.getElementById('fil-modal-preco')?.value) || 0;

    if (!material) {
      App.toast('Informe o tipo de material (PLA, PETG, ABS...).', 'warning');
      return;
    }
    if (!cor) {
      App.toast('Selecione a cor do filamento.', 'warning');
      return;
    }
    if (preco <= 0) {
      App.toast('Informe o preço de compra do rolo.', 'warning');
      return;
    }

    const custoPorGrama = peso > 0 ? (preco / peso) : 0;

    const payload = {
      material,
      marca,
      cor,
      local_compra: localCompra,
      data_compra: dataCompra,
      peso_rolo_g: peso,
      preco_rolo: preco,
      custo_por_g: custoPorGrama,
      ativo: true
    };

    if (this.filamentoEditandoId) {
      StorageService.update('filamentos', this.filamentoEditandoId, payload);
      App.toast('Filamento atualizado com sucesso!', 'success');
    } else {
      StorageService.insert('filamentos', payload);
      App.toast('Novo filamento cadastrado!', 'success');
    }

    this.limparFormFilamento();
    this.renderFilamentosTabela();
    this.renderFilamentoSelect(this.filamentoEditandoId || undefined);
    this.calcular();
  },

  editarFilamento(id) {
    const filamentos = StorageService.get('filamentos') || [];
    const f = filamentos.find(item => item.id === id);
    if (!f) return;

    this.filamentoEditandoId = id;
    this.popularOpcoesFormFilamento(f.marca, f.cor);

    document.getElementById('fil-modal-material').value = f.material || 'PLA';
    document.getElementById('fil-modal-marca').value = f.marca || '';
    document.getElementById('fil-modal-cor').value = f.cor || '';
    
    const localInput = document.getElementById('fil-modal-local-compra');
    if (localInput) localInput.value = f.local_compra || '';
    const dataInput = document.getElementById('fil-modal-data-compra');
    if (dataInput) dataInput.value = f.data_compra || '';

    document.getElementById('fil-modal-peso').value = f.peso_rolo_g || 1000;
    document.getElementById('fil-modal-preco').value = f.preco_rolo || '';

    document.getElementById('fil-modal-form-title').textContent = `Editar Filamento — ${f.material} ${f.cor} (${f.marca || ''})`;
    document.getElementById('fil-modal-btn-submit').textContent = 'Salvar Alterações';
    this.atualizarPreviewCustoGrama();
    document.getElementById('fil-modal-material').focus();
  },

  excluirFilamento(id) {
    const filamentos = StorageService.get('filamentos') || [];
    if (filamentos.length <= 1) {
      App.toast('Você deve manter pelo menos um filamento cadastrado no sistema.', 'warning');
      return;
    }

    if (confirm('Deseja excluir este filamento?')) {
      StorageService.delete('filamentos', id);
      App.toast('Filamento removido.', 'info');
      this.renderFilamentosTabela();
      this.renderFilamentoSelect();
      this.calcular();
    }
  }
};
