/**
 * SEVEN PERSONALIZADOS — MÓDULO GERADOR DE PROPOSTAS COMERCIAIS
 * Criação rápida de propostas visuais timbradas com alta conversão e exportação para PDF/Impressão
 */

const PropostasModule = {
  init() {
    this.renderList();
    window.addEventListener('seven_data_updated', (e) => {
      if (e.detail?.table === 'propostas') this.renderList();
    });
  },

  renderList() {
    const propostas = StorageService.get('propostas');
    const container = document.getElementById('propostas-cards-container');
    if (!container) return;

    if (propostas.length === 0) {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">Nenhuma proposta gerada ainda. Clique em "Nova Proposta" para criar a primeira!</div>`;
      return;
    }

    container.innerHTML = propostas.map(p => `
      <div class="panel-box" style="margin-bottom: 0; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <span class="status-badge badge-pago">${p.status || 'Gerada'}</span>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${App.formatDate(p.criada_em)}</span>
          </div>
          <h4 style="font-family: var(--font-display); font-size: 1.1rem; color: var(--text-primary); margin-bottom: 4px;">
            ${App.escapeHtml(p.titulo || 'Proposta Comercial')}
          </h4>
          <div style="font-size: 0.85rem; color: var(--accent); margin-bottom: 12px; font-weight: 600;">
            Cliente: ${App.escapeHtml(p.cliente)}
          </div>
          <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 16px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
            ${App.escapeHtml(p.escopo)}
          </p>
        </div>
        <div style="border-top: 1px solid var(--border); padding-top: 14px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">Investimento Total</div>
            <div style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary);">${App.formatMoney(p.investimento)}</div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-primary" onclick="PropostasModule.visualizarProposta('${p.id}')" style="padding: 7px 12px; font-size: 0.8rem;">
              Visualizar & Imprimir
            </button>
            <button class="btn btn-secondary btn-icon" onclick="PropostasModule.deleteProposta('${p.id}')" title="Excluir">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  },

  openNewModal() {
    const config = StorageService.getConfig();
    document.getElementById('prop-cliente').value = '';
    document.getElementById('prop-contato').value = '';
    document.getElementById('prop-telefone').value = '';
    document.getElementById('prop-titulo').value = 'Proposta de Produtos Personalizados Exclusivos';
    document.getElementById('prop-escopo').value = 'Fabricação e personalização a laser / 3D de peças conforme especificações do cliente com garantia de acabamento fino.';
    document.getElementById('prop-metodo').value = '1. Envio e aprovação de maquete digital 3D\n2. Fabricação com controle milimétrico de corte e gravação\n3. Limpeza, acabamento artesanal e controle de qualidade\n4. Embalagem reforçada e pronta para entrega';
    document.getElementById('prop-prazo').value = '5 a 7 dias úteis após aprovação da arte final';
    document.getElementById('prop-investimento').value = '';
    document.getElementById('prop-condicoes').value = '50% de sinal no pedido e 50% na conclusão da produção via Pix.';

    App.openModal('modal-proposta');
  },

  save() {
    const cliente = document.getElementById('prop-cliente').value.trim();
    const contato = document.getElementById('prop-contato').value.trim();
    const telefone = document.getElementById('prop-telefone').value.trim();
    const titulo = document.getElementById('prop-titulo').value.trim();
    const escopo = document.getElementById('prop-escopo').value.trim();
    const metodo = document.getElementById('prop-metodo').value.trim();
    const prazo = document.getElementById('prop-prazo').value.trim();
    const investimento = parseFloat(document.getElementById('prop-investimento').value) || 0;
    const condicoes = document.getElementById('prop-condicoes').value.trim();

    if (!cliente || !titulo || investimento <= 0) {
      App.toast('Preencha o cliente, título e valor do investimento.', 'error');
      return;
    }

    const nova = StorageService.insert('propostas', {
      cliente,
      contato,
      telefone,
      titulo,
      escopo,
      metodo,
      prazo,
      investimento,
      condicoes,
      status: 'Aprovada / Ativa',
      criada_em: new Date().toISOString()
    });

    App.toast('Proposta comercial gerada com sucesso!', 'success');
    App.closeModal('modal-proposta');
    this.renderList();
    this.visualizarProposta(nova.id);
  },

  visualizarProposta(id) {
    const p = StorageService.get('propostas').find(item => item.id === id);
    if (!p) return;

    const config = StorageService.getConfig();
    const viewContainer = document.getElementById('proposta-preview-content');
    if (!viewContainer) return;

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
        </div>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
        <div style="font-size: 0.76rem; text-transform: uppercase; color: #0284c7; font-weight: 700; letter-spacing: 0.05em;">Proposta Comercial Preparada Para</div>
        <div style="font-size: 1.25rem; font-weight: 700; color: #0f172a; margin-top: 4px;">${App.escapeHtml(p.cliente)}</div>
        ${p.contato ? `<div style="font-size: 0.88rem; color: #475569;">A/C: ${App.escapeHtml(p.contato)} ${p.telefone ? `(${p.telefone})` : ''}</div>` : ''}
      </div>

      <div style="margin-bottom: 24px;">
        <h3 style="color: #0f172a; font-size: 1.05rem; margin-bottom: 8px; border-left: 4px solid #00a8f3; padding-left: 10px;">1. Objetivo e Escopo da Solução</h3>
        <p style="color: #334155; font-size: 0.95rem; line-height: 1.6; white-space: pre-line;">${App.escapeHtml(p.escopo)}</p>
      </div>

      <div style="margin-bottom: 24px;">
        <h3 style="color: #0f172a; font-size: 1.05rem; margin-bottom: 8px; border-left: 4px solid #00a8f3; padding-left: 10px;">2. Nosso Método & Padrão de Entrega</h3>
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
        <h3 style="color: #0f172a; font-size: 1.05rem; margin-bottom: 8px; border-left: 4px solid #00a8f3; padding-left: 10px;">3. Condições de Pagamento</h3>
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
    if (confirm('Deseja excluir esta proposta?')) {
      StorageService.delete('propostas', id);
      App.toast('Proposta excluída.', 'info');
      this.renderList();
    }
  },

  imprimirPropostaAtual() {
    window.print();
  }
};
