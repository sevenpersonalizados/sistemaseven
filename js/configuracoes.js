/**
 * SEVEN PERSONALIZADOS — CENTRAL DE CONFIGURAÇÕES DO SISTEMA
 * Inspirado no padrão executivo de configurações com abas, edição de grupos,
 * categorias de produção (3D, Gravação laser, Corte laser, Corte e Gravação),
 * dados da empresa, parâmetros 3D e gerenciamento de nuvem Supabase.
 */

const ConfiguracoesModule = {
  activeSubtab: 'todos', // 'todos' | 'categorias' | 'empresa' | 'calc3d' | 'nuvem'

  init() {
    this.render();
    window.addEventListener('seven_data_updated', (e) => {
      const t = e.detail?.table;
      if (!t || t === 'config' || t === 'calc_3d_config') {
        this.render();
      }
    });
  },

  setSubtab(tab) {
    this.activeSubtab = tab;
    this.render();
  },

  render() {
    const container = document.getElementById('configuracoesContainer');
    if (!container) return;

    const cfg = StorageService.getConfig();
    const calcCfg = StorageService.getCalc3DConfig();
    const isOnline = StorageService.isCloudConnected;

    const categoriasProd = StorageService.getCategoriasProducao();
    const categoriasDesp = StorageService.getCategoriasDespesa();
    const formasPagto = StorageService.getFormasPagamento();

    const tab = this.activeSubtab;
    const showCategorias = (tab === 'todos' || tab === 'categorias');
    const showEmpresa = (tab === 'todos' || tab === 'empresa');
    const showCalc3D = (tab === 'todos' || tab === 'calc3d');
    const showNuvem = (tab === 'todos' || tab === 'nuvem');

    container.innerHTML = `
      <!-- HERO BANNER EXECUTIVO DE CONFIGURAÇÕES -->
      <div class="cfg-hero-banner" style="background: linear-gradient(135deg, rgba(0, 168, 243, 0.14) 0%, rgba(168, 85, 247, 0.10) 100%); border: 1px solid rgba(0, 168, 243, 0.3); border-radius: var(--radius-lg); padding: 1.5rem 1.75rem; margin-bottom: 1.35rem; display: flex; justify-content: space-between; align-items: center; gap: 1.5rem; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 280px;">
          <div style="display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap;">
            <h2 style="margin: 0; font-size: 1.45rem; font-weight: 800; color: #ffffff; display: flex; align-items: center; gap: 0.5rem;">
              <span>⚙️</span> Central de Configurações do Sistema
            </h2>
            <span class="status-badge ${isOnline ? 'badge-pago' : 'badge-producao'}" style="font-size: 0.74rem;">
              ${isOnline ? '● Supabase Nuvem Ativo ⚡' : '● Modo Cache Local'}
            </span>
          </div>
          <p style="margin: 0.4rem 0 0 0; font-size: 0.88rem; color: var(--text-secondary); max-width: 760px;">
            Gerencie e personalize todas as informações da <strong>Seven Personalizados</strong>: Categorias de Encomendas & Produtos (3D, Gravação e Corte a Laser), dados cadastrais, chave Pix, parâmetros de impressão e sincronização em tempo real.
          </p>
        </div>

        <div style="display: flex; gap: 0.65rem; flex-wrap: wrap; align-items: center;">
          <button type="button" class="btn btn-primary" onclick="StorageService.syncFromSupabase(); App.toast('Sincronização forçada com o Supabase!', 'info');" style="font-size: 0.84rem; padding: 0.55rem 1.1rem;">
            🔄 Sincronizar Nuvem
          </button>
          <button type="button" class="btn btn-secondary" onclick="ConfiguracoesModule.baixarBackupJSON()" style="font-size: 0.84rem; padding: 0.55rem 1rem;">
            📥 Baixar Backup (.json)
          </button>
        </div>
      </div>

      <!-- NAVEGAÇÃO DE SUB-ABAS -->
      <div class="cfg-subtabs-bar" style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.5rem; padding: 0.45rem; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-md);">
        <button type="button" class="cfg-subtab-btn ${tab === 'todos' ? 'active' : ''}" onclick="ConfiguracoesModule.setSubtab('todos')">
          <span>🎛️</span> Todas as Configurações
        </button>
        <button type="button" class="cfg-subtab-btn ${tab === 'categorias' ? 'active' : ''}" onclick="ConfiguracoesModule.setSubtab('categorias')">
          <span>🏷️</span> Categorias & Opções <span class="cfg-count-pill">${categoriasProd.length}</span>
        </button>
        <button type="button" class="cfg-subtab-btn ${tab === 'empresa' ? 'active' : ''}" onclick="ConfiguracoesModule.setSubtab('empresa')">
          <span>🏢</span> Dados da Empresa & Pix
        </button>
        <button type="button" class="cfg-subtab-btn ${tab === 'calc3d' ? 'active' : ''}" onclick="ConfiguracoesModule.setSubtab('calc3d')">
          <span>⚡</span> Parâmetros Impressão 3D
        </button>
        <button type="button" class="cfg-subtab-btn ${tab === 'nuvem' ? 'active' : ''}" onclick="ConfiguracoesModule.setSubtab('nuvem')">
          <span>☁️</span> Nuvem & Supabase
        </button>
      </div>

      <!-- ====================================================================
           1. SEÇÃO: CATEGORIAS & OPÇÕES EDITÁVEIS
           ==================================================================== -->
      ${showCategorias ? `
      <div class="card" style="margin-bottom: 1.5rem; border-color: rgba(168, 85, 247, 0.4);">
        <div class="card-header" style="flex-wrap: wrap; gap: 0.75rem;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(168, 85, 247, 0.15); color: #c084fc; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
              🏷️
            </div>
            <div>
              <h3 style="margin: 0; font-size: 1.1rem; color: #ffffff;">Categorias do Sistema & Tipos de Produção</h3>
              <div style="font-size: 0.78rem; color: var(--text-muted);">
                Adicione, renomeie ou remova as opções disponíveis nos formulários de Encomendas, Produtos e Financeiro
              </div>
            </div>
          </div>
        </div>

        <div style="padding: 20px;">
          <div class="cfg-groups-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem;">
            
            <!-- GRUPO: CATEGORIAS DE PRODUÇÃO / PRODUTOS -->
            <div class="cfg-group-box" style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                <div>
                  <h4 style="margin: 0; font-size: 1rem; font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 6px;">
                    <span>🧵</span> Categorias de Encomendas & Produtos
                  </h4>
                  <p style="margin: 3px 0 0 0; font-size: 0.76rem; color: var(--text-muted);">
                    Usadas ao criar Encomendas e nos cadastros de Produtos
                  </p>
                </div>
                <span class="cfg-count-pill">${categoriasProd.length}</span>
              </div>

              <!-- Input para adicionar nova opção -->
              <div style="display: flex; gap: 0.45rem; margin: 0.85rem 0;">
                <input type="text" id="cfg_new_cat_prod" class="form-control" style="height: 38px; font-size: 0.84rem;" placeholder="Ex: Resin 3D, Gravação Térmica..." onkeydown="if(event.key==='Enter'){event.preventDefault(); ConfiguracoesModule.adicionarCategoriaProducao();}">
                <button type="button" class="btn btn-primary" style="height: 38px; padding: 0 0.95rem; font-size: 0.82rem; flex-shrink: 0;" onclick="ConfiguracoesModule.adicionarCategoriaProducao()">
                  + Adicionar
                </button>
              </div>

              <!-- Lista de opções -->
              <div class="cfg-tags-list" style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                ${categoriasProd.map((item, idx) => `
                  <div class="cfg-tag-item" style="display: inline-flex; align-items: center; gap: 0.45rem; background: rgba(0, 168, 243, 0.08); border: 1px solid rgba(0, 168, 243, 0.35); border-radius: 8px; padding: 0.4rem 0.75rem; font-size: 0.84rem; color: #ffffff;">
                    <span style="font-weight: 600;">${App.escapeHtml(item)}</span>
                    <div style="display: inline-flex; align-items: center; gap: 4px; margin-left: 4px;">
                      <button type="button" class="btn-icon" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.75rem; padding: 2px;" title="Renomear" onclick="ConfiguracoesModule.editarCategoriaProducao(${idx})">✏️</button>
                      <button type="button" class="btn-icon" style="background: transparent; border: none; color: var(--danger); cursor: pointer; font-size: 0.78rem; padding: 2px;" title="Remover" onclick="ConfiguracoesModule.removerCategoriaProducao(${idx})">✕</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- GRUPO: FORMAS DE PAGAMENTO -->
            <div class="cfg-group-box" style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                <div>
                  <h4 style="margin: 0; font-size: 1rem; font-weight: 700; color: #34d399; display: flex; align-items: center; gap: 6px;">
                    <span>💳</span> Formas de Pagamento Aceitas
                  </h4>
                  <p style="margin: 3px 0 0 0; font-size: 0.76rem; color: var(--text-muted);">
                    Disponíveis nas Encomendas, Orçamentos e Despesas
                  </p>
                </div>
                <span class="cfg-count-pill">${formasPagto.length}</span>
              </div>

              <!-- Input para adicionar nova opção -->
              <div style="display: flex; gap: 0.45rem; margin: 0.85rem 0;">
                <input type="text" id="cfg_new_forma_pagto" class="form-control" style="height: 38px; font-size: 0.84rem;" placeholder="Ex: Link de Pagamento, Cheque..." onkeydown="if(event.key==='Enter'){event.preventDefault(); ConfiguracoesModule.adicionarFormaPagamento();}">
                <button type="button" class="btn btn-primary" style="height: 38px; padding: 0 0.95rem; font-size: 0.82rem; flex-shrink: 0;" onclick="ConfiguracoesModule.adicionarFormaPagamento()">
                  + Adicionar
                </button>
              </div>

              <!-- Lista de opções -->
              <div class="cfg-tags-list" style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                ${formasPagto.map((item, idx) => `
                  <div class="cfg-tag-item" style="display: inline-flex; align-items: center; gap: 0.45rem; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 8px; padding: 0.4rem 0.75rem; font-size: 0.84rem; color: #ffffff;">
                    <span style="font-weight: 600;">${App.escapeHtml(item)}</span>
                    <div style="display: inline-flex; align-items: center; gap: 4px; margin-left: 4px;">
                      <button type="button" class="btn-icon" style="background: transparent; border: none; color: var(--danger); cursor: pointer; font-size: 0.78rem; padding: 2px;" title="Remover" onclick="ConfiguracoesModule.removerFormaPagamento(${idx})">✕</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- GRUPO: CATEGORIAS DE DESPESAS -->
            <div class="cfg-group-box" style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                <div>
                  <h4 style="margin: 0; font-size: 1rem; font-weight: 700; color: #f87171; display: flex; align-items: center; gap: 6px;">
                    <span>💸</span> Categorias de Despesas
                  </h4>
                  <p style="margin: 3px 0 0 0; font-size: 0.76rem; color: var(--text-muted);">
                    Classificação financeira de saídas e custos
                  </p>
                </div>
                <span class="cfg-count-pill">${categoriasDesp.length}</span>
              </div>

              <!-- Input para adicionar nova opção -->
              <div style="display: flex; gap: 0.45rem; margin: 0.85rem 0;">
                <input type="text" id="cfg_new_cat_desp" class="form-control" style="height: 38px; font-size: 0.84rem;" placeholder="Ex: Energia, Ferramentas..." onkeydown="if(event.key==='Enter'){event.preventDefault(); ConfiguracoesModule.adicionarCategoriaDespesa();}">
                <button type="button" class="btn btn-primary" style="height: 38px; padding: 0 0.95rem; font-size: 0.82rem; flex-shrink: 0;" onclick="ConfiguracoesModule.adicionarCategoriaDespesa()">
                  + Adicionar
                </button>
              </div>

              <!-- Lista de opções -->
              <div class="cfg-tags-list" style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                ${categoriasDesp.map((item, idx) => `
                  <div class="cfg-tag-item" style="display: inline-flex; align-items: center; gap: 0.45rem; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: 8px; padding: 0.4rem 0.75rem; font-size: 0.84rem; color: #ffffff;">
                    <span style="font-weight: 600;">${App.escapeHtml(item)}</span>
                    <div style="display: inline-flex; align-items: center; gap: 4px; margin-left: 4px;">
                      <button type="button" class="btn-icon" style="background: transparent; border: none; color: var(--danger); cursor: pointer; font-size: 0.78rem; padding: 2px;" title="Remover" onclick="ConfiguracoesModule.removerCategoriaDespesa(${idx})">✕</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

          </div>
        </div>
      </div>
      ` : ''}

      <!-- ====================================================================
           2. SEÇÃO: DADOS DA EMPRESA & CHAVE PIX
           ==================================================================== -->
      ${showEmpresa ? `
      <div class="card" style="margin-bottom: 1.5rem;">
        <div class="card-header">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(99, 102, 241, 0.15); color: #a5b4fc; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
              🏢
            </div>
            <div>
              <h3 style="margin: 0; font-size: 1.1rem; color: #ffffff;">Identidade da Empresa & Chave Pix</h3>
              <div style="font-size: 0.78rem; color: var(--text-muted);">
                Configurações impressas nos Orçamentos, comprovantes e mensagens aos clientes
              </div>
            </div>
          </div>
        </div>

        <div style="padding: 24px;">
          <form onsubmit="event.preventDefault(); ConfiguracoesModule.salvarEmpresaForm();">
            <div class="form-row">
              <div class="form-group">
                <label>Nome da Empresa *</label>
                <input type="text" id="cfg-emp-nome" class="form-control" value="${App.escapeHtml(cfg.nomeEmpresa || 'Seven Personalizados')}" required>
              </div>
              <div class="form-group">
                <label>Slogan ou Especialidade</label>
                <input type="text" id="cfg-emp-slogan" class="form-control" value="${App.escapeHtml(cfg.slogan || '')}">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Telefone Principal</label>
                <input type="text" id="cfg-emp-telefone" class="form-control" value="${App.escapeHtml(cfg.telefone || '')}">
              </div>
              <div class="form-group">
                <label>WhatsApp (apenas números com DDD)</label>
                <input type="text" id="cfg-emp-whatsapp" class="form-control" value="${App.escapeHtml(cfg.whatsapp || '')}">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>E-mail Comercial</label>
                <input type="email" id="cfg-emp-email" class="form-control" value="${App.escapeHtml(cfg.email || '')}">
              </div>
              <div class="form-group">
                <label>Chave Pix para Cobrança</label>
                <input type="text" id="cfg-emp-pix" class="form-control" value="${App.escapeHtml(cfg.chavePix || '')}">
              </div>
            </div>

            <div class="form-group">
              <label>Endereço / Cidade do Estúdio</label>
              <input type="text" id="cfg-emp-endereco" class="form-control" value="${App.escapeHtml(cfg.endereco || '')}">
            </div>

            <div style="margin-top: 18px;">
              <button type="submit" class="btn btn-primary">
                💾 Salvar Identidade da Empresa
              </button>
            </div>
          </form>
        </div>
      </div>
      ` : ''}

      <!-- ====================================================================
           3. SEÇÃO: PARÂMETROS DA IMPRESSÃO 3D & ENERGIA
           ==================================================================== -->
      ${showCalc3D ? `
      <div class="card" style="margin-bottom: 1.5rem; border-color: rgba(249, 115, 22, 0.4);">
        <div class="card-header" style="flex-wrap: wrap; gap: 0.75rem;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(249, 115, 22, 0.15); color: #fb923c; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
              ⚡
            </div>
            <div>
              <h3 style="margin: 0; font-size: 1.1rem; color: #ffffff;">Parâmetros da Impressora 3D & Energia Elétrica</h3>
              <div style="font-size: 0.78rem; color: var(--text-muted);">
                Utilizados nas fórmulas da Calculadora de Custos 3D (tarifa, consumo em kWh e depreciação)
              </div>
            </div>
          </div>
        </div>

        <div style="padding: 24px;">
          <form onsubmit="event.preventDefault(); ConfiguracoesModule.salvarCalc3DForm();">
            <div class="form-row">
              <div class="form-group">
                <label>Tarifa de Energia Elétrica (R$ / kWh) *</label>
                <input type="number" step="0.01" min="0" id="cfg-calc-tarifa" class="form-control" value="${calcCfg.tarifa_kwh || 0.85}">
                <small style="color: var(--text-muted); font-size: 0.74rem;">Valor cobrado por kWh na fatura de luz</small>
              </div>
              <div class="form-group">
                <label>Consumo Médio da Impressora (Watts) *</label>
                <input type="number" step="1" min="0" id="cfg-calc-potencia" class="form-control" value="${calcCfg.potencia_impressora_w || calcCfg.potencia_watts || 200}">
                <small style="color: var(--text-muted); font-size: 0.74rem;">Potência média da impressora aquecida (150W - 350W)</small>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Custo Operacional por Hora (R$ / hora) *</label>
                <input type="number" step="0.01" min="0" id="cfg-calc-op" class="form-control" value="${calcCfg.custo_operacional_hora || 3.50}">
                <small style="color: var(--text-muted); font-size: 0.74rem;">Provisão para manutenção preventiva, bicos e desgaste</small>
              </div>
              <div class="form-group">
                <label>Margem de Lucro Padrão (%) *</label>
                <input type="number" step="5" min="0" id="cfg-calc-margem" class="form-control" value="${calcCfg.margem_lucro_padrao || 100}">
                <small style="color: var(--text-muted); font-size: 0.74rem;">Margem sugerida na formação de preço de venda</small>
              </div>
            </div>

            <div style="margin-top: 18px;">
              <button type="submit" class="btn btn-primary" style="background: #f97316; border-color: #f97316;">
                💾 Salvar Parâmetros 3D
              </button>
            </div>
          </form>
        </div>
      </div>
      ` : ''}

      <!-- ====================================================================
           4. SEÇÃO: SINCRONIZAÇÃO NUVEM & SUPABASE
           ==================================================================== -->
      ${showNuvem ? `
      <div class="card" style="margin-bottom: 1.5rem; border-color: rgba(16, 185, 129, 0.4);">
        <div class="card-header">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(16, 185, 129, 0.15); color: #34d399; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
              ☁️
            </div>
            <div>
              <h3 style="margin: 0; font-size: 1.1rem; color: #ffffff;">Banco de Dados na Nuvem (Supabase)</h3>
              <div style="font-size: 0.78rem; color: var(--text-muted);">
                Status da infraestrutura PostgreSQL na nuvem sincronizada em tempo real com todos os dispositivos
              </div>
            </div>
          </div>
        </div>

        <div style="padding: 24px;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 20px;">
            <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); border-radius: 8px; padding: 16px;">
              <div style="font-size: 0.74rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Status do Realtime</div>
              <div style="font-size: 1.1rem; font-weight: 700; color: #34d399; margin-top: 4px;">
                🟢 Conexão Ativa
              </div>
              <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 2px;">
                Atualização instantânea bi-direcional
              </div>
            </div>

            <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); border-radius: 8px; padding: 16px;">
              <div style="font-size: 0.74rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Tabelas Ativas</div>
              <div style="font-size: 1.1rem; font-weight: 700; color: #38bdf8; margin-top: 4px;">
                9 Tabelas PostgreSQL
              </div>
              <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 2px;">
                Encomendas, Orçamentos, Estoque, Despesas, Filamentos e Configurações
              </div>
            </div>

            <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); border-radius: 8px; padding: 16px;">
              <div style="font-size: 0.74rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Segurança de Dados</div>
              <div style="font-size: 1.1rem; font-weight: 700; color: #a855f7; margin-top: 4px;">
                🛡️ RLS & Merge Seguro
              </div>
              <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 2px;">
                Proteção contra perda de dados em oscilações móveis
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button type="button" class="btn btn-primary" onclick="StorageService.syncFromSupabase(); App.toast('Sincronização com Supabase concluída!', 'success');">
              🔄 Forçar Sincronização Agora
            </button>
            <button type="button" class="btn btn-secondary" onclick="ConfiguracoesModule.baixarBackupJSON()">
              📥 Baixar Backup Completo (.json)
            </button>
          </div>
        </div>
      </div>
      ` : ''}
    `;
  },

  adicionarCategoriaProducao() {
    const input = document.getElementById('cfg_new_cat_prod');
    const val = input?.value.trim();
    if (!val) {
      App.toast('Digite o nome da nova categoria.', 'warning');
      return;
    }
    StorageService.addCategoriaProducao(val);
    input.value = '';
    App.toast(`Categoria "${val}" adicionada com sucesso!`, 'success');
    this.render();
  },

  editarCategoriaProducao(index) {
    const categorias = StorageService.getCategoriasProducao();
    const atual = categorias[index];
    if (!atual) return;
    const novoNome = prompt('Editar nome da categoria de produção / produto:', atual);
    if (novoNome !== null && novoNome.trim() && novoNome.trim() !== atual) {
      StorageService.editCategoriaProducao(index, novoNome.trim());
      App.toast(`Categoria atualizada para "${novoNome.trim()}"!`, 'success');
      this.render();
    }
  },

  removerCategoriaProducao(index) {
    const categorias = StorageService.getCategoriasProducao();
    const atual = categorias[index];
    if (!atual) return;
    if (confirm(`Deseja remover a categoria "${atual}"?`)) {
      StorageService.removeCategoriaProducao(index);
      App.toast(`Categoria "${atual}" removida.`, 'info');
      this.render();
    }
  },

  adicionarFormaPagamento() {
    const input = document.getElementById('cfg_new_forma_pagto');
    const val = input?.value.trim();
    if (!val) return;
    StorageService.addFormaPagamento(val);
    input.value = '';
    App.toast(`Forma de pagamento "${val}" adicionada!`, 'success');
    this.render();
  },

  removerFormaPagamento(index) {
    StorageService.removeFormaPagamento(index);
    App.toast('Forma de pagamento removida.', 'info');
    this.render();
  },

  adicionarCategoriaDespesa() {
    const input = document.getElementById('cfg_new_cat_desp');
    const val = input?.value.trim();
    if (!val) return;
    StorageService.addCategoriaDespesa(val);
    input.value = '';
    App.toast(`Categoria de despesa "${val}" adicionada!`, 'success');
    this.render();
  },

  removerCategoriaDespesa(index) {
    StorageService.removeCategoriaDespesa(index);
    App.toast('Categoria de despesa removida.', 'info');
    this.render();
  },

  salvarEmpresaForm() {
    const nomeEmpresa = document.getElementById('cfg-emp-nome')?.value.trim();
    const slogan = document.getElementById('cfg-emp-slogan')?.value.trim();
    const telefone = document.getElementById('cfg-emp-telefone')?.value.trim();
    const whatsapp = document.getElementById('cfg-emp-whatsapp')?.value.trim();
    const email = document.getElementById('cfg-emp-email')?.value.trim();
    const chavePix = document.getElementById('cfg-emp-pix')?.value.trim();
    const endereco = document.getElementById('cfg-emp-endereco')?.value.trim();

    if (!nomeEmpresa) {
      App.toast('Informe o nome da empresa.', 'error');
      return;
    }

    const cfgAtual = StorageService.getConfig();
    const novo = {
      ...cfgAtual,
      nomeEmpresa,
      slogan,
      telefone,
      whatsapp,
      email,
      chavePix,
      endereco
    };

    StorageService.saveConfig(novo);
    App.toast('Dados da empresa salvos e sincronizados com a nuvem!', 'success');
    this.render();
  },

  salvarCalc3DForm() {
    const tarifa = parseFloat(document.getElementById('cfg-calc-tarifa')?.value) || 0.85;
    const potencia = parseFloat(document.getElementById('cfg-calc-potencia')?.value) || 200;
    const op = parseFloat(document.getElementById('cfg-calc-op')?.value) || 3.50;
    const margem = parseFloat(document.getElementById('cfg-calc-margem')?.value) || 100;

    const payload = {
      tarifa_kwh: tarifa,
      potencia_watts: potencia,
      potencia_impressora_w: potencia,
      custo_operacional_hora: op,
      margem_lucro_padrao: margem
    };

    StorageService.saveCalc3DConfig(payload);
    App.toast('Parâmetros da impressora 3D e energia atualizados!', 'success');
    this.render();
  },

  baixarBackupJSON() {
    const data = {
      config: StorageService.getConfig(),
      calc_3d_config: StorageService.getCalc3DConfig(),
      encomendas: StorageService.get('encomendas'),
      propostas: StorageService.get('propostas'),
      estoque: StorageService.get('estoque'),
      despesas: StorageService.get('despesas'),
      filamentos: StorageService.get('filamentos'),
      calc_3d_historico: StorageService.get('calc_3d_historico'),
      crm_cards: StorageService.get('crm_cards'),
      backup_em: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-seven-personalizados-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    App.toast('Backup exportado com sucesso!', 'success');
  }
};
