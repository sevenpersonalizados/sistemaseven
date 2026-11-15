/**
 * SEVEN PERSONALIZADOS — NOTIFICATION & PWA MODULE
 * Gerenciador de Service Worker, Notificações Nativas, Alerta Sonoro e Atualização Forçada
 */

const NotificationModule = {
  swRegistration: null,
  audioCtx: null,

  async init() {
    this.setupAudioUnlock();
    await this.registerServiceWorker();
    this.updateNotificationBadge();
  },

  setupAudioUnlock() {
    const unlock = () => {
      this.unlockAudio();
    };
    ['click', 'touchstart', 'touchend', 'pointerdown', 'keydown'].forEach(evt => {
      window.addEventListener(evt, unlock, { passive: true });
    });
  },

  unlockAudio() {
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
    } catch (e) {}
  },

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('./service-worker.js', { scope: './' });
        this.swRegistration = registration;
        console.log('✅ Service Worker PWA registrado com sucesso');

        // Se uma nova versão for encontrada, força ativação e recarrega
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('⚡ Nova versão do sistema encontrada. Atualizando...');
                if (typeof App !== 'undefined' && App.toast) {
                  App.toast('Nova versão do sistema aplicada!', 'success');
                }
                setTimeout(() => window.location.reload(), 800);
              }
            });
          }
        });

        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('🔄 Controlador do Service Worker alterado.');
        });
      } catch (err) {
        console.warn('Falha ao registrar Service Worker:', err);
      }
    }
  },

  isSupported() {
    return ('Notification' in window) || ('serviceWorker' in navigator);
  },

  getPermission() {
    if ('Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  },

  async requestPermission() {
    this.unlockAudio();
    this.playChime();

    if (!('Notification' in window)) {
      if (typeof App !== 'undefined' && App.toast) {
        App.toast('No iPhone, toque no botão Compartilhar (quadrado com seta) e escolha "Adicionar à Tela de Início" para permitir notificações!', 'warning');
      }
      return false;
    }

    try {
      if (Notification.permission === 'granted') {
        if (typeof App !== 'undefined' && App.toast) {
          App.toast('Notificações já estão autorizadas! Disparando teste...', 'info');
        }
        this.show({
          title: 'Seven Personalizados 🔔',
          body: 'Notificações estão ativas e funcionando perfeitamente no seu aparelho!'
        });
        return true;
      }

      const permission = await Notification.requestPermission();
      this.updateNotificationBadge();

      if (permission === 'granted') {
        if (typeof App !== 'undefined' && App.toast) {
          App.toast('Notificações ativadas com sucesso! 🎉', 'success');
        }
        this.show({
          title: 'Seven Personalizados 🎉',
          body: 'Notificações ativas! Você receberá alertas sonoros e avisos de novas encomendas.'
        });
        return true;
      } else if (permission === 'denied') {
        if (typeof App !== 'undefined' && App.toast) {
          App.toast('Permissão de notificação bloqueada. Habilite nas configurações do seu navegador ou aparelho.', 'warning');
        }
        return false;
      }
    } catch (e) {
      console.error('Erro ao pedir permissão de notificação:', e);
    }
    return false;
  },

  testar() {
    this.unlockAudio();
    this.playChime();
    if (this.getPermission() !== 'granted') {
      return this.requestPermission();
    }
    this.show({
      title: '🔔 Teste de Notificação — Seven',
      body: 'Seu dispositivo está configurado e pronto para receber notificações de encomendas e orçamentos!'
    });
    if (typeof App !== 'undefined' && App.toast) {
      App.toast('Notificação e som de teste disparados!', 'success');
    }
  },

  updateNotificationBadge() {
    const btn = document.getElementById('notification-toggle-btn');
    if (!btn) return;

    const perm = this.getPermission();
    if (perm === 'granted') {
      btn.style.color = '#38bdf8';
      btn.style.borderColor = 'rgba(56, 189, 248, 0.4)';
      btn.innerHTML = '<span>🔔</span> <span class="desktop-only">Notificações Ativas</span>';
      btn.title = 'Notificações ativadas! Clique para testar o som e notificação.';
    } else {
      btn.style.color = '#fbbf24';
      btn.style.borderColor = 'rgba(251, 191, 36, 0.4)';
      btn.innerHTML = '<span>🔕</span> <span class="desktop-only">Ativar Notificações</span>';
      btn.title = 'Clique para ativar notificações e receber alertas no celular';
    }
  },

  playChime() {
    try {
      this.unlockAudio();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      // Primeiro tom suave (587.33 Hz - Ré5)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.20, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.23);

      // Segundo tom harmônico (880.00 Hz - Lá5)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, now + 0.12);
      gain2.gain.setValueAtTime(0, now + 0.12);
      gain2.gain.linearRampToValueAtTime(0.25, now + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.46);
    } catch (e) {
      // Audio não permitido ou mudo no navegador
    }
  },

  async show({ title, body, icon = './favicon-192.png', tag = 'seven-alert' }) {
    // 1. Toca som suave
    this.playChime();

    // 2. Se a permissão nativa foi concedida, dispara notificação do sistema / banner do celular
    if (this.getPermission() === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          const reg = this.swRegistration || (await Promise.race([
            navigator.serviceWorker.ready,
            new Promise(resolve => setTimeout(resolve, 1500))
          ]));

          if (reg && reg.showNotification) {
            await reg.showNotification(title, {
              body: body,
              icon: icon,
              badge: './favicon-192.png',
              vibrate: [200, 100, 200],
              tag: tag,
              renotify: true,
              data: { url: './index.html' }
            });
            return;
          }
        }
      } catch (err) {
        console.warn('Tentando fallback de notificação:', err);
      }

      // Fallback via postMessage para o Service Worker
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          action: 'SHOW_NOTIFICATION',
          payload: { title, body, icon, tag }
        });
        return;
      }

      // Fallback via API clássica de Notification
      try {
        if ('Notification' in window) {
          new Notification(title, { body, icon });
        }
      } catch (e) {}
    }
  },

  // Força limpeza total de caches e Service Worker no celular
  async forcarAtualizacaoApp() {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (let reg of regs) {
          await reg.unregister();
        }
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        for (let k of keys) {
          await caches.delete(k);
        }
      }
    } catch (e) {
      console.warn('Erro ao limpar cache:', e);
    }
    // Recarrega forçado sem cache
    window.location.href = window.location.pathname + '?t=' + Date.now();
  }
};
