/**
 * SEVEN PERSONALIZADOS — MÓDULO DE AUTENTICAÇÃO & CONTROLE DE USUÁRIOS
 * Login por e-mail e senha para os 2 proprietários (Raphael e Yanka),
 * alteração de senha sincronizada em nuvem (Supabase) e identificação automática para auditoria.
 */

const AuthModule = {
  SESSION_KEY: 'seven_auth_session_v1',
  USERS_CACHE_KEY: 'seven_usuarios_v1',

  DEFAULT_USERS: [
    {
      id: 'usr-raphael',
      nome: 'Raphael',
      email: 'raphael_nilsen@hotmail.com',
      senha_hash: 'plain:1234',
      ativo: true
    },
    {
      id: 'usr-yanka',
      nome: 'Yanka',
      email: 'yanka.carolinyy@gmail.com',
      senha_hash: 'plain:1234',
      ativo: true
    }
  ],

  /**
   * Hash determinístico simples em JS puro (funciona em HTTPS e HTTP local sem depender de crypto.subtle)
   */
  hashPassword(raw) {
    const str = 'seven_auth_salt_2026::' + String(raw || '');
    let h1 = 0xdeadbeef ^ str.length;
    let h2 = 0x41c6ce57 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    const hex = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
    return 'h7:' + hex;
  },

  verifyPassword(raw, storedHash) {
    if (!storedHash) return false;
    if (storedHash.startsWith('plain:')) {
      return raw === storedHash.slice(6);
    }
    return this.hashPassword(raw) === storedHash;
  },

  getUsersLocal() {
    try {
      const raw = localStorage.getItem(this.USERS_CACHE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.warn('[Auth] Erro ao ler cache de usuários:', e);
    }
    return JSON.parse(JSON.stringify(this.DEFAULT_USERS));
  },

  saveUsersLocal(users) {
    if (Array.isArray(users) && users.length > 0) {
      localStorage.setItem(this.USERS_CACHE_KEY, JSON.stringify(users));
    }
  },

  async syncUsersFromSupabase() {
    if (typeof SUPABASE_CONFIG === 'undefined' || typeof StorageService === 'undefined') {
      return this.getUsersLocal();
    }
    try {
      const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/usuarios_sistema?select=*`, {
        headers: StorageService.getHeaders()
      });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          this.saveUsersLocal(rows);
          return rows;
        }
      }
    } catch (err) {
      console.warn('[Auth] Falha ao sincronizar usuários da nuvem (usando cache local):', err);
    }
    return this.getUsersLocal();
  },

  getCurrentUser() {
    try {
      const raw = localStorage.getItem(this.SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    const user = this.getCurrentUser();
    return !!(user && user.id && user.email);
  },

  init() {
    // Sincroniza usuários em background para manter senhas atualizadas entre dispositivos
    this.syncUsersFromSupabase();

    const user = this.getCurrentUser();
    if (user && user.id) {
      this.applyAuthenticatedState(user);
    } else {
      this.showLoginScreen();
    }
  },

  showLoginScreen() {
    const overlay = document.getElementById('login-screen-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
      document.body.classList.add('auth-locked');
      const errEl = document.getElementById('login-error-msg');
      if (errEl) errEl.style.display = 'none';
      const passInput = document.getElementById('login-senha');
      if (passInput) passInput.value = '';
      setTimeout(() => {
        const emailInput = document.getElementById('login-email');
        if (emailInput && !emailInput.value) emailInput.focus();
      }, 100);
    }
  },

  hideLoginScreen() {
    const overlay = document.getElementById('login-screen-overlay');
    if (overlay) {
      overlay.style.display = 'none';
      document.body.classList.remove('auth-locked');
    }
  },

  applyAuthenticatedState(user) {
    this.hideLoginScreen();

    // Sincroniza proprietário ativo no StorageService com o usuário logado
    if (typeof StorageService !== 'undefined' && StorageService.setActiveProprietario) {
      StorageService.setActiveProprietario(user.nome);
    }

    // Atualiza exibição no menu lateral (sidebar)
    const nameEl = document.getElementById('auth-sidebar-user-name');
    const emailEl = document.getElementById('auth-sidebar-user-email');
    const avatarEl = document.getElementById('auth-sidebar-user-avatar');

    if (nameEl) nameEl.textContent = user.nome;
    if (emailEl) emailEl.textContent = user.email;
    if (avatarEl) avatarEl.textContent = (user.nome || 'U').charAt(0).toUpperCase();

    // Atualiza módulo financeiro se já carregado
    if (typeof FinanceiroModule !== 'undefined' && FinanceiroModule.updateProprietarioSelector) {
      FinanceiroModule.updateProprietarioSelector();
    }
  },

  async handleLoginSubmit(event) {
    if (event) event.preventDefault();

    const emailInput = document.getElementById('login-email');
    const senhaInput = document.getElementById('login-senha');
    const errEl = document.getElementById('login-error-msg');
    const btnEl = document.getElementById('login-submit-btn');

    const email = (emailInput?.value || '').trim().toLowerCase();
    const senha = (senhaInput?.value || '').trim();

    if (!email || !senha) {
      this.showLoginError('Preencha seu e-mail e sua senha para entrar.');
      return;
    }

    if (errEl) errEl.style.display = 'none';
    if (btnEl) {
      btnEl.disabled = true;
      btnEl.textContent = 'Verificando...';
    }

    try {
      // Busca usuários mais recentes do Supabase (garante senha atualizada em todos os aparelhos)
      const users = await this.syncUsersFromSupabase();
      const found = users.find(u => (u.email || '').trim().toLowerCase() === email && u.ativo !== false);

      if (!found || !this.verifyPassword(senha, found.senha_hash)) {
        this.showLoginError('E-mail ou senha incorretos. Verifique e tente novamente.');
        if (senhaInput) {
          senhaInput.value = '';
          senhaInput.focus();
        }
        return;
      }

      // Se ainda estiver com hash 'plain:', promove silenciosamente para hash seguro
      if (found.senha_hash && found.senha_hash.startsWith('plain:')) {
        const newHash = this.hashPassword(senha);
        found.senha_hash = newHash;
        this.saveUsersLocal(users);
        this.persistUserPasswordCloud(found.id, newHash);
      }

      const session = {
        id: found.id,
        nome: found.nome,
        email: found.email,
        login_at: new Date().toISOString()
      };
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));

      this.applyAuthenticatedState(session);

      if (typeof App !== 'undefined' && App.toast) {
        App.toast(`Bem-vindo(a), ${session.nome}! ⚡`, 'success');
      }
      if (typeof FinanceiroModule !== 'undefined' && FinanceiroModule.render) {
        FinanceiroModule.render();
      }
    } finally {
      if (btnEl) {
        btnEl.disabled = false;
        btnEl.textContent = 'Entrar no Sistema';
      }
    }
  },

  showLoginError(msg) {
    const errEl = document.getElementById('login-error-msg');
    if (errEl) {
      errEl.textContent = msg;
      errEl.style.display = 'block';
    }
  },

  async persistUserPasswordCloud(userId, newHash) {
    if (typeof SUPABASE_CONFIG === 'undefined' || typeof StorageService === 'undefined') return false;
    try {
      const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/usuarios_sistema?id=eq.${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        headers: StorageService.getHeaders('return=representation'),
        body: JSON.stringify({
          senha_hash: newHash,
          updated_at: new Date().toISOString()
        })
      });
      return res.ok;
    } catch (err) {
      console.error('[Auth] Erro ao salvar nova senha na nuvem:', err);
      return false;
    }
  },

  openChangePasswordModal() {
    const user = this.getCurrentUser();
    if (!user) {
      this.showLoginScreen();
      return;
    }

    const userInfoEl = document.getElementById('alterar-senha-usuario-info');
    if (userInfoEl) {
      userInfoEl.innerHTML = `Alterando senha de <strong>${App.escapeHtml(user.nome)}</strong> (${App.escapeHtml(user.email)})`;
    }

    const atualEl = document.getElementById('cfg-senha-atual');
    const novaEl = document.getElementById('cfg-senha-nova');
    const confEl = document.getElementById('cfg-senha-confirmar');
    if (atualEl) atualEl.value = '';
    if (novaEl) novaEl.value = '';
    if (confEl) confEl.value = '';

    App.openModal('modal-alterar-senha');
    setTimeout(() => atualEl?.focus(), 100);
  },

  async saveNewPassword() {
    const user = this.getCurrentUser();
    if (!user) return;

    const senhaAtual = (document.getElementById('cfg-senha-atual')?.value || '').trim();
    const novaSenha = (document.getElementById('cfg-senha-nova')?.value || '').trim();
    const confirmarSenha = (document.getElementById('cfg-senha-confirmar')?.value || '').trim();

    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      App.toast('Preencha todos os campos de senha.', 'error');
      return;
    }

    if (novaSenha.length < 4) {
      App.toast('A nova senha deve ter pelo menos 4 caracteres.', 'error');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      App.toast('A confirmação da nova senha não confere.', 'error');
      return;
    }

    const users = await this.syncUsersFromSupabase();
    const record = users.find(u => u.id === user.id);

    if (!record || !this.verifyPassword(senhaAtual, record.senha_hash)) {
      App.toast('A senha atual informada está incorreta.', 'error');
      return;
    }

    const newHash = this.hashPassword(novaSenha);
    record.senha_hash = newHash;
    record.updated_at = new Date().toISOString();
    this.saveUsersLocal(users);

    const savedCloud = await this.persistUserPasswordCloud(user.id, newHash);
    App.closeModal('modal-alterar-senha');

    if (savedCloud) {
      App.toast('Senha alterada e sincronizada na nuvem com sucesso! 🔑', 'success');
    } else {
      App.toast('Senha alterada localmente (será sincronizada quando online). 🔑', 'info');
    }
  },

  logout() {
    if (!confirm('Deseja sair da sua conta agora?')) return;
    localStorage.removeItem(this.SESSION_KEY);
    if (typeof App !== 'undefined' && App.toast) {
      App.toast('Você saiu do sistema.', 'info');
    }
    this.showLoginScreen();
  }
};
