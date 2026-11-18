/**
 * SEVEN PERSONALIZADOS — MÓDULO DE CALENDÁRIO DE ENTREGAS & PRAZOS (PAINEL GERAL)
 * Sinaliza visualmente as datas limites de entrega de encomendas e permite abrir os detalhes completos.
 */

const CalendarModule = {
  currentDate: new Date(),
  selectedDateStr: null,

  init() {
    this.currentDate = new Date();
    this.selectedDateStr = this.formatDateIso(this.currentDate);
    this.render();

    window.addEventListener('seven_data_updated', (e) => {
      if (!e.detail || e.detail?.table === 'encomendas') {
        this.render();
      }
    });
  },

  formatDateIso(date) {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  prevMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.render();
  },

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.render();
  },

  goToToday() {
    this.currentDate = new Date();
    this.selectedDateStr = this.formatDateIso(this.currentDate);
    this.render();
  },

  selectDay(dateStr) {
    this.selectedDateStr = dateStr;
    this.renderSelectedDayDetails(dateStr);
    
    // Atualiza destaque visual do dia selecionado
    document.querySelectorAll('.cal-day-cell').forEach(cell => {
      if (cell.getAttribute('data-date') === dateStr) {
        cell.classList.add('is-selected');
      } else {
        cell.classList.remove('is-selected');
      }
    });
  },

  render() {
    const container = document.getElementById('dash-calendario-container');
    if (!container) return;

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const titleEl = document.getElementById('dash-cal-month-title');
    if (titleEl) {
      titleEl.textContent = `${monthNames[month]} de ${year}`;
    }

    const encomendas = StorageService.get('encomendas') || [];
    
    // Contagem de encomendas com entrega no mês atual
    const mesFormatado = `${year}-${(month + 1).toString().padStart(2, '0')}`;
    const encsMes = encomendas.filter(e => (e.data_entrega_prevista || '').startsWith(mesFormatado) && e.status !== 'Cancelada');
    
    const badgeMesEl = document.getElementById('dash-cal-total-mes');
    if (badgeMesEl) {
      badgeMesEl.textContent = `${encsMes.length} ${encsMes.length === 1 ? 'Entrega no Mês' : 'Entregas no Mês'}`;
    }

    const hojeStr = this.formatDateIso(new Date());

    // Primeiro dia do mês e total de dias
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Domingo
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    let html = `
      <div class="cal-month-grid">
        ${weekDays.map(d => `<div class="cal-weekday-header">${d}</div>`).join('')}
    `;

    // Dias do mês anterior
    for (let x = firstDayIndex; x > 0; x--) {
      const dayNum = prevMonthTotalDays - x + 1;
      const prevDate = new Date(year, month - 1, dayNum);
      const prevDateStr = this.formatDateIso(prevDate);
      html += this.renderDayCell(prevDateStr, dayNum, false, hojeStr, encomendas);
    }

    // Dias do mês atual
    for (let i = 1; i <= totalDays; i++) {
      const curDate = new Date(year, month, i);
      const curDateStr = this.formatDateIso(curDate);
      html += this.renderDayCell(curDateStr, i, true, hojeStr, encomendas);
    }

    // Dias do próximo mês para fechar a grade (múltiplo de 7)
    const totalCellsRendered = firstDayIndex + totalDays;
    const remainingCells = (7 - (totalCellsRendered % 7)) % 7;
    for (let j = 1; j <= remainingCells; j++) {
      const nextDate = new Date(year, month + 1, j);
      const nextDateStr = this.formatDateIso(nextDate);
      html += this.renderDayCell(nextDateStr, j, false, hojeStr, encomendas);
    }

    html += `</div>`;
    container.innerHTML = html;

    // Se houver um dia selecionado, renderiza os detalhes
    if (this.selectedDateStr) {
      this.renderSelectedDayDetails(this.selectedDateStr);
    }
  },

  renderDayCell(dateStr, dayNum, isCurrentMonth, hojeStr, encomendas) {
    const isToday = dateStr === hojeStr;
    const isSelected = dateStr === this.selectedDateStr;

    // Encomendas com entrega neste dia (excluindo canceladas)
    const ordensNoDia = encomendas.filter(e => e.data_entrega_prevista === dateStr && e.status !== 'Cancelada');
    const temOrdens = ordensNoDia.length > 0;

    // Verifica se alguma está atrasada
    const temAtrasada = ordensNoDia.some(e => {
      return dateStr < hojeStr && e.status !== 'Entregue' && e.status !== 'Cancelada';
    });

    let cellClasses = ['cal-day-cell'];
    if (!isCurrentMonth) cellClasses.push('other-month');
    if (isToday) cellClasses.push('is-today');
    if (isSelected) cellClasses.push('is-selected');
    if (temOrdens) cellClasses.push('has-orders');
    if (temAtrasada) cellClasses.push('has-late-orders');

    let badgeCountHtml = '';
    if (temOrdens) {
      badgeCountHtml = `
        <span class="cal-day-badge-count ${temAtrasada ? 'late' : ''}" title="${ordensNoDia.length} encomenda(s) para entrega">
          ${ordensNoDia.length} ${ordensNoDia.length === 1 ? 'ped.' : 'ped.'}
        </span>
      `;
    }

    let ordensPillsHtml = '';
    if (temOrdens) {
      ordensPillsHtml = `
        <div class="cal-day-orders-list">
          ${ordensNoDia.slice(0, 3).map(e => {
            const isLate = dateStr < hojeStr && e.status !== 'Entregue';
            const statusSlug = isLate ? 'atrasado' : this.getStatusSlug(e.status);
            const icon = this.getStatusIcon(e.status, isLate);
            const produtos = (e.itens || []).map(it => it.produto_nome).join(', ') || 'Pedido';
            const tooltip = `Pedido #${e.id.substring(e.id.length - 5)} - ${e.cliente_nome}\nStatus: ${e.status} ${isLate ? '(ATRASADO)' : ''}\nProdutos: ${produtos}\nValor: ${App.formatMoney(e.valor_total)}\nClique para abrir toda a informação!`;

            return `
              <div class="cal-order-item status-${statusSlug}" 
                   onclick="event.stopPropagation(); EncomendasModule.openEditModal('${e.id}')"
                   title="${App.escapeHtml(tooltip)}">
                <div style="display: flex; align-items: center; gap: 4px; overflow: hidden; white-space: nowrap;">
                  <span style="font-size: 0.72rem; flex-shrink: 0;">${icon}</span>
                  <span class="cal-order-item-text" style="font-weight: 700; text-overflow: ellipsis; overflow: hidden;">
                    ${App.escapeHtml(e.cliente_nome)}
                  </span>
                </div>
                <div class="cal-order-item-text" style="font-size: 0.67rem; opacity: 0.85; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
                  ${App.escapeHtml(produtos)}
                </div>
              </div>
            `;
          }).join('')}
          ${ordensNoDia.length > 3 ? `
            <div style="font-size: 0.68rem; font-weight: 700; color: #38bdf8; text-align: center; padding: 2px;">
              +${ordensNoDia.length - 3} mais...
            </div>
          ` : ''}
        </div>
      `;
    }

    return `
      <div class="${cellClasses.join(' ')}" data-date="${dateStr}" onclick="CalendarModule.selectDay('${dateStr}')" title="${temOrdens ? `${ordensNoDia.length} encomenda(s) com entrega para ${App.formatDate(dateStr)} (clique para ver detalhes)` : App.formatDate(dateStr)}">
        <div class="cal-day-top">
          <span class="cal-day-number">${dayNum}</span>
          ${badgeCountHtml}
        </div>
        ${ordensPillsHtml}
      </div>
    `;
  },

  getStatusSlug(status) {
    switch (status) {
      case 'Fila': return 'fila';
      case 'Em produção': return 'producao';
      case 'Pronto': return 'pronto';
      case 'Entregue': return 'entregue';
      default: return 'fila';
    }
  },

  getStatusIcon(status, isLate) {
    if (isLate) return '🚨';
    switch (status) {
      case 'Fila': return '⏳';
      case 'Em produção': return '⚙️';
      case 'Pronto': return '📦';
      case 'Entregue': return '🚚';
      default: return '🧵';
    }
  },

  renderSelectedDayDetails(dateStr) {
    const box = document.getElementById('dash-cal-selected-day-box');
    if (!box) return;

    const encomendas = StorageService.get('encomendas') || [];
    const hojeStr = this.formatDateIso(new Date());
    const ordensNoDia = encomendas.filter(e => e.data_entrega_prevista === dateStr && e.status !== 'Cancelada');

    const dataFmt = App.formatDate(dateStr);

    if (ordensNoDia.length === 0) {
      box.style.display = 'block';
      box.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div style="font-size: 0.88rem; color: var(--text-muted);">
            📅 <strong>${dataFmt}</strong>: Nenhuma encomenda com prazo limite agendado para este dia.
          </div>
          <button type="button" class="btn btn-secondary btn-sm" onclick="EncomendasModule.openNewModal()" style="font-size: 0.78rem;">
            + Nova Encomenda
          </button>
        </div>
      `;
      return;
    }

    box.style.display = 'block';
    box.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.1rem;">📅</span>
          <div>
            <h4 style="margin: 0; color: #ffffff; font-size: 0.95rem; font-weight: 700;">
              Entregas do Dia: ${dataFmt}
            </h4>
            <span style="font-size: 0.74rem; color: var(--text-muted);">
              ${ordensNoDia.length} encomenda(s) com prazo para esta data. Clique em qualquer card abaixo para abrir todos os detalhes da encomenda:
            </span>
          </div>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('dash-cal-selected-day-box').style.display='none'">
          ✕ Ocultar
        </button>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px;">
        ${ordensNoDia.map(e => {
          const isLate = dateStr < hojeStr && e.status !== 'Entregue';
          const icon = this.getStatusIcon(e.status, isLate);
          const produtos = (e.itens || []).map(it => `${it.quantidade}x ${it.produto_nome}`).join(', ') || 'Pedido Personalizado';
          const cores = (e.itens || []).map(it => it.cor).filter(Boolean);

          return `
            <div class="dash-row-clickable" 
                 onclick="EncomendasModule.openEditModal('${e.id}')"
                 title="Clique para abrir toda a informação da encomenda #${e.id.substring(e.id.length - 5)}"
                 style="background: rgba(255, 255, 255, 0.035); border: 1px solid ${isLate ? 'rgba(239, 68, 68, 0.45)' : 'rgba(255, 255, 255, 0.1)'}; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px; transition: all 0.2s ease;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                <div>
                  <div style="font-weight: 700; color: #ffffff; font-size: 0.9rem;">
                    ${icon} ${App.escapeHtml(e.cliente_nome)}
                  </div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">
                    Pedido #${e.id.substring(e.id.length - 5)} • ${App.escapeHtml(e.telefone || 'Sem fone')}
                  </div>
                </div>
                <span class="status-badge ${EncomendasModule.getStatusClass(e.status)}" style="font-size: 0.75rem;">
                  ${isLate ? '🚨 Atrasado' : e.status}
                </span>
              </div>

              <div style="font-size: 0.8rem; color: var(--text-secondary); line-height: 1.35;">
                <strong>Itens:</strong> ${App.escapeHtml(produtos)}
              </div>

              ${cores.length > 0 ? `
                <div style="font-size: 0.74rem;">
                  <span class="badge-cor-tag">🎨 ${App.escapeHtml(cores.join(', '))}</span>
                </div>
              ` : ''}

              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed rgba(255, 255, 255, 0.08); padding-top: 6px; margin-top: 2px;">
                <span style="font-size: 0.8rem; font-weight: 700; color: #34d399;">
                  ${App.formatMoney(e.valor_total)}
                </span>
                <span style="font-size: 0.75rem; color: #38bdf8; font-weight: 600; text-decoration: underline;">
                  Abrir Informação Completa ➔
                </span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
};
