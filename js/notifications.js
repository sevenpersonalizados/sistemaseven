/**
 * SEVEN PERSONALIZADOS — NOTIFICATION & PWA MODULE
 * Gerenciador de Service Worker, Notificações Nativas e Alerta Sonoro
 */

const NotificationModule = {
  swRegistration: null,
  audioCtx: null,

  async init() {
    this.registerServiceWorker();
    this.updateNotificationBadge();
  },

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register('./service-worker.js', { scope: './' });
        console.log('✅ Service Worker PWA registrado com sucesso');
      } catch (err) {
        console.warn('Falha ao registrar Service Worker:', err);
      }
    }
  },

  isSupported() {
    return 'Notification' in window;
  },

  getPermission() {
    return this.isSupported() ? Notification.permission : 'unsupported';
  },

  async requestPermission() {
    if (!this.isSupported()) {
      App.toast('Notificações não são suportadas neste navegador.', 'warning');
      return false;
    }

    try {
      // Cria áudio context no gesto do clique para liberar no iOS/Safari
      this.playChime();

      const permission = await Notification.requestPermission();
      this.updateNotificationBadge();

      if (permission === 'granted') {
        App.toast('Notificações ativadas com sucesso! 🎉', 'success');
        this.show({
          title: 'Seven Personalizados',
          body: 'Notificações ativas! Você receberá alertas quando houver alterações.'
        });
        return true;
      } else if (permission === 'denied') {
        App.toast('Permissão de notificação negada no navegador.', 'warning');
        return false;
      }
    } catch (e) {
      console.error('Erro ao pedir permissão de notificação:', e);
    }
    return false;
  },

  updateNotificationBadge() {
    const btn = document.getElementById('notification-toggle-btn');
    if (!btn) return;

    const perm = this.getPermission();
    if (perm === 'granted') {
      btn.style.color = '#38bdf8';
      btn.style.borderColor = 'rgba(56, 189, 248, 0.4)';
      btn.innerHTML = '<span>🔔</span> Notificações Ativas';
      btn.title = 'Notificações estão ativadas para este dispositivo';
    } else {
      btn.style.color = '#fbbf24';
      btn.style.borderColor = 'rgba(251, 191, 36, 0.4)';
      btn.innerHTML = '<span>🔕</span> Ativar Notificações';
      btn.title = 'Clique para receber alertas quando houver novas encomendas ou alterações';
    }
  },

  playChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioContext();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      // Primeiro tom suave (587.33 Hz - Ré5)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.18, now + 0.02);
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
      gain2.gain.linearRampToValueAtTime(0.22, now + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.46);
    } catch (e) {
      // Audio não permitido ou mudo no navegador
    }
  },

  show({ title, body, icon = './favicon-192.png', tag = 'seven-alert' }) {
    // 1. Toca som suave
    this.playChime();

    // 2. Se a permissão nativa foi concedida, dispara notificação do sistema
    if (this.getPermission() === 'granted') {
      if (this.swRegistration && this.swRegistration.showNotification) {
        this.swRegistration.showNotification(title, {
          body: body,
          icon: icon,
          badge: './favicon-192.png',
          vibrate: [200, 100, 200],
          tag: tag,
          renotify: true,
          data: { url: './index.html' }
        }).catch(() => {
          try {
            new Notification(title, { body, icon });
          } catch (e) {}
        });
      } else {
        try {
          new Notification(title, { body, icon });
        } catch (e) {}
      }
    }
  }
};
