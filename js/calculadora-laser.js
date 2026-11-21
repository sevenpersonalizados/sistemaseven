/**
 * SEVEN PERSONALIZADOS — CALCULADORA DE CORTE & GRAVAÇÃO LASER
 * Módulo para cálculo em tempo real de materiais (MDF Cru, Branco, Preto, Azul, Vermelho, Gold e Silver),
 * tempo de máquina laser (R$ 30,00/hora = R$ 0,50/minuto), margem de lucro e orçamentos.
 */

const CalculadoraLaserModule = {
  corAtivaId: 'cru',
  unidadeMedida: 'cm', // 'cm' ou 'm'

  init() {
    this.carregarParametrosConfig();
    this.renderCorChips();
    this.attachEvents();
    this.calcular();
    this.renderHistorico();
    this.renderParametrosRotativo();

    window.addEventListener('seven_data_updated', (e) => {
      const table = e.detail?.table;
      if (!table || table === 'calc_laser_config' || table === 'calc_laser_historico') {
        this.carregarParametrosConfig();
        this.renderCorChips();
        this.calcular();
        this.renderHistorico();
        this.renderParametrosRotativo();
      }
    });
  },

  attachEvents() {
    const inputs = [
      'calc-laser-produto',
      'calc-laser-largura',
      'calc-laser-comprimento',
      'calc-laser-tempo-min',
      'calc-laser-qtd',
      'calc-laser-margem',
      'calc-laser-extras'
    ];

    inputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this.calcular());
        el.addEventListener('change', () => this.calcular());
      }
    });

    const buscaHist = document.getElementById('calc-laser-historico-busca');
    if (buscaHist) {
      buscaHist.addEventListener('input', (e) => this.renderHistorico(e.target.value));
    }
  },

  render() {
    this.carregarParametrosConfig();
    this.renderCorChips();
    this.calcular();
    this.renderHistorico();
    this.renderParametrosRotativo();
  },

  getConfig() {
    return StorageService.getCalcLaserConfig();
  },

  carregarParametrosConfig() {
    const cfg = this.getConfig();
    const horaEl = document.getElementById('calc-laser-kpi-hora-laser');
    if (horaEl) {
      horaEl.textContent = App.formatMoney(cfg.valor_hora_laser || 30.00) + '/h';
    }
    const minEl = document.getElementById('calc-laser-kpi-min-laser');
    if (minEl) {
      const valMin = (cfg.valor_hora_laser || 30.00) / 60;
      minEl.textContent = App.formatMoney(valMin) + '/min';
    }
  },

  renderCorChips() {
    const container = document.getElementById('calc-laser-cor-chips');
    if (!container) return;

    const cfg = this.getConfig();
    const chapas = cfg.chapas || [];

    // Garante que a cor ativa exista na lista
    if (chapas.length > 0 && !chapas.some(ch => ch.id === this.corAtivaId)) {
      this.corAtivaId = chapas[0].id;
    }

    container.innerHTML = chapas.map(ch => {
      const isActive = ch.id === this.corAtivaId;
      return `
        <button type="button" class="laser-color-chip ${isActive ? 'active' : ''}" 
          onclick="CalculadoraLaserModule.setCor('${ch.id}')"
          title="${App.escapeHtml(ch.nome)} — Chapa: ${ch.largura_m}m x ${ch.comprimento_m}m (${App.formatMoney(ch.preco_chapa)})">
          <span class="laser-color-dot" style="background-color: ${ch.cor_hex};"></span>
          <span>${App.escapeHtml(ch.cor)}</span>
          <span style="font-size: 0.72rem; opacity: 0.75;">${ch.espessura_mm}mm</span>
        </button>
      `;
    }).join('') + `
      <button type="button" class="laser-color-chip" 
        onclick="CalculadoraLaserModule.abrirModalNovaCor()"
        title="Adicionar nova cor ou material de chapa para cálculo"
        style="border-style: dashed; border-color: rgba(16, 185, 129, 0.55); color: #34d399; background: rgba(16, 185, 129, 0.08);">
        <span style="font-weight: 800;">+</span>
        <span>Nova Cor</span>
      </button>
    `;
  },

  setCor(corId) {
    this.corAtivaId = corId;
    this.renderCorChips();
    this.calcular();
  },

  setUnidade(unidade) {
    if (this.unidadeMedida === unidade) return;

    const largInput = document.getElementById('calc-laser-largura');
    const compInput = document.getElementById('calc-laser-comprimento');

    let larg = parseFloat(largInput?.value) || 0;
    let comp = parseFloat(compInput?.value) || 0;

    if (unidade === 'm' && this.unidadeMedida === 'cm') {
      // Converte cm -> m
      larg = parseFloat((larg / 100).toFixed(4));
      comp = parseFloat((comp / 100).toFixed(4));
    } else if (unidade === 'cm' && this.unidadeMedida === 'm') {
      // Converte m -> cm
      larg = parseFloat((larg * 100).toFixed(2));
      comp = parseFloat((comp * 100).toFixed(2));
    }

    this.unidadeMedida = unidade;

    if (largInput) largInput.value = larg || '';
    if (compInput) compInput.value = comp || '';

    // Atualiza botões de unidade
    document.querySelectorAll('.calc-laser-unit-btn').forEach(btn => {
      if (btn.getAttribute('data-unit') === unidade) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const labelDim = document.getElementById('calc-laser-dim-label');
    if (labelDim) {
      labelDim.textContent = unidade === 'cm' ? 'Largura e Altura da Peça (em cm)' : 'Largura e Altura da Peça (em metros)';
    }

    this.calcular();
  },

  setMargemPreset(pct) {
    const el = document.getElementById('calc-laser-margem');
    if (el) {
      el.value = pct;
      this.calcular();
    }
  },

  calcular() {
    const cfg = this.getConfig();
    const chapas = cfg.chapas || [];
    const valorHora = parseFloat(cfg.valor_hora_laser) || 30.00;
    const valorMinuto = valorHora / 60; // R$ 0,50 por minuto

    // Inputs
    const largRaw = parseFloat(document.getElementById('calc-laser-largura')?.value) || 0;
    const compRaw = parseFloat(document.getElementById('calc-laser-comprimento')?.value) || 0;
    const tempoMin = parseFloat(document.getElementById('calc-laser-tempo-min')?.value) || 0;
    const qtd = Math.max(1, parseInt(document.getElementById('calc-laser-qtd')?.value, 10) || 1);
    const margemPct = parseFloat(document.getElementById('calc-laser-margem')?.value) || 0;
    const extras = parseFloat(document.getElementById('calc-laser-extras')?.value) || 0;

    // Converte dimensões para metros
    let largM = largRaw;
    let compM = compRaw;
    if (this.unidadeMedida === 'cm') {
      largM = largRaw / 100;
      compM = compRaw / 100;
    }

    const areaM2 = Math.max(0, largM * compM);
    const areaCm2 = areaM2 * 10000;

    // Atualiza badge de área da peça
    const areaBadge = document.getElementById('calc-laser-area-badge');
    if (areaBadge) {
      areaBadge.innerHTML = `Área: <strong>${areaM2.toFixed(4)} m²</strong> <span style="opacity: 0.7;">(${areaCm2.toFixed(1)} cm²)</span>`;
    }

    // Custo de Tempo de Laser
    const custoLaser = tempoMin * valorMinuto;
    const tempoBadge = document.getElementById('calc-laser-tempo-calc-badge');
    if (tempoBadge) {
      tempoBadge.innerHTML = `⏱️ ${tempoMin} min = <strong style="color: #38bdf8;">${App.formatMoney(custoLaser)}</strong> <span style="opacity:0.75; font-size: 0.75rem;">(a ${App.formatMoney(valorHora)}/h)</span>`;
    }

    // Material da Cor Ativa
    const chapaAtiva = chapas.find(c => c.id === this.corAtivaId) || chapas[0] || {
      nome: 'MDF Cru',
      largura_m: 2.13,
      comprimento_m: 2.75,
      preco_chapa: 60.18
    };

    const areaChapa = chapaAtiva.largura_m * chapaAtiva.comprimento_m;
    const custoM2Ativo = areaChapa > 0 ? (chapaAtiva.preco_chapa / areaChapa) : 0;
    const custoMaterialUnitario = areaM2 * custoM2Ativo;

    // Custo Total Unitário
    const custoTotalUnitario = custoMaterialUnitario + custoLaser + extras;

    // Preço de Venda Unitário
    const precoVendaUnitario = custoTotalUnitario * (1 + (margemPct / 100));
    const lucroUnitario = Math.max(0, precoVendaUnitario - custoTotalUnitario);

    // Totais do Lote
    const custoLote = custoTotalUnitario * qtd;
    const precoVendaLote = precoVendaUnitario * qtd;
    const lucroLote = lucroUnitario * qtd;

    // Atualiza os cards de resultados na tela
    this.atualizarResultadosUI({
      chapaAtiva,
      areaM2,
      custoM2Ativo,
      custoMaterialUnitario,
      custoLaser,
      extras,
      custoTotalUnitario,
      margemPct,
      precoVendaUnitario,
      lucroUnitario,
      qtd,
      custoLote,
      precoVendaLote,
      lucroLote
    });

    // Atualiza a tabela comparativa das 7 cores
    this.renderTabelaCores({
      areaM2,
      custoLaser,
      extras,
      margemPct,
      qtd,
      chapas
    });
  },

  atualizarResultadosUI(data) {
    const setTxt = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    };

    // Material Ativo
    setTxt('res-laser-material-nome', data.chapaAtiva.nome);
    setTxt('res-laser-custo-m2', App.formatMoney(data.custoM2Ativo) + '/m²');
    setTxt('res-laser-custo-material', App.formatMoney(data.custoMaterialUnitario));

    // Tempo de Máquina Laser
    setTxt('res-laser-custo-tempo', App.formatMoney(data.custoLaser));

    // Insumos e Extras
    setTxt('res-laser-custo-extras', App.formatMoney(data.extras));

    // Custo Total Unitário
    setTxt('res-laser-custo-total-unit', App.formatMoney(data.custoTotalUnitario));

    // Preço de Venda Sugerido Unitário
    setTxt('res-laser-preco-venda-unit', App.formatMoney(data.precoVendaUnitario));

    // Lucro Unitário
    setTxt('res-laser-lucro-unit', `${App.formatMoney(data.lucroUnitario)} (${data.margemPct}%)`);

    // Bloco do Lote (se qtd > 1)
    const loteBox = document.getElementById('res-laser-lote-box');
    if (loteBox) {
      if (data.qtd > 1) {
        loteBox.style.display = 'block';
        setTxt('res-laser-lote-qtd', `${data.qtd} peças`);
        setTxt('res-laser-lote-custo', App.formatMoney(data.custoLote));
        setTxt('res-laser-lote-venda', App.formatMoney(data.precoVendaLote));
        setTxt('res-laser-lote-lucro', App.formatMoney(data.lucroLote));
      } else {
        loteBox.style.display = 'none';
      }
    }
  },

  renderTabelaCores({ areaM2, custoLaser, extras, margemPct, qtd, chapas }) {
    const tbody = document.getElementById('calc-laser-tabela-cores-tbody');
    if (!tbody) return;

    tbody.innerHTML = chapas.map(ch => {
      const areaChapa = ch.largura_m * ch.comprimento_m;
      const custoM2 = areaChapa > 0 ? (ch.preco_chapa / areaChapa) : 0;
      const custoMaterial = areaM2 * custoM2;
      const custoTotalUnit = custoMaterial + custoLaser + extras;
      const precoVendaUnit = custoTotalUnit * (1 + (margemPct / 100));
      const precoVendaTotal = precoVendaUnit * qtd;
      const isSelected = ch.id === this.corAtivaId;

      return `
        <tr class="${isSelected ? 'laser-row-selected' : ''}" style="cursor: pointer; transition: background 0.15s ease;"
          onclick="CalculadoraLaserModule.setCor('${ch.id}')"
          title="Clique para selecionar ${ch.nome}">
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="laser-color-dot" style="background-color: ${ch.cor_hex};"></span>
              <div>
                <strong style="color: ${isSelected ? '#38bdf8' : '#ffffff'}; font-size: 0.9rem;">${ch.nome}</strong>
                <div style="font-size: 0.74rem; color: var(--text-muted);">${ch.espessura_mm}mm</div>
              </div>
            </div>
          </td>
          <td>
            <div style="font-size: 0.82rem; color: var(--text-secondary);">${ch.largura_m.toFixed(2)}m x ${ch.comprimento_m.toFixed(2)}m (${areaChapa.toFixed(4)} m²)</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${App.formatMoney(ch.preco_chapa)} / chapa</div>
          </td>
          <td>
            <span style="font-size: 0.84rem; font-weight: 600; color: #a5b4fc;">${App.formatMoney(custoM2)}/m²</span>
          </td>
          <td>
            <strong style="font-size: 0.88rem; color: #fbbf24;">${App.formatMoney(custoMaterial)}</strong>
          </td>
          <td>
            <span style="font-size: 0.84rem; color: #38bdf8;">${App.formatMoney(custoLaser)}</span>
          </td>
          <td>
            <strong style="font-size: 0.88rem; color: #ffffff;">${App.formatMoney(custoTotalUnit)}</strong>
          </td>
          <td style="text-align: right;">
            <div style="font-size: 1rem; font-weight: 800; color: #34d399;">
              ${App.formatMoney(precoVendaUnit)}
            </div>
            ${qtd > 1 ? `<div style="font-size: 0.74rem; color: var(--text-muted);">Total: ${App.formatMoney(precoVendaTotal)}</div>` : ''}
          </td>
          <td style="text-align: center;" onclick="event.stopPropagation()">
            ${isSelected ? `
              <span class="status-badge badge-pago" style="font-size: 0.72rem; padding: 3px 8px;">● Ativo</span>
            ` : `
              <button type="button" class="btn btn-secondary btn-sm" onclick="CalculadoraLaserModule.setCor('${ch.id}')" style="padding: 4px 10px; font-size: 0.75rem;">
                Usar
              </button>
            `}
          </td>
        </tr>
      `;
    }).join('');
  },

  salvarNoHistorico() {
    const cfg = this.getConfig();
    const chapas = cfg.chapas || [];
    const valorHora = parseFloat(cfg.valor_hora_laser) || 30.00;
    const valorMinuto = valorHora / 60;

    const prodNome = document.getElementById('calc-laser-produto')?.value.trim() || 'Peça Cortada a Laser';
    const largRaw = parseFloat(document.getElementById('calc-laser-largura')?.value) || 0;
    const compRaw = parseFloat(document.getElementById('calc-laser-comprimento')?.value) || 0;
    const tempoMin = parseFloat(document.getElementById('calc-laser-tempo-min')?.value) || 0;
    const qtd = Math.max(1, parseInt(document.getElementById('calc-laser-qtd')?.value, 10) || 1);
    const margemPct = parseFloat(document.getElementById('calc-laser-margem')?.value) || 0;
    const extras = parseFloat(document.getElementById('calc-laser-extras')?.value) || 0;

    if (largRaw <= 0 || compRaw <= 0) {
      App.toast('Por favor, informe a largura e a altura da peça!', 'warning');
      return;
    }

    let largM = largRaw;
    let compM = compRaw;
    if (this.unidadeMedida === 'cm') {
      largM = largRaw / 100;
      compM = compRaw / 100;
    }
    const areaM2 = largM * compM;

    const chapa = chapas.find(c => c.id === this.corAtivaId) || chapas[0];
    const areaChapa = chapa.largura_m * chapa.comprimento_m;
    const custoM2 = areaChapa > 0 ? (chapa.preco_chapa / areaChapa) : 0;
    const custoMaterial = areaM2 * custoM2;
    const custoLaser = tempoMin * valorMinuto;
    const custoUnit = custoMaterial + custoLaser + extras;
    const precoVendaUnit = custoUnit * (1 + (margemPct / 100));
    const lucroUnit = precoVendaUnit - custoUnit;

    const item = {
      id: 'calc-laser-' + Date.now(),
      data: new Date().toISOString().split('T')[0],
      produto_nome: prodNome,
      cor_id: chapa.id,
      cor_nome: chapa.nome,
      espessura_mm: chapa.espessura_mm,
      largura_m: largM,
      comprimento_m: compM,
      area_m2: areaM2,
      tempo_minutos: tempoMin,
      valor_hora_laser: valorHora,
      custo_material: custoMaterial,
      custo_laser: custoLaser,
      custos_extras: extras,
      custo_unitario: custoUnit,
      margem_lucro_pct: margemPct,
      preco_venda_unitario: precoVendaUnit,
      quantidade_pecas: qtd,
      custo_total: custoUnit * qtd,
      preco_venda_total: precoVendaUnit * qtd,
      lucro_total: lucroUnit * qtd
    };

    StorageService.saveCalcLaserHistoricoItem(item);
    App.toast(`Cálculo de "${prodNome}" salvo no histórico!`, 'success');
    this.renderHistorico();
  },

  renderHistorico(termo = '') {
    const tbody = document.getElementById('calc-laser-historico-tbody');
    if (!tbody) return;

    const historico = StorageService.getCalcLaserHistorico() || [];
    const t = termo.toLowerCase().trim();

    const filtrados = historico.filter(h => {
      if (!t) return true;
      return (h.produto_nome || '').toLowerCase().includes(t) ||
             (h.cor_nome || '').toLowerCase().includes(t);
    });

    if (filtrados.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted);">
            Nenhum cálculo salvo no histórico laser ainda.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtrados.map(h => {
      const dataFmt = h.data ? h.data.split('-').reverse().join('/') : '-';
      return `
        <tr>
          <td>
            <div style="font-weight: 700; color: #ffffff;">${App.escapeHtml(h.produto_nome)}</div>
            <div style="font-size: 0.74rem; color: var(--text-muted);">${dataFmt}</div>
          </td>
          <td>
            <span class="badge-cor-tag">${App.escapeHtml(h.cor_nome || 'MDF')} (${h.espessura_mm || 3}mm)</span>
          </td>
          <td>
            <div style="font-size: 0.82rem; color: var(--text-primary);">
              ${(h.largura_m * 100).toFixed(0)} x ${(h.comprimento_m * 100).toFixed(0)} cm
            </div>
            <div style="font-size: 0.74rem; color: var(--text-muted);">${h.area_m2.toFixed(4)} m²</div>
          </td>
          <td>
            <span style="font-size: 0.84rem; font-weight: 600; color: #38bdf8;">${h.tempo_minutos} min</span>
            <div style="font-size: 0.74rem; color: var(--text-muted);">${App.formatMoney(h.custo_laser)}</div>
          </td>
          <td style="text-align: center;">
            <strong style="color: #ffffff;">${h.quantidade_pecas || 1} un</strong>
          </td>
          <td>
            <div style="font-size: 0.78rem; color: var(--text-secondary);">Custo: ${App.formatMoney(h.custo_total || h.custo_unitario)}</div>
            <div style="font-size: 0.95rem; font-weight: 800; color: #34d399;">Venda: ${App.formatMoney(h.preco_venda_total || h.preco_venda_unitario)}</div>
          </td>
          <td style="text-align: right; white-space: nowrap;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="CalculadoraLaserModule.carregarCalculo('${h.id}')" title="Carregar este cálculo no simulador" style="padding: 5px 8px;">
              🔄 Carregar
            </button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="CalculadoraLaserModule.copiarWhatsAppItem('${h.id}')" title="Copiar orçamento para WhatsApp" style="padding: 5px 8px;">
              💬 Copiar
            </button>
            <button type="button" class="btn btn-secondary btn-sm" onclick="CalculadoraLaserModule.excluirHistorico('${h.id}')" title="Excluir" style="padding: 5px 8px; color: #f87171;">
              🗑️
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  carregarCalculo(id) {
    const hist = StorageService.getCalcLaserHistorico() || [];
    const item = hist.find(h => h.id === id);
    if (!item) return;

    const prod = document.getElementById('calc-laser-produto');
    const larg = document.getElementById('calc-laser-largura');
    const comp = document.getElementById('calc-laser-comprimento');
    const tempo = document.getElementById('calc-laser-tempo-min');
    const qtd = document.getElementById('calc-laser-qtd');
    const margem = document.getElementById('calc-laser-margem');
    const extras = document.getElementById('calc-laser-extras');

    if (prod) prod.value = item.produto_nome || '';
    if (tempo) tempo.value = item.tempo_minutos || 0;
    if (qtd) qtd.value = item.quantidade_pecas || 1;
    if (margem) margem.value = item.margem_lucro_pct || 100;
    if (extras) extras.value = item.custos_extras || 0;

    if (this.unidadeMedida === 'cm') {
      if (larg) larg.value = (item.largura_m * 100).toFixed(1);
      if (comp) comp.value = (item.comprimento_m * 100).toFixed(1);
    } else {
      if (larg) larg.value = item.largura_m.toFixed(3);
      if (comp) comp.value = item.comprimento_m.toFixed(3);
    }

    if (item.cor_id) {
      this.corAtivaId = item.cor_id;
      this.renderCorChips();
    }

    this.calcular();
    App.toast(`Cálculo de "${item.produto_nome}" carregado no simulador!`, 'info');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  excluirHistorico(id) {
    if (!confirm('Deseja excluir este cálculo do histórico?')) return;
    StorageService.deleteCalcLaserHistoricoItem(id);
    App.toast('Cálculo excluído do histórico.', 'info');
    this.renderHistorico();
  },

  limparFormulario() {
    const setVal = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.value = v;
    };
    setVal('calc-laser-produto', '');
    setVal('calc-laser-largura', this.unidadeMedida === 'cm' ? '30' : '0.30');
    setVal('calc-laser-comprimento', this.unidadeMedida === 'cm' ? '30' : '0.30');
    setVal('calc-laser-tempo-min', '10');
    setVal('calc-laser-qtd', '1');
    setVal('calc-laser-margem', '100');
    setVal('calc-laser-extras', '0');
    this.corAtivaId = 'cru';
    this.renderCorChips();
    this.calcular();
    App.toast('Formulário limpo com os valores padrão!', 'info');
  },

  copiarWhatsAppAtual() {
    const cfg = this.getConfig();
    const chapas = cfg.chapas || [];
    const prodNome = document.getElementById('calc-laser-produto')?.value.trim() || 'Peça Corte/Gravação Laser';
    const largRaw = parseFloat(document.getElementById('calc-laser-largura')?.value) || 0;
    const compRaw = parseFloat(document.getElementById('calc-laser-comprimento')?.value) || 0;
    const tempoMin = parseFloat(document.getElementById('calc-laser-tempo-min')?.value) || 0;
    const qtd = Math.max(1, parseInt(document.getElementById('calc-laser-qtd')?.value, 10) || 1);
    const precoUnit = document.getElementById('res-laser-preco-venda-unit')?.textContent || 'R$ 0,00';
    const totalLote = document.getElementById('res-laser-lote-venda')?.textContent || precoUnit;

    const chapa = chapas.find(c => c.id === this.corAtivaId) || chapas[0];

    const texto = [
      `🔥 *Orçamento de Corte & Gravação Laser — Seven Personalizados*`,
      ``,
      `📦 *Item:* ${prodNome}`,
      `🎨 *Material:* ${chapa.nome} (${chapa.espessura_mm}mm)`,
      `📐 *Medidas:* ${largRaw} x ${compRaw} ${this.unidadeMedida}`,
      `⏱️ *Tempo de Laser:* ${tempoMin} min`,
      `🔢 *Quantidade:* ${qtd} peça(s)`,
      `💰 *Valor Unitário:* ${precoUnit}`,
      qtd > 1 ? `💵 *Valor Total do Pedido:* ${totalLote}` : ``,
      ``,
      `🚀 *Seven Personalizados* | Produção de Alto Padrão`
    ].filter(Boolean).join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(() => {
        App.toast('Orçamento copiado para a área de transferência! Cole no WhatsApp.', 'success');
      });
    } else {
      prompt('Copie o orçamento abaixo:', texto);
    }
  },

  copiarWhatsAppItem(id) {
    const hist = StorageService.getCalcLaserHistorico() || [];
    const item = hist.find(h => h.id === id);
    if (!item) return;

    const texto = [
      `🔥 *Orçamento de Corte & Gravação Laser — Seven Personalizados*`,
      ``,
      `📦 *Item:* ${item.produto_nome}`,
      `🎨 *Material:* ${item.cor_nome} (${item.espessura_mm}mm)`,
      `📐 *Medidas:* ${(item.largura_m * 100).toFixed(0)} x ${(item.comprimento_m * 100).toFixed(0)} cm`,
      `⏱️ *Tempo de Laser:* ${item.tempo_minutos} min`,
      `🔢 *Quantidade:* ${item.quantidade_pecas} peça(s)`,
      `💰 *Valor Unitário:* ${App.formatMoney(item.preco_venda_unitario)}`,
      item.quantidade_pecas > 1 ? `💵 *Valor Total do Pedido:* ${App.formatMoney(item.preco_venda_total)}` : ``,
      ``,
      `🚀 *Seven Personalizados* | Produção de Alto Padrão`
    ].filter(Boolean).join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texto).then(() => {
        App.toast('Orçamento copiado para a área de transferência!', 'success');
      });
    } else {
      prompt('Copie o orçamento abaixo:', texto);
    }
  },

  enviarParaOrcamento() {
    const prodNome = document.getElementById('calc-laser-produto')?.value.trim() || 'Peça Personalizada Laser';
    const largRaw = parseFloat(document.getElementById('calc-laser-largura')?.value) || 0;
    const compRaw = parseFloat(document.getElementById('calc-laser-comprimento')?.value) || 0;
    const tempoMin = parseFloat(document.getElementById('calc-laser-tempo-min')?.value) || 0;
    const qtd = Math.max(1, parseInt(document.getElementById('calc-laser-qtd')?.value, 10) || 1);
    const precoUnitStr = document.getElementById('res-laser-preco-venda-unit')?.textContent || '0';
    const precoUnit = parseFloat(precoUnitStr.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;

    const cfg = this.getConfig();
    const chapa = (cfg.chapas || []).find(c => c.id === this.corAtivaId) || { nome: 'MDF Cru', cor: 'Cru' };

    // Abre modal de propostas/orçamento
    if (typeof PropostasModule !== 'undefined' && PropostasModule.openNewModal) {
      PropostasModule.openNewModal();
      
      // Preenche dados do item
      setTimeout(() => {
        const descInput = document.getElementById('prop-itens-container');
        if (typeof propostaItensTemp !== 'undefined') {
          propostaItensTemp = [{
            produto_nome: prodNome,
            cor: chapa.cor,
            personalizacao: `Corte/Gravação Laser ${largRaw}x${compRaw}${this.unidadeMedida} (${tempoMin} min)`,
            observacao: `Calculado na Calculadora Laser: ${chapa.nome}`,
            quantidade: qtd,
            preco_unitario: precoUnit,
            subtotal: precoUnit * qtd
          }];
          PropostasModule.renderItensTable();
        }
        App.toast('Dados da Calculadora Laser transferidos para o Novo Orçamento!', 'success');
      }, 100);
    }
  },

  abrirModalConfig() {
    const cfg = this.getConfig();
    const horaInput = document.getElementById('cfg-laser-hora-val');
    if (horaInput) horaInput.value = cfg.valor_hora_laser || 30.00;

    this.renderConfigChapasTable();
    App.openModal('modal-calc-laser-config');
  },

  abrirModalNovaCor() {
    this.abrirModalConfig();
    setTimeout(() => {
      const box = document.getElementById('cfg-laser-add-cor-box');
      if (box) box.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const inputNome = document.getElementById('cfg-laser-nova-cor-nome');
      if (inputNome) inputNome.focus();
    }, 120);
  },

  renderConfigChapasTable() {
    const cfg = this.getConfig();
    const tbody = document.getElementById('cfg-laser-chapas-tbody');
    if (!tbody) return;

    const chapas = cfg.chapas || [];
    tbody.innerHTML = chapas.map(ch => {
      const area = (Number(ch.largura_m) || 0) * (Number(ch.comprimento_m) || 0);
      const custoM2 = area > 0 ? ((Number(ch.preco_chapa) || 0) / area) : 0;
      return `
        <tr data-chapa-id="${App.escapeHtml(ch.id)}">
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <input type="color" class="cfg-chapa-hex" value="${ch.cor_hex || '#38bdf8'}" title="Alterar cor visual" style="width: 24px; height: 24px; padding: 0; border: none; background: transparent; cursor: pointer;">
              <div>
                <strong>${App.escapeHtml(ch.nome)}</strong>
                <div style="font-size: 0.7rem; color: var(--text-muted);">${App.escapeHtml(ch.cor)}</div>
              </div>
            </div>
          </td>
          <td>
            <input type="number" step="0.5" class="form-control form-control-sm cfg-chapa-esp" value="${ch.espessura_mm}" style="width: 68px;">
          </td>
          <td>
            <input type="number" step="0.01" class="form-control form-control-sm cfg-chapa-larg" value="${ch.largura_m}" style="width: 78px;" oninput="CalculadoraLaserModule.atualizarPreviewConfigRow(this)">
          </td>
          <td>
            <input type="number" step="0.01" class="form-control form-control-sm cfg-chapa-comp" value="${ch.comprimento_m}" style="width: 78px;" oninput="CalculadoraLaserModule.atualizarPreviewConfigRow(this)">
          </td>
          <td>
            <input type="number" step="0.01" class="form-control form-control-sm cfg-chapa-preco" value="${ch.preco_chapa}" style="width: 88px;" oninput="CalculadoraLaserModule.atualizarPreviewConfigRow(this)">
          </td>
          <td class="cfg-chapa-res" style="font-size: 0.80rem; font-weight: 700; color: #a5b4fc; white-space: nowrap;">
            ${area.toFixed(4)} m² <br>
            <span style="color: #34d399;">${App.formatMoney(custoM2)}/m²</span>
          </td>
          <td style="text-align: center;">
            ${chapas.length > 1 ? `
              <button type="button" class="btn btn-secondary btn-icon" onclick="CalculadoraLaserModule.removerCor('${App.escapeHtml(ch.id)}')" title="Remover esta cor" style="padding: 4px 7px; color: #f87171;">
                🗑️
              </button>
            ` : '—'}
          </td>
        </tr>
      `;
    }).join('');
  },

  adicionarNovaCor() {
    const corNomeEl = document.getElementById('cfg-laser-nova-cor-nome');
    const matNomeEl = document.getElementById('cfg-laser-nova-cor-material');
    const hexEl = document.getElementById('cfg-laser-nova-cor-hex');
    const espEl = document.getElementById('cfg-laser-nova-cor-esp');
    const largEl = document.getElementById('cfg-laser-nova-cor-larg');
    const compEl = document.getElementById('cfg-laser-nova-cor-comp');
    const precoEl = document.getElementById('cfg-laser-nova-cor-preco');

    const cor = (corNomeEl?.value || '').trim();
    if (!cor) {
      App.toast('Informe o nome da nova cor (ex: Verde, Rosa, Acrílico Cristal).', 'error');
      if (corNomeEl) corNomeEl.focus();
      return;
    }

    const nomeMaterial = (matNomeEl?.value || '').trim() || `MDF ${cor}`;
    const corHex = hexEl?.value || '#22c55e';
    const esp = parseFloat(espEl?.value) || 3;
    const larg = parseFloat(largEl?.value) || 1.20;
    const comp = parseFloat(compEl?.value) || 1.85;
    const preco = parseFloat(precoEl?.value) || 110.00;

    const currentCfg = this.getConfig();
    const chapas = [...(currentCfg.chapas || [])];

    // Gera ID único e seguro a partir do nome
    const baseId = cor.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'cor';
    let novoId = baseId;
    let contador = 2;
    while (chapas.some(c => c.id === novoId)) {
      novoId = `${baseId}_${contador++}`;
    }

    const novaChapa = {
      id: novoId,
      nome: nomeMaterial,
      cor: cor,
      espessura_mm: esp,
      largura_m: larg,
      comprimento_m: comp,
      preco_chapa: preco,
      cor_hex: corHex,
      bg_badge: 'rgba(56, 189, 248, 0.18)',
      text_color: '#f8fafc'
    };

    chapas.push(novaChapa);

    StorageService.saveCalcLaserConfig({
      ...currentCfg,
      chapas
    });

    // Limpa campos do formulário de nova cor
    if (corNomeEl) corNomeEl.value = '';
    if (matNomeEl) matNomeEl.value = '';

    // Seleciona automaticamente a nova cor adicionada
    this.corAtivaId = novoId;
    this.renderConfigChapasTable();
    this.render();
    App.toast(`Cor "${cor}" adicionada à Calculadora Laser! 🎨`, 'success');
  },

  removerCor(corId) {
    const currentCfg = this.getConfig();
    const chapas = [...(currentCfg.chapas || [])];
    if (chapas.length <= 1) {
      App.toast('É necessário manter pelo menos uma cor cadastrada.', 'error');
      return;
    }

    const alvo = chapas.find(c => c.id === corId);
    if (!alvo) return;
    if (!confirm(`Remover a cor "${alvo.nome}" da Calculadora Laser?`)) return;

    const restantes = chapas.filter(c => c.id !== corId);
    if (this.corAtivaId === corId) {
      this.corAtivaId = restantes[0].id;
    }

    StorageService.saveCalcLaserConfig({
      ...currentCfg,
      chapas: restantes
    });

    this.renderConfigChapasTable();
    this.render();
    App.toast(`Cor "${alvo.nome}" removida.`, 'info');
  },

  atualizarPreviewConfigRow(inputEl) {
    const tr = inputEl.closest('tr');
    if (!tr) return;
    const larg = parseFloat(tr.querySelector('.cfg-chapa-larg')?.value) || 0;
    const comp = parseFloat(tr.querySelector('.cfg-chapa-comp')?.value) || 0;
    const preco = parseFloat(tr.querySelector('.cfg-chapa-preco')?.value) || 0;

    const area = larg * comp;
    const custoM2 = area > 0 ? (preco / area) : 0;

    const resCell = tr.querySelector('.cfg-chapa-res');
    if (resCell) {
      resCell.innerHTML = `
        ${area.toFixed(4)} m² <br>
        <span style="color: #34d399;">${App.formatMoney(custoM2)}/m²</span>
      `;
    }
  },

  salvarConfigForm() {
    const horaVal = parseFloat(document.getElementById('cfg-laser-hora-val')?.value) || 30.00;
    const currentCfg = this.getConfig();
    const rows = document.querySelectorAll('#cfg-laser-chapas-tbody tr');

    const updatedChapas = (currentCfg.chapas || []).map(ch => {
      const tr = Array.from(rows).find(r => r.getAttribute('data-chapa-id') === ch.id);
      if (!tr) return ch;

      const hex = tr.querySelector('.cfg-chapa-hex')?.value || ch.cor_hex;
      const esp = parseFloat(tr.querySelector('.cfg-chapa-esp')?.value) || ch.espessura_mm;
      const larg = parseFloat(tr.querySelector('.cfg-chapa-larg')?.value) || ch.largura_m;
      const comp = parseFloat(tr.querySelector('.cfg-chapa-comp')?.value) || ch.comprimento_m;
      const preco = parseFloat(tr.querySelector('.cfg-chapa-preco')?.value) || ch.preco_chapa;

      return {
        ...ch,
        cor_hex: hex,
        espessura_mm: esp,
        largura_m: larg,
        comprimento_m: comp,
        preco_chapa: preco
      };
    });

    const newCfg = {
      ...currentCfg,
      valor_hora_laser: horaVal,
      chapas: updatedChapas
    };

    StorageService.saveCalcLaserConfig(newCfg);
    App.closeModal('modal-calc-laser-config');
    App.toast('Parâmetros da Calculadora Laser atualizados com sucesso!', 'success');
    this.render();
  },

  restaurarPadroes() {
    if (!confirm('Deseja restaurar todas as chapas e a hora laser para os padrões iniciais da Seven Personalizados?')) return;

    const defaults = {
      id: 'main_laser_calc',
      valor_hora_laser: 30.00,
      margem_padrao: 100,
      chapas: [
        { id: 'cru', nome: 'MDF Cru', cor: 'Cru', espessura_mm: 3, largura_m: 2.13, comprimento_m: 2.75, preco_chapa: 60.18, cor_hex: '#d97706', bg_badge: 'rgba(217, 119, 6, 0.2)', text_color: '#fbbf24' },
        { id: 'branco', nome: 'MDF Branco', cor: 'Branco', espessura_mm: 3, largura_m: 1.20, comprimento_m: 1.85, preco_chapa: 99.55, cor_hex: '#f8fafc', bg_badge: 'rgba(255, 255, 255, 0.15)', text_color: '#f8fafc' },
        { id: 'preto', nome: 'MDF Preto', cor: 'Preto', espessura_mm: 3, largura_m: 1.20, comprimento_m: 1.85, preco_chapa: 105.00, cor_hex: '#334155', bg_badge: 'rgba(51, 65, 85, 0.4)', text_color: '#cbd5e1' },
        { id: 'azul', nome: 'MDF Azul', cor: 'Azul', espessura_mm: 3, largura_m: 1.20, comprimento_m: 1.85, preco_chapa: 110.00, cor_hex: '#3b82f6', bg_badge: 'rgba(59, 130, 246, 0.2)', text_color: '#60a5fa' },
        { id: 'vermelho', nome: 'MDF Vermelho', cor: 'Vermelho', espessura_mm: 3, largura_m: 1.20, comprimento_m: 1.85, preco_chapa: 110.00, cor_hex: '#ef4444', bg_badge: 'rgba(239, 68, 68, 0.2)', text_color: '#f87171' },
        { id: 'gold', nome: 'Gold (Dourado)', cor: 'Gold', espessura_mm: 2, largura_m: 1.00, comprimento_m: 2.00, preco_chapa: 180.00, cor_hex: '#eab308', bg_badge: 'rgba(234, 179, 8, 0.22)', text_color: '#fde047' },
        { id: 'silver', nome: 'Silver (Prata)', cor: 'Silver', espessura_mm: 2, largura_m: 1.00, comprimento_m: 2.00, preco_chapa: 180.00, cor_hex: '#94a3b8', bg_badge: 'rgba(148, 163, 184, 0.22)', text_color: '#e2e8f0' }
      ]
    };

    StorageService.saveCalcLaserConfig(defaults);
    App.closeModal('modal-calc-laser-config');
    App.toast('Padrões restaurados com sucesso!', 'success');
    this.render();
  },

  // =========================================================================
  // TABELA DE PARÂMETROS LASER (EIXO ROTATIVO / GRBL $101 / DIÂMETRO & CIRC.)
  // =========================================================================
  renderParametrosRotativo(buscaFiltro) {
    const tbody = document.getElementById('calc-laser-rotativo-tbody');
    if (!tbody) return;

    const termo = (buscaFiltro !== undefined
      ? buscaFiltro
      : (document.getElementById('rot-busca-input')?.value || '')
    ).toLowerCase().trim();

    let lista = StorageService.getParametrosLaserRotativo() || [];

    const countEl = document.getElementById('calc-laser-rot-count');
    if (countEl) countEl.textContent = lista.length;

    if (termo) {
      lista = lista.filter(p =>
        (p.item || '').toLowerCase().includes(termo) ||
        (p.parametro || '').toLowerCase().includes(termo) ||
        (p.obs || '').toLowerCase().includes(termo)
      );
    }

    // Mantém itens em destaque (PADRÃO) sempre no topo e ordena o restante em ordem alfabética/numérica
    const ordenada = [...lista].sort((a, b) => {
      if (a.destaque && !b.destaque) return -1;
      if (!a.destaque && b.destaque) return 1;
      return String(a.item || '').localeCompare(String(b.item || ''), 'pt-BR', { sensitivity: 'base', numeric: true });
    });

    if (ordenada.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 28px; color: var(--text-muted);">
            Nenhum parâmetro encontrado para "${App.escapeHtml(termo)}".
          </td>
        </tr>
      `;
      return;
    }

    const fmtNum = (val) => {
      if (val === '' || val === null || val === undefined) return '<span style="color: var(--text-muted); opacity: 0.5;">—</span>';
      const n = parseFloat(String(val).replace(',', '.'));
      if (isNaN(n)) return App.escapeHtml(String(val));
      return `${n.toString().replace('.', ',')} cm`;
    };

    tbody.innerHTML = ordenada.map(p => {
      const isDestaque = !!p.destaque;
      const rowStyle = isDestaque
        ? 'background: linear-gradient(90deg, rgba(245, 158, 11, 0.22) 0%, rgba(245, 158, 11, 0.08) 100%); border-left: 4px solid #f59e0b;'
        : '';

      const paramHtml = p.parametro && p.parametro.trim()
        ? `
          <div style="display: inline-flex; align-items: center; gap: 6px;">
            <code style="font-family: 'JetBrains Mono', monospace; font-size: 0.86rem; font-weight: 800; padding: 4px 10px; border-radius: 6px; ${isDestaque ? 'background: rgba(245, 158, 11, 0.3); color: #fde68a; border: 1px solid rgba(245, 158, 11, 0.6);' : 'background: rgba(56, 189, 248, 0.14); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4);'}">
              ${App.escapeHtml(p.parametro)}
            </code>
            <button type="button" class="btn btn-secondary btn-icon" onclick="CalculadoraLaserModule.copiarParametroGrbl('${App.escapeHtml(p.parametro)}')" title="Copiar comando GRBL" style="padding: 3px 7px; font-size: 0.72rem;">
              📋
            </button>
          </div>
        `
        : '<span style="color: var(--text-muted); font-size: 0.78rem; font-style: italic;">Não definido</span>';

      return `
        <tr style="${rowStyle}">
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              ${isDestaque ? '<span style="font-size: 0.9rem;">⭐</span>' : ''}
              <strong style="color: ${isDestaque ? '#fde68a' : '#ffffff'}; font-size: 0.9rem;">
                ${App.escapeHtml(p.item)}
              </strong>
            </div>
          </td>
          <td>${paramHtml}</td>
          <td style="text-align: center; font-weight: 600; color: var(--text-primary);">${fmtNum(p.diametro_cm)}</td>
          <td style="text-align: center; font-weight: 600; color: #34d399;">${fmtNum(p.circunferencia_cm)}</td>
          <td style="font-size: 0.78rem; color: var(--text-secondary);">${p.obs ? App.escapeHtml(p.obs) : '<span style="opacity: 0.4;">—</span>'}</td>
          <td style="text-align: right; white-space: nowrap;">
            <div style="display: inline-flex; gap: 5px;">
              <button type="button" class="btn btn-secondary btn-icon" onclick="CalculadoraLaserModule.editarParametroRotativo('${App.escapeHtml(p.id)}')" title="Editar parâmetro" style="padding: 4px 8px;">
                ✏️
              </button>
              <button type="button" class="btn btn-secondary btn-icon" onclick="CalculadoraLaserModule.excluirParametroRotativo('${App.escapeHtml(p.id)}')" title="Excluir parâmetro" style="padding: 4px 8px; color: #f87171;">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  onDiametroInput(val) {
    const num = parseFloat(String(val).replace(',', '.'));
    const circEl = document.getElementById('rot-form-circunferencia');
    if (!circEl) return;
    if (!isNaN(num) && num > 0) {
      circEl.value = (num * Math.PI).toFixed(1);
    }
  },

  onCircunferenciaInput(val) {
    const num = parseFloat(String(val).replace(',', '.'));
    const diamEl = document.getElementById('rot-form-diametro');
    if (!diamEl) return;
    if (!isNaN(num) && num > 0) {
      diamEl.value = (num / Math.PI).toFixed(1);
    }
  },

  normalizarParametroGrbl(valor) {
    const raw = String(valor || '').trim().replace(',', '.');
    if (!raw) return '';
    // Remove prefixo $101= se já digitado/colado, para nunca duplicar
    const somenteValor = raw.replace(/^\$101\s*=\s*/i, '').trim();
    if (!somenteValor) return '';
    return `$101=${somenteValor}`;
  },

  extrairValorParametroGrbl(parametro) {
    return String(parametro || '').trim().replace(/^\$101\s*=\s*/i, '').trim();
  },

  salvarParametroRotativo() {
    const id = (document.getElementById('rot-form-id')?.value || '').trim();
    const item = (document.getElementById('rot-form-item')?.value || '').trim();
    const parametroRaw = (document.getElementById('rot-form-parametro')?.value || '').trim();
    const parametro = this.normalizarParametroGrbl(parametroRaw);
    const diametro_cm = (document.getElementById('rot-form-diametro')?.value || '').trim();
    const circunferencia_cm = (document.getElementById('rot-form-circunferencia')?.value || '').trim();
    const obs = (document.getElementById('rot-form-obs')?.value || '').trim();
    const destaque = !!document.getElementById('rot-form-destaque')?.checked;

    if (!item) {
      App.toast('Informe o nome do Item / Produto (ex: Garrafa 1200, Copo Cuia).', 'error');
      document.getElementById('rot-form-item')?.focus();
      return;
    }

    const lista = [...StorageService.getParametrosLaserRotativo()];

    if (id) {
      const idx = lista.findIndex(p => p.id === id);
      if (idx !== -1) {
        lista[idx] = { ...lista[idx], item, parametro, diametro_cm, circunferencia_cm, obs, destaque };
      }
      StorageService.saveParametrosLaserRotativo(lista);
      App.toast(`Parâmetro "${item}" atualizado! 🎯`, 'success');
    } else {
      lista.push({
        id: `rot-${Date.now()}`,
        item,
        parametro,
        diametro_cm,
        circunferencia_cm,
        obs,
        destaque
      });
      StorageService.saveParametrosLaserRotativo(lista);
      App.toast(`Parâmetro "${item}" adicionado à tabela! 🎯`, 'success');
    }

    this.cancelarEdicaoParametro();
    this.renderParametrosRotativo();
  },

  editarParametroRotativo(id) {
    const lista = StorageService.getParametrosLaserRotativo();
    const p = lista.find(x => x.id === id);
    if (!p) return;

    document.getElementById('rot-form-id').value = p.id;
    document.getElementById('rot-form-item').value = p.item || '';
    document.getElementById('rot-form-parametro').value = this.extrairValorParametroGrbl(p.parametro);
    document.getElementById('rot-form-diametro').value = p.diametro_cm || '';
    document.getElementById('rot-form-circunferencia').value = p.circunferencia_cm || '';
    document.getElementById('rot-form-obs').value = p.obs || '';
    const chk = document.getElementById('rot-form-destaque');
    if (chk) chk.checked = !!p.destaque;

    const titleEl = document.getElementById('rot-form-title');
    if (titleEl) titleEl.textContent = `✏️ Editando: ${p.item}`;
    const btnSalvar = document.getElementById('rot-btn-salvar');
    if (btnSalvar) btnSalvar.textContent = '💾 Atualizar';
    const btnCancelar = document.getElementById('rot-btn-cancelar');
    if (btnCancelar) btnCancelar.style.display = 'inline-flex';

    document.getElementById('rot-form-item')?.focus();
  },

  cancelarEdicaoParametro() {
    const ids = ['rot-form-id', 'rot-form-item', 'rot-form-parametro', 'rot-form-diametro', 'rot-form-circunferencia', 'rot-form-obs'];
    ids.forEach(fid => {
      const el = document.getElementById(fid);
      if (el) el.value = '';
    });
    const chk = document.getElementById('rot-form-destaque');
    if (chk) chk.checked = false;

    const titleEl = document.getElementById('rot-form-title');
    if (titleEl) titleEl.textContent = '➕ Adicionar Novo Parâmetro';
    const btnSalvar = document.getElementById('rot-btn-salvar');
    if (btnSalvar) btnSalvar.textContent = '+ Salvar';
    const btnCancelar = document.getElementById('rot-btn-cancelar');
    if (btnCancelar) btnCancelar.style.display = 'none';
  },

  excluirParametroRotativo(id) {
    const lista = StorageService.getParametrosLaserRotativo();
    const alvo = lista.find(x => x.id === id);
    if (!alvo) return;
    if (!confirm(`Remover o parâmetro "${alvo.item}" da tabela?`)) return;

    const novaLista = lista.filter(x => x.id !== id);
    StorageService.saveParametrosLaserRotativo(novaLista);
    App.toast(`Parâmetro "${alvo.item}" removido.`, 'info');
    this.renderParametrosRotativo();
  },

  copiarParametroGrbl(parametro) {
    if (!parametro) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(parametro).then(() => {
        App.toast(`Comando "${parametro}" copiado! Cole no console da Laser. 📋`, 'success');
      }).catch(() => {
        App.toast(`Comando: ${parametro}`, 'info');
      });
    } else {
      const tmp = document.createElement('textarea');
      tmp.value = parametro;
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand('copy');
      document.body.removeChild(tmp);
      App.toast(`Comando "${parametro}" copiado! 📋`, 'success');
    }
  }
};

// Inicia o módulo quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  CalculadoraLaserModule.init();
});
