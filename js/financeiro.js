/**
 * SEVEN PERSONALIZADOS — MÓDULO FINANCEIRO & FLUXO DE CAIXA
 * Gestão de despesas, entradas de encomendas, demonstrativo e balanço
 */

let chartFinanceiroInstance = null;

const FinanceiroModule = {
  init() {
    this.render();
    window.addEventListener('seven_data_updated', (e) => {
      if (e.detail?.table === 'despesas' || e.detail?.table === 'encomendas') {
        this.render();
      }
    });
  },

  render() {
    const despesas = StorageService.get('despesas');
    const encomendas = StorageService.get('encomendas');

    // Cálculos do mês
    const totalReceitas = encomendas.reduce((acc, e) => acc + (Number(e.valor_pago) || 0), 0);
    const totalDespesas = despesas.reduce((acc, d) => acc + (Number(d.valor) || 0), 0);
    const saldo = totalReceitas - totalDespesas;

    // Atualiza badges
    const rEl = document.getElementById('fin-total-receitas');
    const dEl = document.getElementById('fin-total-despesas');
    const sEl = document.getElementById('fin-total-saldo');

    if (rEl) rEl.textContent = App.formatMoney(totalReceitas);
    if (dEl) dEl.textContent = App.formatMoney(totalDespesas);
    if (sEl) {
      sEl.textContent = App.formatMoney(saldo);
      sEl.style.color = saldo >= 0 ? 'var(--success)' : 'var(--danger)';
    }

    // Renderiza tabela de despesas
    const tbody = document.getElementById('despesas-table-body');
    if (tbody) {
      if (despesas.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 24px; color: var(--text-muted);">Nenhuma despesa registrada.</td></tr>`;
      } else {
        tbody.innerHTML = despesas.map(d => `
          <tr>
            <td><strong>${App.escapeHtml(d.descricao)}</strong></td>
            <td><span class="status-badge badge-fila">${d.categoria}</span></td>
            <td>${App.formatDate(d.data)}</td>
            <td style="font-weight: 700; color: var(--danger);">- ${App.formatMoney(d.valor)}</td>
            <td style="text-align: right;">
              <button class="btn btn-secondary btn-icon" onclick="FinanceiroModule.deleteDespesa('${d.id}')" title="Excluir despesa">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </td>
          </tr>
        `).join('');
      }
    }

    this.renderChart(totalReceitas, totalDespesas);
  },

  renderChart(receitas, despesas) {
    const canvas = document.getElementById('financeiro-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    if (chartFinanceiroInstance) {
      chartFinanceiroInstance.destroy();
    }

    chartFinanceiroInstance = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Receitas Recebidas', 'Despesas Operacionais'],
        datasets: [{
          data: [receitas, despesas],
          backgroundColor: ['#00a8f3', '#ef4444'],
          borderColor: '#0f1522',
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 } }
          }
        },
        cutout: '70%'
      }
    });
  },

  openNewDespesaModal() {
    document.getElementById('desp-form-descricao').value = '';
    document.getElementById('desp-form-categoria').value = 'Matéria-prima';
    document.getElementById('desp-form-valor').value = '';
    document.getElementById('desp-form-data').value = new Date().toISOString().split('T')[0];
    document.getElementById('desp-form-forma').value = 'Pix';

    App.openModal('modal-despesa');
  },

  saveDespesa() {
    const descricao = document.getElementById('desp-form-descricao').value.trim();
    const categoria = document.getElementById('desp-form-categoria').value;
    const valor = parseFloat(document.getElementById('desp-form-valor').value) || 0;
    const data = document.getElementById('desp-form-data').value;
    const forma = document.getElementById('desp-form-forma').value;

    if (!descricao || valor <= 0) {
      App.toast('Preencha a descrição e um valor válido.', 'error');
      return;
    }

    StorageService.insert('despesas', {
      descricao,
      categoria,
      valor,
      data,
      forma_pagamento: forma
    });

    App.toast('Despesa registrada no financeiro!', 'success');
    App.closeModal('modal-despesa');
    this.render();
  },

  deleteDespesa(id) {
    if (confirm('Excluir este lançamento de despesa?')) {
      StorageService.delete('despesas', id);
      App.toast('Despesa excluída.', 'info');
      this.render();
    }
  }
};
