// app.js (modo clássico, sem ESM)
// Conecta no Firebase usando a config global (window._FBCFG)
// e inicializa Firestore. Também atualiza o badge Conectado/Desconectado.

(function () {
  const statusEl = document.querySelector('[data-conn]') || document.body;

  function setStatus(ok, msg) {
    const el = document.querySelector('.topbar .right') || statusEl;
    if (!el) return;
    // procura um span “Conectado/Desconectado”
    let s = el.querySelector('.conn-text');
    if (!s) {
      s = document.createElement('span');
      s.className = 'conn-text';
      el.appendChild(s);
    }
    s.textContent = ok ? 'Conectado' : 'Desconectado';
    if (msg) console.log(msg);
  }

  async function boot() {
    try {
      if (!window._FBCFG) {
        setStatus(false, 'Sem _FBCFG no window (firebase-config.js não carregou?)');
        return;
      }

      // carrega os módulos do Firebase (v10) via dynamic import
      const appMod = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
      const fsMod  = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');

      // reusa app se já existir
      const app = appMod.getApps && appMod.getApps().length
        ? appMod.getApp()
        : appMod.initializeApp(window._FBCFG);

      // Firestore
      const db = fsMod.getFirestore(app);
      window.__DB = db; // opcional: deixa disponível p/ debug

      // testa uma leitura boba pra validar conexão/regras
      await fsMod.getCountFromServer(fsMod.collection(db, '_healthcheck_')).catch(() => ({}));
      setStatus(true, 'Firebase OK');

      // ======= AQUI segue o resto do teu app =======
      // ex.: carregar listas, binds de botões, etc.
      // usa sempre fsMod.collection(db, 'minhaColecao') etc.
      // ==============================================

    } catch (e) {
      console.error('Erro ao inicializar Firebase:', e);
      setStatus(false, e.message || 'Erro ao inicializar Firebase');
    }
  }

  // inicia
  boot();
})();
