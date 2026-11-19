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

    let badgeHtml = '';
    if (temOrdens) {
      if (ordensNoDia.length === 1) {
        const e = ordensNoDia[0];
        const isLate = dateStr < hojeStr && e.status !== 'Entregue';
        const statusSlug = isLate ? 'atrasado' : this.getStatusSlug(e.status);
        const icon = this.getStatusIcon(e.status, isLate);
        const clienteShort = (e.cliente_nome || '').split(' ')[0];
        badgeHtml = `
          <div class="cal-mini-pill status-${statusSlug}" 
               onclick="event.stopPropagation(); CalendarModule.openEncomenda('${e.id}')"
               title="Ir para a encomenda #${e.id.substring(e.id.length - 5)} - ${App.escapeHtml(e.cliente_nome)}">
            <span>${icon}</span>
            <span class="cal-mini-text">${App.escapeHtml(clienteShort)}</span>
          </div>
        `;
      } else {
        const iconLate = temAtrasada ? '🚨 ' : '🧵 ';
        badgeHtml = `
          <div class="cal-mini-pill ${temAtrasada ? 'status-atrasado' : 'status-producao'}" 
               onclick="CalendarModule.selectDay('${dateStr}')"
               title="${ordensNoDia.length} encomendas com entrega hoje. Clique para ver a lista.">
            <span>${iconLate}${ordensNoDia.length} ped.</span>
          </div>
        `;
      }
    }

    const tooltip = temOrdens 
      ? `${ordensNoDia.length} encomenda(s) para entrega em ${App.formatDate(dateStr)}:\n` + ordensNoDia.map(o => `• #${o.id.substring(o.id.length - 5)} ${o.cliente_nome} (${o.status})`).join('\n') + '\nClique para ver detalhes'
      : App.formatDate(dateStr);

    return `
      <div class="${cellClasses.join(' ')}" data-date="${dateStr}" onclick="CalendarModule.selectDay('${dateStr}')" title="${App.escapeHtml(tooltip)}">
        <span class="cal-day-number">${dayNum}</span>
        ${badgeHtml}
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

  openEncomenda(id) {
    const encomendas = StorageService.get('encomendas') || [];
    const enc = encomendas.find(e => e.id === id);

    // Determina se a encomenda está em Finalizados ou em Encomendas ativas
    const isFinalizada = enc && (
      enc.status === 'Entregue' ||
      enc.status === 'Cancelada' ||
      (enc.status === 'Pronto' && enc.pagamento_status === 'Pago')
    );

    if (isFinalizada) {
      App.navigate('finalizados');
    } else {
      // Limpa filtros restritivos para garantir que a encomenda apareça visível
      const fStatus = document.getElementById('filtro-enc-status');
      const fCat = document.getElementById('filtro-enc-categoria');
      const fPagto = document.getElementById('filtro-enc-pagto');
      if (fStatus) fStatus.value = '';
      if (fCat) fCat.value = '';
      if (fPagto) fPagto.value = '';

      App.navigate('encomendas');
    }

    // Rola até a encomenda e aplica destaque temporário
    setTimeout(() => {
      const row = document.querySelector(`tr[data-enc-id="${id}"]`);
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.style.transition = 'background-color 0.4s ease, box-shadow 0.4s ease';
        row.style.backgroundColor = 'rgba(0, 168, 243, 0.22)';
        row.style.boxShadow = 'inset 0 0 0 1.5px rgba(56, 189, 248, 0.75)';
        setTimeout(() => {
          row.style.backgroundColor = '';
          row.style.boxShadow = '';
        }, 2500);
      }
    }, 120);
  },

  renderSelectedDayDetails(dateStr) {
    const box = document.getElementById('dash-cal-selected-day-box');
    if (!box) return;

    box.style.display = 'block';

    const encomendas = StorageService.get('encomendas') || [];
    const hojeStr = this.formatDateIso(new Date());
    const ordensNoDia = encomendas.filter(e => e.data_entrega_prevista === dateStr && e.status !== 'Cancelada');
    const dataFmt = App.formatDate(dateStr);

    if (ordensNoDia.length === 0) {
      box.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.78rem; color: var(--text-muted);">
          <span>📅 <strong>${dataFmt}</strong>: Nenhuma entrega agendada.</span>
          <button type="button" class="btn btn-secondary btn-sm" onclick="EncomendasModule.openNewModal()" style="font-size: 0.72rem; padding: 2px 8px;">
            + Agendar
          </button>
        </div>
      `;
      return;
    }

    box.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 0.8rem; font-weight: 700; color: #ffffff;">
          📅 Entregas em ${dataFmt} (${ordensNoDia.length}):
        </span>
        <span style="font-size: 0.72rem; color: #38bdf8;">Toque para ir às encomendas</span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px; max-height: 160px; overflow-y: auto;">
        ${ordensNoDia.map(e => {
          const isLate = dateStr < hojeStr && e.status !== 'Entregue';
          const icon = this.getStatusIcon(e.status, isLate);
          const produtos = (e.itens || []).map(it => `${it.quantidade}x ${it.produto_nome}`).join(', ') || 'Pedido Personalizado';
          const statusClass = EncomendasModule.getStatusClass(e.status);

          return `
            <div class="dash-row-clickable" 
                 onclick="CalendarModule.openEncomenda('${e.id}')"
                 title="Ir para a encomenda #${e.id.substring(e.id.length - 5)}"
                 style="background: rgba(255, 255, 255, 0.04); border: 1px solid ${isLate ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.08)'}; border-radius: 6px; padding: 8px 10px; display: flex; justify-content: space-between; align-items: center; gap: 8px;">
              <div style="flex: 1; min-width: 0;">
                <div style="font-weight: 700; color: #ffffff; font-size: 0.82rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${icon} ${App.escapeHtml(e.cliente_nome)} <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: normal;">#${e.id.substring(e.id.length - 5)}</span>
                </div>
                <div style="font-size: 0.74rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${App.escapeHtml(produtos)}
                </div>
              </div>
              <div style="text-align: right; flex-shrink: 0;">
                <span class="status-badge ${statusClass}" style="font-size: 0.7rem; padding: 2px 6px;">
                  ${isLate ? '🚨 Atrasado' : e.status}
                </span>
                <div style="font-size: 0.76rem; font-weight: 700; color: #34d399; margin-top: 2px;">
                  ${App.formatMoney(e.valor_total)}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
};
