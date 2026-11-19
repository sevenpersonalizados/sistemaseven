/**
 * SEVEN PERSONALIZADOS — CENTRAL DE CONFIGURAÇÕES DO SISTEMA
 * Inspirado no padrão executivo Raphael Nilsen:
 * Grupos de Tags (Produtos Estabelecidos, Cores, Categorias, Pagamentos, Despesas),
 * Dados da Empresa & Pix, e Parâmetros 3D.
 */

const ConfiguracoesModule = {
  activeSubtab: 'todos', // 'todos' | 'grupos' | 'empresa' | 'calc3d'

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

    const produtosEstabelecidos = StorageService.getProdutosEstabelecidos();
    const coresDisponiveis = StorageService.getCoresDisponiveis();
    const categoriasProd = StorageService.getCategoriasProducao();
    const formasPagto = StorageService.getFormasPagamento();
    const categoriasDesp = StorageService.getCategoriasDespesa();
    const marcasFilamento = StorageService.getMarcasFilamento();
    const padroes = StorageService.getPadroesOrcamentoPedido();

    const tab = this.activeSubtab;
    const showGrupos = (tab === 'todos' || tab === 'grupos');
    const showOrcamentos = (tab === 'todos' || tab === 'orcamentos');
    const showEmpresa = (tab === 'todos' || tab === 'empresa');
    const showCalc3D = (tab === 'todos' || tab === 'calc3d');

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
            Gerencie facilmente todas as listas de seleção do sistema: <strong>Produtos Estabelecidos</strong>, <strong>Cores</strong>, <strong>Categorias de Produção</strong>, <strong>Formas de Pagamento</strong> e dados da Seven Personalizados.
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
        <button type="button" class="cfg-subtab-btn ${tab === 'grupos' ? 'active' : ''}" onclick="ConfiguracoesModule.setSubtab('grupos')">
          <span>📂</span> Produtos, Cores & Opções
        </button>
        <button type="button" class="cfg-subtab-btn ${tab === 'orcamentos' ? 'active' : ''}" onclick="ConfiguracoesModule.setSubtab('orcamentos')">
          <span>📄</span> Orçamentos & Pedidos
        </button>
        <button type="button" class="cfg-subtab-btn ${tab === 'empresa' ? 'active' : ''}" onclick="ConfiguracoesModule.setSubtab('empresa')">
          <span>🏢</span> Empresa & Chave Pix
        </button>
        <button type="button" class="cfg-subtab-btn ${tab === 'calc3d' ? 'active' : ''}" onclick="ConfiguracoesModule.setSubtab('calc3d')">
          <span>⚡</span> Impressora 3D & Energia
        </button>
      </div>

      <!-- ====================================================================
           1. GRUPOS DE OPÇÕES & LISTAS (PADRÃO RAPHAEL NILSEN)
           ==================================================================== -->
      ${showGrupos ? `
      <div class="card" style="margin-bottom: 1.5rem; border-color: rgba(0, 168, 243, 0.35);">
        <div class="card-header" style="flex-wrap: wrap; gap: 0.75rem;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(0, 168, 243, 0.15); color: #38bdf8; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
              📂
            </div>
            <div>
              <h3 style="margin: 0; font-size: 1.1rem; color: #ffffff;">Listas de Seleção & Opções do Sistema</h3>
              <div style="font-size: 0.78rem; color: var(--text-muted);">
                Adicione, renomeie (✏️) ou exclua (✕) as opções disponíveis ao lançar encomendas, produtos e pagamentos
              </div>
            </div>
          </div>
        </div>

        <div style="padding: 20px;">
          <div class="cfg-groups-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem;">
            
            <!-- 1. GRUPO: PRODUTOS ESTABELECIDOS (APENAS NOMES, SEM PREÇOS) -->
            <div class="cfg-group-box" style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem; border-left: 4px solid #38bdf8;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                <div>
                  <h4 style="margin: 0; font-size: 1rem; font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 6px;">
                    <span>📦</span> Produtos Estabelecidos
                  </h4>
                  <p style="margin: 3px 0 0 0; font-size: 0.76rem; color: var(--text-muted);">
                    Sugestões rápidas para selecionar no campo Produto da encomenda
                  </p>
                </div>
                <span class="cfg-count-pill">${produtosEstabelecidos.length}</span>
              </div>

              <!-- Input para adicionar novo produto -->
              <div style="display: flex; gap: 0.45rem; margin: 0.85rem 0;">
                <input type="text" id="cfg_new_prod_est" class="form-control" style="height: 38px; font-size: 0.84rem;" placeholder="Ex: Copo Térmico, Caneca..." onkeydown="if(event.key==='Enter'){event.preventDefault(); ConfiguracoesModule.adicionarProdutoEstabelecido();}">
                <button type="button" class="btn btn-primary" style="height: 38px; padding: 0 0.95rem; font-size: 0.82rem; flex-shrink: 0;" onclick="ConfiguracoesModule.adicionarProdutoEstabelecido()">
                  + Adicionar
                </button>
              </div>

              <!-- Lista de produtos como tags -->
              <div class="cfg-tags-list" style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                ${produtosEstabelecidos.map((prodNome, idx) => `
                  <div class="cfg-tag-item" style="display: inline-flex; align-items: center; gap: 0.45rem; background: rgba(0, 168, 243, 0.08); border: 1px solid rgba(0, 168, 243, 0.35); border-radius: 8px; padding: 0.4rem 0.75rem; font-size: 0.84rem; color: #ffffff;">
                    <span style="font-weight: 600;">${App.escapeHtml(prodNome)}</span>
                    <div style="display: inline-flex; align-items: center; gap: 4px; margin-left: 4px;">
                      <button type="button" class="btn-icon" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.75rem; padding: 2px;" title="Renomear" onclick="ConfiguracoesModule.editarProdutoEstabelecido(${idx})">✏️</button>
                      <button type="button" class="btn-icon" style="background: transparent; border: none; color: var(--danger); cursor: pointer; font-size: 0.78rem; padding: 2px;" title="Remover" onclick="ConfiguracoesModule.removerProdutoEstabelecido(${idx})">✕</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- 2. GRUPO: CORES DISPONÍVEIS -->
            <div class="cfg-group-box" style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem; border-left: 4px solid #00a8f3;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                <div>
                  <h4 style="margin: 0; font-size: 1rem; font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 6px;">
                    <span>🎨</span> Cores de Personalização
                  </h4>
                  <p style="margin: 3px 0 0 0; font-size: 0.76rem; color: var(--text-muted);">
                    Cores disponíveis no seletor de Cor ao adicionar itens
                  </p>
                </div>
                <span class="cfg-count-pill">${coresDisponiveis.length}</span>
              </div>

              <!-- Input para adicionar nova cor -->
              <div style="display: flex; gap: 0.45rem; margin: 0.85rem 0;">
                <input type="text" id="cfg_new_cor" class="form-control" style="height: 38px; font-size: 0.84rem;" placeholder="Ex: Preto, Dourado, Prata..." onkeydown="if(event.key==='Enter'){event.preventDefault(); ConfiguracoesModule.adicionarCor();}">
                <button type="button" class="btn btn-primary" style="height: 38px; padding: 0 0.95rem; font-size: 0.82rem; flex-shrink: 0;" onclick="ConfiguracoesModule.adicionarCor()">
                  + Adicionar
                </button>
              </div>

              <!-- Lista de cores -->
              <div class="cfg-tags-list" style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                ${coresDisponiveis.map((cor, idx) => `
                  <div class="cfg-tag-item" style="display: inline-flex; align-items: center; gap: 0.45rem; background: rgba(0, 168, 243, 0.08); border: 1px solid rgba(0, 168, 243, 0.35); border-radius: 8px; padding: 0.4rem 0.75rem; font-size: 0.84rem; color: #ffffff;">
                    <span style="font-weight: 600;">${App.escapeHtml(cor)}</span>
                    <div style="display: inline-flex; align-items: center; gap: 4px; margin-left: 4px;">
                      <button type="button" class="btn-icon" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.75rem; padding: 2px;" title="Renomear" onclick="ConfiguracoesModule.editarCor(${idx})">✏️</button>
                      <button type="button" class="btn-icon" style="background: transparent; border: none; color: var(--danger); cursor: pointer; font-size: 0.78rem; padding: 2px;" title="Remover" onclick="ConfiguracoesModule.removerCor(${idx})">✕</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- 3. GRUPO: CATEGORIAS DE PRODUÇÃO -->
            <div class="cfg-group-box" style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem; border-left: 4px solid #a855f7;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                <div>
                  <h4 style="margin: 0; font-size: 1rem; font-weight: 700; color: #c084fc; display: flex; align-items: center; gap: 6px;">
                    <span>🧵</span> Categorias de Produção & Produtos
                  </h4>
                  <p style="margin: 3px 0 0 0; font-size: 0.76rem; color: var(--text-muted);">
                    Classificação técnica (3D, Gravação laser, Corte laser, etc.)
                  </p>
                </div>
                <span class="cfg-count-pill">${categoriasProd.length}</span>
              </div>

              <!-- Input para adicionar nova opção -->
              <div style="display: flex; gap: 0.45rem; margin: 0.85rem 0;">
                <input type="text" id="cfg_new_cat_prod" class="form-control" style="height: 38px; font-size: 0.84rem;" placeholder="Ex: Sublimação, CNC Router..." onkeydown="if(event.key==='Enter'){event.preventDefault(); ConfiguracoesModule.adicionarCategoriaProducao();}">
                <button type="button" class="btn btn-primary" style="height: 38px; padding: 0 0.95rem; font-size: 0.82rem; flex-shrink: 0;" onclick="ConfiguracoesModule.adicionarCategoriaProducao()">
                  + Adicionar
                </button>
              </div>

              <!-- Lista de opções -->
              <div class="cfg-tags-list" style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                ${categoriasProd.map((item, idx) => `
                  <div class="cfg-tag-item" style="display: inline-flex; align-items: center; gap: 0.45rem; background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.35); border-radius: 8px; padding: 0.4rem 0.75rem; font-size: 0.84rem; color: #ffffff;">
                    <span style="font-weight: 600;">${App.escapeHtml(item)}</span>
                    <div style="display: inline-flex; align-items: center; gap: 4px; margin-left: 4px;">
                      <button type="button" class="btn-icon" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.75rem; padding: 2px;" title="Renomear" onclick="ConfiguracoesModule.editarCategoriaProducao(${idx})">✏️</button>
                      <button type="button" class="btn-icon" style="background: transparent; border: none; color: var(--danger); cursor: pointer; font-size: 0.78rem; padding: 2px;" title="Remover" onclick="ConfiguracoesModule.removerCategoriaProducao(${idx})">✕</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- 4. GRUPO: FORMAS DE PAGAMENTO -->
            <div class="cfg-group-box" style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem; border-left: 4px solid #10b981;">
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
                <input type="text" id="cfg_new_forma_pagto" class="form-control" style="height: 38px; font-size: 0.84rem;" placeholder="Ex: Boleto, Link Pix..." onkeydown="if(event.key==='Enter'){event.preventDefault(); ConfiguracoesModule.adicionarFormaPagamento();}">
                <button type="button" class="btn btn-primary" style="height: 38px; padding: 0 0.95rem; font-size: 0.82rem; flex-shrink: 0;" onclick="ConfiguracoesModule.adicionarFormaPagamento()">
                  + Adicionar
                </button>
              </div>

              <!-- Lista de opções -->
              <div class="cfg-tags-list" style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                ${formasPagto.map((item, idx) => `
                  <div class="cfg-tag-item" style="display: inline-flex; align-items: center; gap: 0.45rem; background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 8px; padding: 0.4rem 0.75rem; font-size: 0.84rem; color: #ffffff;">
                    <span style="font-weight: 600;">${App.escapeHtml(item)}</span>
                    <div style="display: inline-flex; align-items: center; gap: 4px; margin-left: 4px;">
                      <button type="button" class="btn-icon" style="background: transparent; border: none; color: var(--danger); cursor: pointer; font-size: 0.78rem; padding: 2px;" title="Remover" onclick="ConfiguracoesModule.removerFormaPagamento(${idx})">✕</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- 5. GRUPO: CATEGORIAS DE DESPESAS -->
            <div class="cfg-group-box" style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem; border-left: 4px solid #ef4444;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                <div>
                  <h4 style="margin: 0; font-size: 1rem; font-weight: 700; color: #f87171; display: flex; align-items: center; gap: 6px;">
                    <span>💸</span> Categorias de Despesas
                  </h4>
                  <p style="margin: 3px 0 0 0; font-size: 0.76rem; color: var(--text-muted);">
                    Classificação financeira de custos operacionais
                  </p>
                </div>
                <span class="cfg-count-pill">${categoriasDesp.length}</span>
              </div>

              <!-- Input para adicionar nova opção -->
              <div style="display: flex; gap: 0.45rem; margin: 0.85rem 0;">
                <input type="text" id="cfg_new_cat_desp" class="form-control" style="height: 38px; font-size: 0.84rem;" placeholder="Ex: Energia, Embalagem..." onkeydown="if(event.key==='Enter'){event.preventDefault(); ConfiguracoesModule.adicionarCategoriaDespesa();}">
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

            <!-- 6. GRUPO: MARCAS DE FILAMENTO 3D -->
            <div class="cfg-group-box" style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 1.25rem; border-left: 4px solid #fb923c;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                <div>
                  <h4 style="margin: 0; font-size: 1rem; font-weight: 700; color: #fb923c; display: flex; align-items: center; gap: 6px;">
                    <span>🧵</span> Marcas de Filamento 3D
                  </h4>
                  <p style="margin: 3px 0 0 0; font-size: 0.76rem; color: var(--text-muted);">
                    Marcas e fabricantes pré-selecionados na gestão de filamentos e cálculo 3D
                  </p>
                </div>
                <span class="cfg-count-pill">${marcasFilamento.length}</span>
              </div>

              <!-- Input para adicionar nova marca -->
              <div style="display: flex; gap: 0.45rem; margin: 0.85rem 0;">
                <input type="text" id="cfg_new_marca_filamento" class="form-control" style="height: 38px; font-size: 0.84rem;" placeholder="Ex: Voolt3D, Creality, Bambu Lab..." onkeydown="if(event.key==='Enter'){event.preventDefault(); ConfiguracoesModule.adicionarMarcaFilamento();}">
                <button type="button" class="btn btn-primary" style="height: 38px; padding: 0 0.95rem; font-size: 0.82rem; flex-shrink: 0;" onclick="ConfiguracoesModule.adicionarMarcaFilamento()">
                  + Adicionar
                </button>
              </div>

              <!-- Lista de marcas -->
              <div class="cfg-tags-list" style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                ${marcasFilamento.map((item, idx) => `
                  <div class="cfg-tag-item" style="display: inline-flex; align-items: center; gap: 0.45rem; background: rgba(251, 146, 60, 0.08); border: 1px solid rgba(251, 146, 60, 0.35); border-radius: 8px; padding: 0.4rem 0.75rem; font-size: 0.84rem; color: #ffffff;">
                    <span style="font-weight: 600;">${App.escapeHtml(item)}</span>
                    <div style="display: inline-flex; align-items: center; gap: 4px; margin-left: 4px;">
                      <button type="button" class="btn-icon" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.75rem; padding: 2px;" title="Renomear" onclick="ConfiguracoesModule.editarMarcaFilamento(${idx})">✏️</button>
                      <button type="button" class="btn-icon" style="background: transparent; border: none; color: var(--danger); cursor: pointer; font-size: 0.78rem; padding: 2px;" title="Remover" onclick="ConfiguracoesModule.removerMarcaFilamento(${idx})">✕</button>
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
           1B. SEÇÃO: PADRÕES DE ORÇAMENTOS & PEDIDOS
           ==================================================================== -->
      ${showOrcamentos ? `
      <div class="card" style="margin-bottom: 1.5rem; border-color: rgba(168, 85, 247, 0.35);">
        <div class="card-header">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(168, 85, 247, 0.16); color: #c084fc; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
              📄
            </div>
            <div>
              <h3 style="margin: 0; font-size: 1.1rem; color: #ffffff;">Textos & Padrões de Orçamentos e Pedidos</h3>
              <div style="font-size: 0.78rem; color: var(--text-muted);">
                Personalize os textos e valores que já vêm preenchidos automaticamente ao criar um Novo Orçamento ou Nova Encomenda
              </div>
            </div>
          </div>
        </div>

        <div style="padding: 24px;">
          <form onsubmit="event.preventDefault(); ConfiguracoesModule.salvarPadroesOrcamentoPedidoForm();">
            <!-- BLOCO ORÇAMENTOS -->
            <div style="font-size: 0.84rem; font-weight: 700; color: #c084fc; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
              <span>📄</span> Padrões de Novo Orçamento
            </div>

            <div class="form-group">
              <label>Título Padrão do Orçamento</label>
              <input type="text" id="cfg-pad-orc-titulo" class="form-control" value="${App.escapeHtml(padroes.orcamento_titulo || '')}" placeholder="Ex: Orçamento de Produtos Personalizados Exclusivos">
            </div>

            <div class="form-group">
              <label>1. Escopo e Solução dos Produtos</label>
              <textarea id="cfg-pad-orc-escopo" class="form-control" rows="2" placeholder="Descrição padrão do escopo dos produtos...">${App.escapeHtml(padroes.orcamento_escopo || '')}</textarea>
            </div>

            <div class="form-group">
              <label>2. Método & Diferenciais de Fabricação</label>
              <textarea id="cfg-pad-orc-metodo" class="form-control" rows="4" placeholder="Etapas e diferenciais de fabricação...">${App.escapeHtml(padroes.orcamento_metodo || '')}</textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Prazo Estimado de Produção</label>
                <input type="text" id="cfg-pad-orc-prazo" class="form-control" value="${App.escapeHtml(padroes.orcamento_prazo || '')}" placeholder="Ex: 5 a 7 dias úteis após aprovação da arte final">
              </div>
              <div class="form-group">
                <label>Condições de Pagamento</label>
                <input type="text" id="cfg-pad-orc-condicoes" class="form-control" value="${App.escapeHtml(padroes.orcamento_condicoes || '')}" placeholder="Ex: 50% de sinal no pedido e 50% na conclusão via Pix.">
              </div>
            </div>

            <!-- BLOCO PEDIDOS / ENCOMENDAS -->
            <div style="margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--border); font-size: 0.84rem; font-weight: 700; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
              <span>📦</span> Padrões de Novo Pedido / Encomenda
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Prazo Padrão de Entrega (em dias a partir do pedido)</label>
                <input type="number" min="0" max="365" id="cfg-pad-ped-dias" class="form-control" value="${padroes.pedido_dias_entrega !== undefined ? padroes.pedido_dias_entrega : 5}">
              </div>
              <div class="form-group">
                <label>Forma de Pagamento Padrão</label>
                <select id="cfg-pad-ped-forma" class="form-control">
                  ${formasPagto.map(f => `<option value="${App.escapeHtml(f)}" ${f === (padroes.pedido_forma_pagto || 'Pix') ? 'selected' : ''}>${App.escapeHtml(f)}</option>`).join('')}
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Observações Padrão do Pedido (opcional)</label>
              <textarea id="cfg-pad-ped-obs" class="form-control" rows="2" placeholder="Texto opcional que já aparece preenchido em Observações da Nova Encomenda...">${App.escapeHtml(padroes.pedido_obs || '')}</textarea>
            </div>

            <div style="margin-top: 20px;">
              <button type="submit" class="btn btn-primary">
                💾 Salvar Padrões de Orçamentos & Pedidos
              </button>
            </div>
          </form>
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

            <div style="margin-top: 20px;">
              <button type="submit" class="btn btn-primary">
                💾 Salvar Dados da Empresa
              </button>
            </div>
          </form>
        </div>
      </div>
      ` : ''}

      <!-- ====================================================================
           3. SEÇÃO: PARÂMETROS DA IMPRESSORA 3D & ENERGIA
           ==================================================================== -->
      ${showCalc3D ? `
      <div class="card" style="margin-bottom: 1.5rem;">
        <div class="card-header">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(245, 158, 11, 0.15); color: #fbbf24; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
              ⚡
            </div>
            <div>
              <h3 style="margin: 0; font-size: 1.1rem; color: #ffffff;">Parâmetros Técnicos de Impressão 3D</h3>
              <div style="font-size: 0.78rem; color: var(--text-muted);">
                Taxa de energia (R$/kWh) e depreciação/hora da impressora 3D
              </div>
            </div>
          </div>
        </div>

        <div style="padding: 24px;">
          <form onsubmit="event.preventDefault(); ConfiguracoesModule.salvarCalc3DForm();">
            <div class="form-row">
              <div class="form-group">
                <label>Tarifa de Energia Elétrica (R$/kWh) *</label>
                <input type="number" step="0.01" id="cfg-calc-tarifa" class="form-control" value="${calcCfg.tarifa_kwh || 0.85}" required>
              </div>
              <div class="form-group">
                <label>Potência Média da Impressora (Watts) *</label>
                <input type="number" id="cfg-calc-potencia" class="form-control" value="${calcCfg.potencia_watts || calcCfg.potencia_impressora_w || 200}" required>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Custo Operacional por Hora (R$/h) *</label>
                <input type="number" step="0.1" id="cfg-calc-op" class="form-control" value="${calcCfg.custo_operacional_hora || 3.50}" required>
              </div>
              <div class="form-group">
                <label>Margem de Lucro Padrão (%) *</label>
                <input type="number" id="cfg-calc-margem" class="form-control" value="${calcCfg.margem_lucro_padrao || 100}" required>
              </div>
            </div>

            <div style="margin-top: 20px;">
              <button type="submit" class="btn btn-primary">
                💾 Salvar Parâmetros 3D
              </button>
            </div>
          </form>
        </div>
      </div>
      ` : ''}
    `;
  },

  /* --- GESTÃO DE PRODUTOS ESTABELECIDOS (APENAS NOMES, SEM OPÇÃO DE PREÇOS) --- */
  adicionarProdutoEstabelecido() {
    const input = document.getElementById('cfg_new_prod_est');
    const val = input?.value.trim();
    if (!val) return;
    StorageService.addProdutoEstabelecido(val);
    input.value = '';
    App.toast(`Produto "${val}" adicionado à lista!`, 'success');
    this.render();
  },

  editarProdutoEstabelecido(index) {
    const prods = StorageService.getProdutosEstabelecidos();
    const atual = prods[index];
    if (!atual) return;
    const novo = prompt('Renomear produto estabelecido:', atual);
    if (novo && novo.trim() && novo.trim() !== atual) {
      StorageService.editProdutoEstabelecido(index, novo.trim());
      App.toast(`Produto renomeado para "${novo.trim()}"!`, 'success');
      this.render();
    }
  },

  removerProdutoEstabelecido(index) {
    const prods = StorageService.getProdutosEstabelecidos();
    const nome = prods[index];
    if (confirm(`Remover "${nome}" da lista de produtos estabelecidos?`)) {
      StorageService.removeProdutoEstabelecido(index);
      App.toast('Produto removido.', 'info');
      this.render();
    }
  },

  /* --- GESTÃO DE CORES --- */
  adicionarCor() {
    const input = document.getElementById('cfg_new_cor');
    const val = input?.value.trim();
    if (!val) return;
    StorageService.addCor(val);
    input.value = '';
    App.toast(`Cor "${val}" adicionada!`, 'success');
    this.render();
  },

  editarCor(index) {
    const cores = StorageService.getCoresDisponiveis();
    const atual = cores[index];
    if (!atual) return;
    const novo = prompt('Renomear cor:', atual);
    if (novo && novo.trim() && novo.trim() !== atual) {
      StorageService.editCor(index, novo.trim());
      App.toast(`Cor renomeada para "${novo.trim()}"!`, 'success');
      this.render();
    }
  },

  removerCor(index) {
    const cores = StorageService.getCoresDisponiveis();
    const nome = cores[index];
    if (confirm(`Remover a cor "${nome}" das configurações?`)) {
      StorageService.removeCor(index);
      App.toast('Cor removida.', 'info');
      this.render();
    }
  },

  /* --- GESTÃO DE CATEGORIAS DE PRODUÇÃO --- */
  adicionarCategoriaProducao() {
    const input = document.getElementById('cfg_new_cat_prod');
    const val = input?.value.trim();
    if (!val) return;
    StorageService.addCategoriaProducao(val);
    input.value = '';
    App.toast(`Categoria "${val}" adicionada!`, 'success');
    this.render();
  },

  editarCategoriaProducao(index) {
    const cats = StorageService.getCategoriasProducao();
    const atual = cats[index];
    if (!atual) return;
    const novo = prompt(`Renomear categoria:`, atual);
    if (novo && novo.trim() && novo.trim() !== atual) {
      StorageService.editCategoriaProducao(index, novo.trim());
      App.toast(`Categoria renomeada para "${novo.trim()}"!`, 'success');
      this.render();
    }
  },

  removerCategoriaProducao(index) {
    const cats = StorageService.getCategoriasProducao();
    const nome = cats[index];
    if (confirm(`Remover a categoria "${nome}"?`)) {
      StorageService.removeCategoriaProducao(index);
      App.toast(`Categoria "${nome}" removida.`, 'info');
      this.render();
    }
  },

  /* --- GESTÃO DE FORMAS DE PAGAMENTO --- */
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

  /* --- GESTÃO DE CATEGORIAS DE DESPESA --- */
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

  /* --- GESTÃO DE MARCAS DE FILAMENTO --- */
  adicionarMarcaFilamento() {
    const input = document.getElementById('cfg_new_marca_filamento');
    const valor = input ? input.value.trim() : '';
    if (!valor) return;
    StorageService.addMarcaFilamento(valor);
    input.value = '';
    App.toast(`Marca "${valor}" adicionada às opções!`, 'success');
    this.render();
    if (typeof CalculadoraModule !== 'undefined' && CalculadoraModule.popularOpcoesFormFilamento) {
      CalculadoraModule.popularOpcoesFormFilamento();
    }
  },

  editarMarcaFilamento(index) {
    const marcas = StorageService.getMarcasFilamento();
    const atual = marcas[index];
    const novoNome = prompt('Editar nome da marca de filamento:', atual);
    if (novoNome && novoNome.trim() && novoNome.trim() !== atual) {
      StorageService.editMarcaFilamento(index, novoNome.trim());
      App.toast('Marca atualizada!', 'info');
      this.render();
      if (typeof CalculadoraModule !== 'undefined' && CalculadoraModule.popularOpcoesFormFilamento) {
        CalculadoraModule.popularOpcoesFormFilamento();
      }
    }
  },

  removerMarcaFilamento(index) {
    const marcas = StorageService.getMarcasFilamento();
    const nome = marcas[index];
    if (confirm(`Remover "${nome}" da lista de marcas de filamento?`)) {
      StorageService.removeMarcaFilamento(index);
      App.toast('Marca removida.', 'info');
      this.render();
      if (typeof CalculadoraModule !== 'undefined' && CalculadoraModule.popularOpcoesFormFilamento) {
        CalculadoraModule.popularOpcoesFormFilamento();
      }
    }
  },

  salvarPadroesOrcamentoPedidoForm() {
    const orcamento_titulo = document.getElementById('cfg-pad-orc-titulo')?.value.trim() || '';
    const orcamento_escopo = document.getElementById('cfg-pad-orc-escopo')?.value.trim() || '';
    const orcamento_metodo = document.getElementById('cfg-pad-orc-metodo')?.value.trim() || '';
    const orcamento_prazo = document.getElementById('cfg-pad-orc-prazo')?.value.trim() || '';
    const orcamento_condicoes = document.getElementById('cfg-pad-orc-condicoes')?.value.trim() || '';

    const diasRaw = parseInt(document.getElementById('cfg-pad-ped-dias')?.value, 10);
    const pedido_dias_entrega = Number.isFinite(diasRaw) && diasRaw >= 0 ? diasRaw : 5;
    const pedido_forma_pagto = document.getElementById('cfg-pad-ped-forma')?.value || 'Pix';
    const pedido_obs = document.getElementById('cfg-pad-ped-obs')?.value.trim() || '';

    StorageService.savePadroesOrcamentoPedido({
      orcamento_titulo,
      orcamento_escopo,
      orcamento_metodo,
      orcamento_prazo,
      orcamento_condicoes,
      pedido_dias_entrega,
      pedido_forma_pagto,
      pedido_obs
    });

    App.toast('Padrões de Orçamentos e Pedidos salvos e sincronizados com a nuvem!', 'success');
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
