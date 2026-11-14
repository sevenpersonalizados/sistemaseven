/**
 * SEVEN PERSONALIZADOS — MÓDULO CRM (KANBAN DE VENDAS)
 * Gerencia funil de vendas, drag & drop, integração WhatsApp e prospecção
 */

const CRM_STAGES = [
  { key: 'conversas', label: '1. Conversas Iniciais', color: '#60a5fa' },
  { key: 'orcamento', label: '2. Orçamento Enviado', color: '#fbbf24' },
  { key: 'aprovacao', label: '3. Aguardando Aprovação', color: '#c084fc' },
  { key: 'fechado', label: '4. Fechado / Ganho 🎉', color: '#34d399' },
  { key: 'perdido', label: '5. Perdido / Arquivado', color: '#f87171' }
];

let draggedCardId = null;

const CrmModule = {
  init() {
    this.render();
    this.attachEvents();
    window.addEventListener('seven_data_updated', (e) => {
      if (e.detail?.table === 'crm_cards') this.render();
    });
  },

  render(searchTerm = '') {
    const cards = StorageService.get('crm_cards');
    const term = searchTerm.toLowerCase().trim();

    const filteredCards = term
      ? cards.filter(c => 
          (c.lead_name && c.lead_name.toLowerCase().includes(term)) ||
          (c.phone && c.phone.toLowerCase().includes(term)) ||
          (c.last_message && c.last_message.toLowerCase().includes(term))
        )
      : cards;

    // Atualiza contadores de topo
    let totalFunil = 0;
    cards.forEach(c => totalFunil += (Number(c.value) || 0));
    const kpiFunil = document.getElementById('crm-total-funil');
    if (kpiFunil) kpiFunil.textContent = App.formatMoney(totalFunil);

    // Renderiza cada coluna
    CRM_STAGES.forEach(stage => {
      const colEl = document.getElementById(`kanban-list-${stage.key}`);
      const counterEl = document.getElementById(`kanban-counter-${stage.key}`);
      if (!colEl) return;

      const stageCards = filteredCards.filter(c => c.stage === stage.key);
      if (counterEl) counterEl.textContent = stageCards.length;

      if (stageCards.length === 0) {
        colEl.innerHTML = `<div class="kanban-empty-slot" style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.8rem; border: 1px dashed var(--border); border-radius: 8px;">Nenhum lead nesta etapa</div>`;
        return;
      }

      colEl.innerHTML = stageCards.map(card => {
        const cleanPhone = (card.phone || '').replace(/\D/g, '');
        const whatsappUrl = cleanPhone 
          ? `https://wa.me/55${cleanPhone}?text=Olá%20${encodeURIComponent(card.lead_name)},%20tudo%20bem?%20Aqui%20é%20da%20Seven%20Personalizados!`
          : '#';

        return `
          <div class="kanban-card" 
               draggable="true" 
               data-id="${card.id}" 
               id="card-${card.id}"
               ondragstart="CrmModule.handleDragStart(event, '${card.id}')"
               ondragend="CrmModule.handleDragEnd(event)">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
              <h4 class="kanban-card-title">${App.escapeHtml(card.lead_name)}</h4>
              <button class="btn-icon" style="background: transparent; color: var(--text-muted); border: none; cursor: pointer;" onclick="CrmModule.openEditModal('${card.id}')" title="Editar lead">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </button>
            </div>

            ${card.phone ? `
              <a href="${whatsappUrl}" target="_blank" class="kanban-card-phone" title="Abrir conversa no WhatsApp">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                ${App.escapeHtml(card.phone)}
              </a>
            ` : ''}

            ${card.last_message ? `
              <div class="kanban-card-msg">
                ${App.escapeHtml(card.last_message)}
              </div>
            ` : ''}

            <div class="kanban-card-footer">
              <span class="kanban-card-value">${card.value ? App.formatMoney(card.value) : 'Sob Consulta'}</span>
              <span>${card.updated_at ? App.formatRelativeDate(card.updated_at) : 'Recente'}</span>
            </div>

            <div class="kanban-card-action">
              <button type="button" class="btn btn-fechar-encomenda" onclick="CrmModule.fecharEncomenda('${card.id}')" title="Cliente fechou! Transformar em encomenda e abrir produção">
                <span>🛒 Fechou Encomenda</span>
              </button>
            </div>
          </div>
        `;
      }).join('');
    });
  },

  handleDragStart(e, cardId) {
    draggedCardId = cardId;
    e.dataTransfer.setData('text/plain', cardId);
    e.currentTarget.classList.add('dragging');
  },

  handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    document.querySelectorAll('.kanban-column').forEach(col => col.classList.remove('drag-over'));
  },

  handleDragOver(e) {
    e.preventDefault();
    const col = e.currentTarget.closest('.kanban-column');
    if (col) col.classList.add('drag-over');
  },

  handleDragLeave(e) {
    const col = e.currentTarget.closest('.kanban-column');
    if (col) col.classList.remove('drag-over');
  },

  handleDrop(e, targetStage) {
    e.preventDefault();
    const col = e.currentTarget.closest('.kanban-column');
    if (col) col.classList.remove('drag-over');

    const cardId = e.dataTransfer.getData('text/plain') || draggedCardId;
    if (!cardId) return;

    StorageService.update('crm_cards', cardId, { stage: targetStage });
    App.toast(`Lead movido para ${CRM_STAGES.find(s => s.key === targetStage)?.label || targetStage}`, 'success');
    this.render();
  },

  openNewModal() {
    document.getElementById('crm-modal-title').textContent = 'Novo Lead no CRM';
    document.getElementById('crm-form-id').value = '';
    document.getElementById('crm-form-name').value = '';
    document.getElementById('crm-form-phone').value = '';
    document.getElementById('crm-form-value').value = '';
    document.getElementById('crm-form-stage').value = 'conversas';
    document.getElementById('crm-form-msg').value = '';
    document.getElementById('crm-btn-delete').style.display = 'none';

    App.openModal('modal-crm');
  },

  openEditModal(cardId) {
    const card = StorageService.get('crm_cards').find(c => c.id === cardId);
    if (!card) return;

    document.getElementById('crm-modal-title').textContent = 'Editar Lead no CRM';
    document.getElementById('crm-form-id').value = card.id;
    document.getElementById('crm-form-name').value = card.lead_name || '';
    document.getElementById('crm-form-phone').value = card.phone || '';
    document.getElementById('crm-form-value').value = card.value || '';
    document.getElementById('crm-form-stage').value = card.stage || 'conversas';
    document.getElementById('crm-form-msg').value = card.last_message || '';
    document.getElementById('crm-btn-delete').style.display = 'inline-block';

    App.openModal('modal-crm');
  },

  save() {
    const id = document.getElementById('crm-form-id').value;
    const name = document.getElementById('crm-form-name').value.trim();
    const phone = document.getElementById('crm-form-phone').value.trim();
    const value = parseFloat(document.getElementById('crm-form-value').value) || 0;
    const stage = document.getElementById('crm-form-stage').value;
    const msg = document.getElementById('crm-form-msg').value.trim();

    if (!name) {
      App.toast('Por favor, informe o nome do cliente ou empresa.', 'error');
      return;
    }

    const payload = {
      lead_name: name,
      phone: phone,
      value: value,
      stage: stage,
      last_message: msg
    };

    if (id) {
      StorageService.update('crm_cards', id, payload);
      App.toast('Lead atualizado com sucesso!', 'success');
    } else {
      StorageService.insert('crm_cards', payload);
      App.toast('Novo lead adicionado ao CRM!', 'success');
    }

    App.closeModal('modal-crm');
    this.render();
  },

  deleteCurrent() {
    const id = document.getElementById('crm-form-id').value;
    if (!id) return;
    if (confirm('Tem certeza que deseja excluir este lead do CRM?')) {
      StorageService.delete('crm_cards', id);
      App.toast('Lead excluído do CRM.', 'info');
      App.closeModal('modal-crm');
      this.render();
    }
  },

  fecharEncomenda(cardId) {
    const card = StorageService.get('crm_cards').find(c => c.id === cardId);
    if (!card) return;

    // 1. Move lead para etapa "fechado"
    StorageService.update('crm_cards', cardId, { stage: 'fechado' });

    // 2. Navega diretamente para a tela de Encomendas
    App.navigate('encomendas');

    // 3. Abre modal de nova encomenda pré-preenchido com os dados do cliente
    EncomendasModule.openNewModalFromLead(card);

    App.toast(`Pedido fechado! Complete os dados da encomenda de ${card.lead_name}.`, 'success');
  },

  attachEvents() {
    const searchInput = document.getElementById('crm-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.render(e.target.value);
      });
    }
  }
};
