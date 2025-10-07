(() => {
  'use strict';

  // ---------- Utils compartidos ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const VARIANTS = {
    info: { icon: 'M12 9v4m0 4h.01', ring: '#4F6DD8' },
    warning: { icon: 'M12 9v4m0 4h.01', ring: '#FFB703' },
    danger: { icon: 'M12 8v4m0 4h.01', ring: '#eb6161' },
  };
  function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; }

  // ---------- Modal de confirmación reutilizable ----------
  let $overlay;
  function ensureDOM() {
    if ($overlay) return $overlay;
    $overlay = el(`
      <div class="modal-overlay" data-confirm-overlay style="display:none">
        <div class="modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="cfmTitle" aria-describedby="cfmMsg">
          <header class="confirm-header">
            <div class="confirm-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"></svg></div>
            <h2 id="cfmTitle">Confirmar</h2>
          </header>
          <div id="cfmMsg" class="confirm-msg"></div>
          <div class="actions confirm-actions">
            <button class="secondary btn-cancel" type="button">Cancelar</button>
            <button class="primary btn-accept"  type="button">Aceptar</button>
          </div>
        </div>
      </div>
    `);
    document.body.appendChild($overlay);
    return $overlay;
  }

  function trapFocus(scope) {
    const focusables = scope.querySelectorAll('button,a,[tabindex]:not([tabindex="-1"]),input,select,textarea');
    if (!focusables.length) return () => { };
    const first = focusables[0], last = focusables[focusables.length - 1];
    function onKey(e) {
      if (e.key === 'Escape') { scope.dispatchEvent(new CustomEvent('cfm:cancel')); }
      if (e.key === 'Enter') { scope.dispatchEvent(new CustomEvent('cfm:accept')); }
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    scope.addEventListener('keydown', onKey);
    return () => scope.removeEventListener('keydown', onKey);
  }

  async function open(opts = {}) {
    const {
      title = '¿Confirmar?',
      message = '¿Deseas continuar?',
      confirmText = 'Sí, continuar',
      cancelText = 'Cancelar',
      variant = 'warning' // 'info' | 'warning' | 'danger'
    } = opts;

    ensureDOM();
    const overlay = $overlay;
    const modal = overlay.querySelector('.confirm-modal');
    const btnOk = overlay.querySelector('.btn-accept');
    const btnNo = overlay.querySelector('.btn-cancel');
    const iconBox = overlay.querySelector('.confirm-icon svg');

    // Texto
    overlay.querySelector('#cfmTitle').textContent = title;
    overlay.querySelector('#cfmMsg').innerHTML = typeof message === 'string' ? message : '';
    btnOk.textContent = confirmText;
    btnNo.textContent = cancelText;

    // Variante
    modal.classList.remove('v-info', 'v-warning', 'v-danger');
    modal.classList.add(`v-${variant}`);
    const { icon, ring } = VARIANTS[variant] || VARIANTS.info;
    iconBox.innerHTML = `<circle cx="12" cy="12" r="10"></circle><path d="${icon}"></path>`;
    iconBox.querySelector('circle').setAttribute('stroke', ring);
    iconBox.querySelector('path').setAttribute('stroke', ring);

    // Botón "peligro"
    btnOk.classList.remove('btn-danger');
    if (variant === 'danger') btnOk.classList.add('btn-danger');

    // Mostrar
    overlay.style.display = 'flex';
    const untrap = trapFocus(modal);
    btnOk.focus();

    const result = await new Promise(resolve => {
      const accept = () => { cleanup(); resolve(true); };
      const cancel = () => { cleanup(); resolve(false); };
      const cleanup = () => {
        overlay.style.display = 'none';
        overlay.removeEventListener('click', onBackdrop);
        modal.removeEventListener('cfm:accept', accept);
        modal.removeEventListener('cfm:cancel', cancel);
        btnOk.removeEventListener('click', accept);
        btnNo.removeEventListener('click', cancel);
        untrap();
      };
      const onBackdrop = (e) => { if (e.target === overlay) cancel(); };

      overlay.addEventListener('click', onBackdrop);
      modal.addEventListener('cfm:accept', accept);
      modal.addEventListener('cfm:cancel', cancel);
      btnOk.addEventListener('click', accept);
      btnNo.addEventListener('click', cancel);
    });

    return result;
  }

  // API pública confirm
  window.Confirm = { open };
  window.askConfirm = (text, extra = {}) => open({ message: text, ...extra });

  const escapeHTML = (s = '') =>
    String(s)
      .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
      .replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const money = n => 'S/ ' + Number(n || 0).toFixed(2);

  // === Login con bloqueo temporal (423 Locked) ===
  function initLoginPage() {
    const form = document.getElementById('formLogin');
    if (!form) return;

    const btn = form.querySelector('button[type="submit"]');
    const email = document.getElementById('loginCorreo');
    const pass = document.getElementById('loginPassword');
    const MSGID = 'loginMsg';

    const lockKey = (c) => `loginLockUntil:${(c || '').toLowerCase()}`;
    let timer = null;

    const show = (msg, type = 'error') =>
      (window.showMsg ? showMsg(MSGID, type, msg) : alert(msg));

    const fmt = ms => {
      const s = Math.max(0, Math.ceil(ms / 1000));
      const m = String(Math.floor(s / 60)).padStart(2, '0');
      const r = String(s % 60).padStart(2, '0');
      return `${m}:${r}`;
    };
    const setDisabled = v => { if (btn) btn.disabled = v; if (pass) pass.disabled = v; };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };

    function startCountdown(correo, untilTs) {
      stop();
      localStorage.setItem(lockKey(correo), String(untilTs));
      setDisabled(true);
      const tick = () => {
        const left = untilTs - Date.now();
        if (left <= 0) {
          stop(); localStorage.removeItem(lockKey(correo));
          setDisabled(false); show('Bloqueo finalizado, vuelve a intentar.', 'success');
        } else {
          show(`Cuenta bloqueada por múltiples intentos. Espera ${fmt(left)}.`, 'error');
        }
      };
      tick(); timer = setInterval(tick, 1000);
    }

    function checkExistingLock() {
      const correo = (email?.value || '').trim().toLowerCase();
      if (!correo) return;
      const saved = Number(localStorage.getItem(lockKey(correo)) || 0);
      if (saved && saved > Date.now()) startCountdown(correo, saved);
      else { localStorage.removeItem(lockKey(correo)); setDisabled(false); }
    }

    async function onSubmit(e) {
      e.preventDefault();
      const correo = (email.value || '').trim().toLowerCase();
      const password = pass.value || '';

      const saved = Number(localStorage.getItem(lockKey(correo)) || 0);
      if (saved && saved > Date.now()) return startCountdown(correo, saved);

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ correo, password })
        });

        if (res.status === 423) {
          let data = {}; try { data = await res.json(); } catch { }
          const retry = res.headers.get('Retry-After');
          const untilTs = retry && !isNaN(retry)
            ? Date.now() + Number(retry) * 1000
            : (data.lockUntil ? new Date(data.lockUntil).getTime() : Date.now() + 10 * 60 * 1000);
          return startCountdown(correo, untilTs);
        }

        if (res.status === 401) return show('Credenciales inválidas', 'error');
        if (!res.ok) return show((await res.text()) || `HTTP ${res.status}`, 'error');

        const r = await res.json();
        Auth?.saveToken?.(r.token, r.user);
        stop(); localStorage.removeItem(lockKey(correo));
        show('Inicio de sesión correcto', 'success');
        setTimeout(() => location.href = '/dashboard.html', 400);
      } catch (err) {
        show(err?.message || 'Error de red', 'error');
      }
    }

    if (Auth.isLoggedIn?.()) return (location.href = '/dashboard.html');

    form.addEventListener('submit', onSubmit);
    email?.addEventListener('input', checkExistingLock);
    checkExistingLock();
  }

  // Arranque global
  document.addEventListener('DOMContentLoaded', () => {
    initLoginPage();
  });

  function setDefaultMonthRange(fromInput, toInput) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    if (fromInput) fromInput.value = start.toISOString().slice(0, 10);
    if (toInput) toInput.value = now.toISOString().slice(0, 10);
  }

  function buildTxQuery({ from, to, categoryId, paymentMethodId } = {}) {
    const q = new URLSearchParams();
    if (from) q.append('from', from);
    if (to) q.append('to', to);
    if (categoryId) q.append('categoryId', categoryId);
    if (paymentMethodId) q.append('paymentMethodId', paymentMethodId);
    return q.toString();
  }

  // ---------- Arranque por página ----------
  document.addEventListener('DOMContentLoaded', () => {
    const isLogin = !!$('#formLogin');
    const isRegister = !!$('#formRegister');

    if (!isLogin && !isRegister && typeof Auth !== 'undefined') {
      Auth.protect();
    }

    if (isLogin) initIndex();
    if (isRegister) initRegister();

    if ($('#resumen') && $('#nombre')) initDashboard();
    if ($('#tabla') && $('#catNombre')) initCategories();
    if ($('#pmNombre')) initPaymentMethods();
    if ($('#txFecha')) initTransactions();
    if ($('#bCat')) initBudgets();
    if ($('#chartMonthly') || $('#resumenCards')) initReports();

    window.logout = () => { Auth.logout(); window.location.href = '/'; };
  });

  // ---------- INDEX (login) ----------
  function initIndex() {
    if (Auth.isLoggedIn()) window.location.href = '/dashboard.html';
    const form = $('#formLogin');
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const correo = $('#loginCorreo')?.value.trim();
      const password = $('#loginPassword')?.value;
      try {
        const r = await API.post('/api/auth/login', { correo, password });
        Auth.saveToken(r.token, r.user);
        showMsg('loginMsg', 'success', 'Inicio de sesión correcto');
        setTimeout(() => window.location.href = '/dashboard.html', 400);
      } catch (err) {
        showMsg('loginMsg', 'error', formatErr('iniciar sesión', err));
      }
    });
  }

  // ---------- REGISTRO ----------
  function initRegister() {
    $('#formRegister')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        nombre: $('#regNombre')?.value.trim(),
        correo: $('#regCorreo')?.value.trim(),
        password: $('#regPassword')?.value
      };
      try {
        await API.post('/api/auth/register', payload);
        showMsg('regMsg', 'success', 'Usuario registrado correctamente. Ahora inicia sesión.');
      } catch (err) {
        showMsg('regMsg', 'error', formatErr('registrar', err));
      }
    });
  }

  // ---------- DASHBOARD ----------
  async function initDashboard() {
    const u = Auth.user() || {};
    $('#nombre').textContent = u.nombre || '';
    const resumen = $('#resumen');

    async function cargar() {
      const cats = await API.get('/api/categories');
      const txs = await API.get('/api/transactions');
      const ingresos = txs.filter(t => t.category?.tipo === 'ingreso').reduce((a, b) => a + Number(b.monto || 0), 0);
      const gastos = txs.filter(t => t.category?.tipo === 'gasto').reduce((a, b) => a + Number(b.monto || 0), 0);
      const saldo = ingresos - gastos;
      resumen.innerHTML = `
        <div class="card"><h2>Ingresos</h2><div class="success"><strong>${money(ingresos)}</strong></div></div>
        <div class="card"><h2>Gastos</h2><div class="error"><strong>${money(gastos)}</strong></div></div>
        <div class="card"><h2>Saldo</h2><div><strong>${money(saldo)}</strong></div></div>
        <div class="card"><h2>Categorías</h2><div><span class="badge">${cats.length}</span> visibles</div></div>
      `;
    }
    cargar();
  }

  // ---------- CATEGORÍAS ----------
  function initCategories() {
    let currentId = null;
    let CAT_MAP = new Map();

    // Estado para el modal de eliminación/archivado
    let CAT_DEL_ID = null;

    async function getCategoryUsage(id) {
      try {
        // Endpoint correcto: /usage
        return await API.get(`/api/categories/${id}/usage`);
      } catch {
        return { txCount: 0, budgetCount: 0 };
      }
    }

    function toggleGlobalBox() {
      const isAdmin = Auth.user()?.role === 'admin';
      const box = $('#globalBox');
      if (box) box.classList.toggle('hidden', !isAdmin);
      return isAdmin;
    }
    toggleGlobalBox();

    // Modal de edición
    window.openModal = (cat) => {
      currentId = cat.id;
      $('#editNombre').value = cat.nombre || '';
      $('#editTipo').value = cat.tipo || 'gasto';

      const isAdmin = Auth.user()?.role === 'admin';
      const box = $('#editGlobalBox');
      if (box) box.classList.toggle('hidden', !isAdmin);
      const chk = $('#editGlobal');
      if (chk) chk.checked = !!cat.global;

      // Toggle Activo (archivar/restaurar)
      const canToggleActivo = (isAdmin && cat.global) || !cat.global;
      const boxActivo = $('#editActivoBox');
      if (boxActivo) boxActivo.classList.toggle('hidden', !canToggleActivo);
      const chkActivo = $('#editActivo');
      if (chkActivo) chkActivo.checked = (cat.activo !== false); // default true

      $('#modalOv').style.display = 'flex';
    };
    window.closeModal = () => { $('#modalOv').style.display = 'none'; currentId = null; };

    window.guardarEdicion = async () => {
      const ok = await askConfirm('¿Seguro de editar esta categoría?', { variant: 'warning' });
      if (!ok) return;

      const payload = {
        nombre: $('#editNombre')?.value.trim(),
        tipo: $('#editTipo')?.value
      };
      if (Auth.user()?.role === 'admin') payload.global = $('#editGlobal')?.checked;

      const activoBoxVisible = !$('#editActivoBox')?.classList.contains('hidden');
      if (activoBoxVisible) payload.activo = $('#editActivo')?.checked;

      try {
        const resp = await API.put(`/api/categories/${currentId}`, payload);
        const msg = resp?.personalized ? 'Se creó tu versión personal con los cambios.' : 'Se editó correctamente.';
        showMsg('editMsg', 'success', msg);
        setTimeout(() => { window.closeModal(); cargar(); }, 400);
      } catch (e) {
        showMsg('editMsg', 'error', formatErr('editar la categoría', e));
      }
    };

    // Modal de eliminación/archivo con 3 caminos
    async function openCatDeleteModal(id) {
      const cat = CAT_MAP.get(id);
      if (!cat) { await cargar(); return; }
      CAT_DEL_ID = id;

      const stats = await getCategoryUsage(id);
      const txs = Number(stats.txCount || 0);
      const buds = Number(stats.budgetCount || 0);

      $('#catDelName').textContent = cat.nombre || '—';
      $('#catDelTipo').textContent = cat.tipo || '—';
      $('#catDelTx').textContent = String(txs);
      $('#catDelBudgets').textContent = String(buds);
      $('#catDelStatus').textContent = (cat.activo === false ? 'Archivada' : 'Activa');

      const isAdmin = (Auth.user()?.role === 'admin');
      const scopeTxt = cat.global ? (isAdmin ? 'Global (admin)' : 'Global') : 'Personal';
      $('#catDelScope').textContent = scopeTxt;

      const canHardDelete = (!cat.global) || isAdmin;
      const delBtn = $('#btnDelAll');
      delBtn.disabled = !canHardDelete;
      delBtn.title = canHardDelete ? '' : 'Solo el dueño (personal) o un admin (global) puede eliminar definitivamente';

      const archBtn = $('#btnArchive');
      archBtn.textContent = (cat.global && !isAdmin)
        ? 'Ocultar (mantener historial)'
        : (cat.activo === false ? 'Restaurar' : 'Archivar (mantener historial)');

      const msg = $('#catDelMsg'); if (msg) { msg.classList.add('hidden'); msg.textContent = ''; }
      $('#catDeleteOv').style.display = 'flex';
    }
    window.closeCatDelete = () => { $('#catDeleteOv').style.display = 'none'; CAT_DEL_ID = null; };

    // Eliminar TODO (cascada)
    window.deleteCategoryAll = async () => {
      if (!CAT_DEL_ID) return;
      const ok = await askConfirm(
        'Se eliminarán la categoría y TODO su historial (transacciones y presupuestos). ¿Continuar?',
        { variant: 'danger', confirmText: 'Sí, eliminar' }
      );
      if (!ok) return;

      try {
        await API.del(`/api/categories/${CAT_DEL_ID}?cascade=1`);
        showMsg('msg', 'success', 'Categoría e historial eliminados.');
        closeCatDelete(); cargar();
      } catch (e) {
        const box = $('#catDelMsg');
        if (box) { box.classList.remove('hidden'); box.classList.add('error'); box.textContent = formatErr('eliminar con historial', e); }
        else { showMsg('msg', 'error', formatErr('eliminar con historial', e)); }
      }
    };

    // Archivar / Restaurar / Ocultar
    window.archiveCategory = async () => {
      if (!CAT_DEL_ID) return;
      const cat = CAT_MAP.get(CAT_DEL_ID); if (!cat) return;
      const isAdmin = (Auth.user()?.role === 'admin');

      // confirmación previa
      const ok = await askConfirm(
        (cat.global && !isAdmin)
          ? 'Se ocultará la categoría global solo para ti (se mantiene el historial). ¿Continuar?'
          : (cat.activo === false ? '¿Restaurar la categoría?' : '¿Archivar la categoría? El historial se mantiene.'),
        { variant: 'warning' }
      );
      if (!ok) return;

      try {
        if (cat.global && !isAdmin) {
          await API.del(`/api/categories/${CAT_DEL_ID}`);
          showMsg('msg', 'success', 'Categoría global ocultada para ti. El historial se mantiene.');
        } else {
          const nuevoActivo = (cat.activo === false); // si estaba archivada → restaurar
          await API.put(`/api/categories/${CAT_DEL_ID}`, { activo: nuevoActivo });
          showMsg('msg', 'success', nuevoActivo ? 'Categoría restaurada.' : 'Categoría archivada. El historial se mantiene.');
        }
        closeCatDelete(); cargar();
      } catch (e) {
        const box = $('#catDelMsg');
        if (box) { box.classList.remove('hidden'); box.classList.add('error'); box.textContent = formatErr('actualizar categoría', e); }
        else { showMsg('msg', 'error', formatErr('actualizar categoría', e)); }
      }
    };

    // Eliminar (abre modal con las 3 opciones)
    window.eliminar = async (id) => { await openCatDeleteModal(id); };

    // Listado
    async function cargar() {
      toggleGlobalBox();
      const includeArchived = $('#verArchivadas')?.checked ? '?includeArchived=1' : '';
      const cats = await API.get('/api/categories/listadoTotal');

      CAT_MAP = new Map(cats.map(c => [c.id, c]));
      const tbody = $('#tabla tbody');

      tbody.innerHTML = cats.map(c => {
        const safe = escapeHTML(c.nombre || '');
        const estado = (c.activo === false)
          ? '<span class="badge" style="background:#fee2e2;color:#991b1b;border-color:#fecaca;margin-left:6px">Archivada</span>'
          : '';
        return `
      <tr>
        <td>${safe} ${estado}</td>
        <td><span class="badge">${c.tipo}</span></td>
        <td class="actions">
          <button class="btn-icon btn-edit" title="Editar" aria-label="Editar"
            onclick='openModal({id:${c.id}, nombre:"${safe}", tipo:"${c.tipo}", global:${!!c.global}, activo:${c.activo !== false}})'>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </button>
          <button class="btn-icon btn-delete" title="Eliminar" aria-label="Eliminar" onclick="eliminar(${c.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </td>
      </tr>`;
      }).join('');
    }

    $('#verArchivadas')?.addEventListener('change', cargar);
    window.cargar = cargar;

    // Crear
    window.crear = async () => {
      try {
        const nombre = ($('#catNombre')?.value || '').trim();
        const tipo = $('#catTipo')?.value || 'gasto';
        if (!nombre) return showMsg('msg', 'error', 'Ingresa un nombre.');
        const payload = { nombre, tipo };
        if (Auth.user()?.role === 'admin' && $('#catGlobal')?.checked) payload.global = true;
        await API.post('/api/categories', payload);
        showMsg('msg', 'success', 'Categoría registrada correctamente.');
        $('#catNombre').value = ''; const g = $('#catGlobal'); if (g) g.checked = false;
        cargar();
      } catch (e) {
        showMsg('msg', 'error', formatErr('registrar la categoría', e));
      }
    };

    cargar();
  }

  // ---------- MÉTODOS DE PAGO ----------
  function initPaymentMethods() {
    let pmId = null;
    let PM_MAP = new Map();

    // Estado para modales de borrado/archivo
    let PM_DEL_ID = null;
    let PM_DEL_NAME = '';
    let PM_PENDING_ACTION = null; // 'archive' | 'cascade'
    let PM_LAST_COUNTS = { txCount: 0 };
    let PM_IS_ARCHIVED = false; // 👈 nuevo


    // Helpers
    async function getPaymentMethodUsage(id) {
      try { return await API.get(`/api/payment-methods/${id}/usage`); }
      catch { return { txCount: 0 }; }
    }

    // Modal edición
    window.openPm = (p) => {
      pmId = p.id;
      $('#pmEditNombre').value = p.nombre || '';
      $('#pmEditActivo').checked = !!p.activo;
      $('#pmModalOv').style.display = 'flex';
    };
    window.closePm = () => { $('#pmModalOv').style.display = 'none'; pmId = null; };

    // Cargar tabla
    async function cargar() {
      const listadoTotal = await API.get('/api/payment-methods/listadoTotal');
      PM_MAP = new Map(listadoTotal.map(p => [p.id, p]));
      const tbody = $('#tabla tbody');
      tbody.innerHTML = listadoTotal.map(p => {
        const safe = escapeHTML(p.nombre || '');
        return `
        <tr>
          <td>${safe}</td>
          <td>${p.activo ? 'Sí' : 'No'}</td>
          <td class="actions">
            <button class="btn-icon btn-edit" title="Editar" aria-label="Editar"
              onclick='openPm({id:${p.id}, nombre:"${safe}", activo:${p.activo}})'>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </button>
            <button class="btn-icon btn-delete" title="Eliminar" aria-label="Eliminar" onclick="pmAskDelete(${p.id})">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </td>
        </tr>`;
      }).join('');
    }
    window.cargar = cargar;


    // Crear
    window.crear = async () => {
      try {
        const nombre = ($('#pmNombre')?.value || '').trim();
        if (!nombre) return showMsg('msg', 'error', 'Ingresa un nombre.');
        await API.post('/api/payment-methods', { nombre });
        showMsg('msg', 'success', 'Método registrado correctamente.');
        $('#pmNombre').value = '';
        cargar();
      } catch (e) {
        showMsg('msg', 'error', formatErr('registrar el método', e));
      }
    };

    // Guardar edición (con confirm)
    window.guardarPm = async () => {
      const ok = await askConfirm('¿Seguro de editar este método?', { variant: 'warning' });
      if (!ok) return;

      try {
        await API.put(`/api/payment-methods/${pmId}`, {
          nombre: ($('#pmEditNombre')?.value || '').trim(),
          activo: $('#pmEditActivo')?.checked
        });
        showMsg('pmEditMsg', 'success', 'Se editó correctamente.');
        setTimeout(() => { window.closePm(); cargar(); }, 500);
      } catch (e) {
        showMsg('pmEditMsg', 'error', formatErr('editar el método', e));
      }
    };

    // Flujo de eliminación/archivado con dos modales
    window.pmAskDelete = async (id) => {
      const pm = PM_MAP.get(id);
      if (!pm) { await cargar(); return; }

      PM_DEL_ID = id;
      PM_DEL_NAME = pm.nombre || '';
      PM_IS_ARCHIVED = !pm.activo;

      const u = await getPaymentMethodUsage(id);
      PM_LAST_COUNTS = { txCount: Number(u.txCount || 0) };

      $('#pmDelName').textContent = PM_DEL_NAME;
      $('#pmDelTxs').textContent = String(PM_LAST_COUNTS.txCount);
      $('#pmDelNoteNoUse')?.classList.toggle('hidden', PM_LAST_COUNTS.txCount > 0);
      // cambia el texto del botón según estado
      const actBtn = document.getElementById('pmActBtn');
      if (actBtn) actBtn.textContent = PM_IS_ARCHIVED ? 'Restaurar' : 'Archivar (mantener historial)';

      $('#pmDelOv').style.display = 'flex';
    };

    window.pmCloseDel = () => {
      PM_DEL_ID = null;
      PM_DEL_NAME = '';
      PM_PENDING_ACTION = null;
      $('#pmDelOv').style.display = 'none';
    };

    window.pmConfirm = (action /* 'archive' | 'cascade' */) => {
      if (!PM_DEL_ID) return;
      PM_PENDING_ACTION = action;

      const name = escapeHTML(PM_DEL_NAME);
      const txs = PM_LAST_COUNTS.txCount;
      let title = '';
      let body = '';

      if (action === 'archive') {
        if (PM_IS_ARCHIVED) {
          PM_PENDING_ACTION = 'restore'; // restaurar
          title = 'Confirmar restauración';
          body = `Vas a <strong>restaurar</strong> el método <strong>${name}</strong>. 
               Seguirá mostrando su historial (${txs} transacciones). ¿Deseas continuar?`;
        } else {
          PM_PENDING_ACTION = 'archive'; // archivar
          title = 'Confirmar archivado';
          body = `Vas a <strong>archivar</strong> el método <strong>${name}</strong>. 
               Se mantendrá el historial (${txs} transacciones). ¿Deseas continuar?`;
        }
      } else {
        title = 'Confirmar eliminación total';
        body = `Vas a <strong>eliminar TODO</strong> para el método <strong>${name}</strong>. 
                 Esto borrará definitivamente ${txs} transacciones asociadas y el método. ¿Deseas continuar?`;
      }

      $('#pmConfirmTitle').innerHTML = title;
      $('#pmConfirmBody').innerHTML = body;
      $('#pmConfirmMsg').style.display = 'none';

      $('#pmDelOv').style.display = 'none';
      $('#pmConfirmOv').style.display = 'flex';
    };

    window.pmCloseConfirm = () => {
      $('#pmConfirmOv').style.display = 'none';
    };

    function pmSetConfirmBusy(v) {
      $('#pmConfirmOk').disabled = v;
    }

    window.pmDoConfirm = async () => {
      if (!PM_DEL_ID || !PM_PENDING_ACTION) return;
      try {
        pmSetConfirmBusy(true);
        if (PM_PENDING_ACTION === 'restore') {
          await API.put(`/api/payment-methods/${PM_DEL_ID}`, { activo: true });      // RESTAURAR
          showMsg('msg', 'success', 'Método restaurado.');
        } else if (PM_PENDING_ACTION === 'archive') {
          await API.del(`/api/payment-methods/${PM_DEL_ID}?archive=1`);              // ARCHIVAR
          showMsg('msg', 'success', 'Método archivado. El historial se mantiene.');
        } else {
          await API.del(`/api/payment-methods/${PM_DEL_ID}?cascade=1`);              // ELIMINAR TODO
          showMsg('msg', 'success', 'Método y transacciones relacionadas eliminadas.');
        }
        pmSetConfirmBusy(false);
        pmCloseConfirm();
        pmCloseDel();
        cargar();
      } catch (e) {
        pmSetConfirmBusy(false);
        if (e?.status === 409 && e?.data?.txCount >= 0) {
          $('#pmConfirmMsg').style.display = 'block';
          showMsg('pmConfirmMsg', 'error', e?.data?.message || 'Método en uso. Elige una acción válida.');
        } else {
          $('#pmConfirmMsg').style.display = 'block';
          showMsg('pmConfirmMsg', 'error', formatErr('procesar la acción', e));
        }
      }
    };

    cargar();
  }

  // ---------- TRANSACCIONES ----------
  function initTransactions() {
    let txId = null;

    function setDefaultDateForTx() {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const yyyy = start.getFullYear();
      const mm = String(start.getMonth() + 1).padStart(2, '0');
      const dd = String(start.getDate()).padStart(2, '0');
      $('#txFecha').value = `${yyyy}-${mm}-${dd}`;
    }

    async function cargarCats() {
      const cats = await API.get('/api/categories');
      $('#txCat').innerHTML = cats.map(c => `<option value="${c.id}">${escapeHTML(c.nombre)} (${c.tipo})</option>`).join('');
    }

    async function cargarPMs() {
      const list = await API.get('/api/payment-methods');
      $('#txPM').innerHTML = list.map(p => `<option value="${p.id}">${escapeHTML(p.nombre)}</option>`).join('');
    }

    async function cargar() {
      const txs = await API.get('/api/transactions');
      const tbody = $('#tabla tbody');
      tbody.innerHTML = txs.map(t => {
        const safeDesc = escapeHTML(t.descripcion || '');
        return `
          <tr>
            <td>${t.fecha}</td>
            <td>${safeDesc}</td>
            <td><span class="badge">${escapeHTML(t.category?.nombre || '')}</span></td>
            <td>${escapeHTML(t.paymentMethod?.nombre || '')}</td>
            <td>${money(t.monto)}</td>
            <td class="actions">
              <button class="btn-icon btn-edit" title="Editar" aria-label="Editar"
                onclick='openTx({id:${t.id}, fecha:"${t.fecha}", monto:${Number(t.monto)}, descripcion:"${safeDesc}"})'>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </button>
              <button class="btn-icon btn-delete" title="Eliminar" aria-label="Eliminar" onclick="eliminar(${t.id})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </td>
          </tr>`;
      }).join('');
    }

    window.openTx = (tx) => {
      txId = tx.id;
      $('#txEditFecha').value = tx.fecha;
      $('#txEditMonto').value = tx.monto;
      $('#txEditDesc').value = tx.descripcion;
      $('#txModalOv').style.display = 'flex';
    };
    window.closeTx = () => { $('#txModalOv').style.display = 'none'; txId = null; };

    window.guardarTx = async () => {
      const ok = await askConfirm('¿Seguro de editar esta transacción?', { variant: 'warning' });
      if (!ok) return;

      try {
        await API.put(`/api/transactions/${txId}`, {
          fecha: $('#txEditFecha').value,
          monto: Number($('#txEditMonto').value),
          descripcion: $('#txEditDesc').value
        });
        showMsg('txEditMsg', 'success', 'Se editó correctamente.');
        setTimeout(() => { window.closeTx(); cargar(); }, 500);
      } catch (e) {
        showMsg('txEditMsg', 'error', formatErr('editar la transacción', e));
      }
    };

    window.crear = async () => {
      try {
        const payload = {
          fecha: $('#txFecha').value,
          monto: Number($('#txMonto').value),
          descripcion: $('#txDesc').value,
          categoryId: Number($('#txCat').value),
          paymentMethodId: Number($('#txPM').value)
        };
        if (isNaN(payload.monto) || !payload.descripcion) {
          showMsg('msg', 'error', 'Completa monto y descripción.');
          return;
        }
        await API.post('/api/transactions', payload);
        showMsg('msg', 'success', 'Transacción registrada correctamente.');
        $('#txMonto').value = '';
        $('#txDesc').value = '';
        await cargar();
      } catch (e) {
        showMsg('msg', 'error', formatErr('registrar la transacción', e));
      }
    };

    window.eliminar = async (id) => {
      const ok = await askConfirm('¿Seguro de eliminar esta transacción?', { variant: 'danger', confirmText: 'Sí, eliminar' });
      if (!ok) return;

      try {
        await API.del(`/api/transactions/${id}`);
        showMsg('msg', 'success', 'Se eliminó correctamente.');
        cargar();
      } catch (e) {
        showMsg('msg', 'error', formatErr('eliminar la transacción', e));
      }
    };

    cargarCats();
    cargarPMs();
    cargar();
    setDefaultDateForTx();
  }

  // ---------- PRESUPUESTOS ----------
  function initBudgets() {
    let editingId = null;
    let BUDGET_MAP = new Map();

    async function cargarCats() {
      const cats = await API.get('/api/categories');
      $('#bCat').innerHTML = cats.map(c => `<option value="${c.id}">${escapeHTML(c.nombre)} (${c.tipo})</option>`).join('');
    }

    function setModeCreate() {
      editingId = null;
      $('#btnSave').textContent = 'Guardar';
      $('#bMonto').value = '';
      $('#bMes').value = '';
      $('#bAnio').value = '';
    }

    function ensureCategoryOption(catId, catNombre, catTipo) {
      if (!catId) return;
      const sel = $('#bCat');
      const exists = [...sel.options].some(o => Number(o.value) === Number(catId));
      if (!exists) {
        const opt = document.createElement('option');
        opt.value = String(catId);
        const tipoTxt = catTipo ? ` (${catTipo})` : '';
        opt.textContent = `${catNombre || 'Categoría'}${tipoTxt} — no visible`;
        opt.dataset.temp = 'true';
        sel.appendChild(opt);
      }
      sel.value = String(catId);
    }

    function setModeEdit(b) {
      editingId = b.id;
      $('#btnSave').textContent = 'Actualizar';
      const catId = b.category?.id ?? b.categoryId;
      const catNombre = b.category?.nombre;
      const catTipo = b.category?.tipo;
      ensureCategoryOption(catId, catNombre, catTipo);
      $('#bMonto').value = String(Number(b.montoMensual || 0));
      $('#bMes').value = String(b.mes);
      $('#bAnio').value = String(b.anio);
      showMsg('msg', 'success', 'Presupuesto cargado para edición. Modifica y pulsa Actualizar.');
    }
    window.editar = (id) => { const b = BUDGET_MAP.get(id); if (b) setModeEdit(b); };

    window.limpiar = () => {
      setModeCreate();
      $$('#bCat option[data-temp="true"]').forEach(o => o.remove());
      showMsg('msg', 'success', 'Formulario limpiado.');
    };

    async function cargar() {
      const q = new URLSearchParams();
      const fMes = $('#fMes')?.value;
      const fAnio = $('#fAnio')?.value;
      if (fMes) q.append('mes', fMes);
      if (fAnio) q.append('anio', fAnio);

      const budgets = await API.get('/api/budgets' + (q.toString() ? '?' + q.toString() : ''));
      BUDGET_MAP = new Map(budgets.map(b => [b.id, b]));
      const tbody = $('#tabla tbody');
      tbody.innerHTML = budgets.map(b => {
        const catNombre = escapeHTML(b.category?.nombre || '');
        const catTipo = b.category?.tipo ? ` (${b.category.tipo})` : '';
        const monto = Number(b.montoMensual).toFixed(2);
        return `
          <tr>
            <td>${catNombre}${catTipo}</td>
            <td>${b.mes}/${b.anio}</td>
            <td>${money(monto)}</td>
            <td class="actions">
              <button class="btn-icon btn-edit" title="Editar" aria-label="Editar" onclick="editar(${b.id})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </button>
              <button class="btn-icon btn-delete" title="Eliminar" aria-label="Eliminar" onclick="eliminar(${b.id})">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </td>
          </tr>`;
      }).join('') || '<tr><td colspan="4" class="muted">Sin resultados</td></tr>';
    }
    window.cargar = cargar;

    window.guardar = async () => {
      try {
        const payload = {
          categoryId: Number($('#bCat').value),
          montoMensual: Number($('#bMonto').value),
          mes: Number($('#bMes').value),
          anio: Number($('#bAnio').value)
        };
        if (!payload.categoryId || isNaN(payload.montoMensual) || !payload.mes || !payload.anio) {
          showMsg('msg', 'error', 'Completa monto, mes y año.');
          return;
        }
        if (editingId) {
          const ok = await askConfirm('¿Seguro de actualizar este presupuesto?', { variant: 'warning' });
          if (!ok) return;
          const r = await API.put(`/api/budgets/${editingId}`, payload);
          showMsg('msg', 'success', r.message || 'Presupuesto editado correctamente.');
        } else {
          const r = await API.post('/api/budgets', payload);
          showMsg('msg', 'success', r.message || 'Presupuesto registrado correctamente.');
        }
        setModeCreate();
        $$('#bCat option[data-temp="true"]').forEach(o => o.remove());
        await cargar();
      } catch (e) {
        showMsg('msg', 'error', formatErr(editingId ? 'editar el presupuesto' : 'guardar el presupuesto', e));
      }
    };

    window.eliminar = async (id) => {
      const ok = await askConfirm('¿Seguro de eliminar este presupuesto?', { variant: 'danger', confirmText: 'Sí, eliminar' });
      if (!ok) return;

      try {
        await API.del(`/api/budgets/${id}`);
        showMsg('msg', 'success', 'Se eliminó correctamente.');
        if (editingId === id) setModeCreate();
        await cargar();
      } catch (e) {
        showMsg('msg', 'error', formatErr('eliminar el presupuesto', e));
      }
    };

    cargarCats().then(setModeCreate);
    cargar();
    window.limpiar(); // si quieres limpiar al cargar
  }

  // ---------- REPORTES ----------
  function initReports() {
    function setMetrics({ ingresos = 0, gastos = 0, saldo = 0, count = null }) {
      $('#mIngresos').textContent = money(ingresos);
      $('#mGastos').textContent = money(gastos);
      $('#mSaldo').textContent = money(saldo);
      if (count !== null) $('#mCount').textContent = String(count);
    }

    function setDefaultDates() {
      setDefaultMonthRange($('#fDesde'), $('#fHasta'));
    }

    async function loadFilters() {
      try {
        const cats = await API.get('/api/categories/listadoTotal');
        const catsSorted = [...cats].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
        $('#fCat').innerHTML =
          '<option value="">(Todas)</option>' +
          catsSorted.map(c => `<option value="${c.id}">${escapeHTML(c.nombre)} (${c.tipo || '—'})</option>`).join('');

        const pm = await API.get('/api/payment-methods/listadoTotal');
        const pmSorted = [...pm].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
        $('#fPM').innerHTML =
          '<option value="">(Todos)</option>' +
          pmSorted.map(p => `<option value="${p.id}">${escapeHTML(p.nombre)}</option>`).join('');
      } catch (e) {
        showMsg('msg', 'error', formatErr('cargar filtros', e));
      }
    }

    function buildQuery() {
      return buildTxQuery({
        from: $('#fDesde')?.value,
        to: $('#fHasta')?.value,
        categoryId: $('#fCat')?.value,
        paymentMethodId: $('#fPM')?.value
      });
    }

    async function verResumen() {
      try {
        const qs = buildQuery();
        const arr = await API.get('/api/transactions' + (qs ? '?' + qs : ''));
        const ingresos = arr.filter(t => t.category?.tipo === 'ingreso').reduce((a, b) => a + Number(b.monto || 0), 0);
        const gastos = arr.filter(t => t.category?.tipo === 'gasto').reduce((a, b) => a + Number(b.monto || 0), 0);
        const saldo = ingresos - gastos;
        setMetrics({ ingresos, gastos, saldo, count: arr.length });
        showMsg('msg', 'success', 'Resumen actualizado.');
      } catch (e) {
        showMsg('msg', 'error', formatErr('obtener el resumen', e));
      }
    }

    async function descargar(format) {
      try {
        const qs = buildQuery();
        const url = '/api/reports/transactions/export' + (qs ? '?' + qs + '&' : '?') + 'format=' + format;
        const res = await fetch(url, { headers: { 'Authorization': 'Bearer ' + (Auth.token() || '') } });
        if (!res.ok) throw new Error((await res.text()) || ('HTTP ' + res.status));
        const blob = await res.blob();

        const cd = res.headers.get('content-disposition');
        let fname = cd && /filename="?([^"]+)"?/.exec(cd)?.[1];
        if (!fname) {
          const desde = $('#fDesde')?.value || 'inicio';
          const hasta = $('#fHasta')?.value || 'hoy';
          fname = `reporte_transacciones_${desde}_${hasta}.${format}`;
        }

        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = fname;
        document.body.appendChild(a); a.click(); a.remove();
        showMsg('msg', 'success', 'Descarga iniciada.');
      } catch (e) {
        showMsg('msg', 'error', formatErr('descargar el reporte', e));
      }
    }

    let CHART_MONTHLY, CHART_CATEGORY;

    async function verInsights() {
      const q = new URLSearchParams();
      if ($('#fDesde')?.value) q.append('from', $('#fDesde').value);
      if ($('#fHasta')?.value) q.append('to', $('#fHasta').value);

      const data = await API.get('/api/reports/insights' + (q.toString() ? '?' + q.toString() : ''));

      if (data?.totals) setMetrics({
        ingresos: data.totals.ingresos,
        gastos: data.totals.gastos,
        saldo: data.totals.saldo
      });

      if (window.ChartDataLabels && window.Chart?.register) {
        Chart.register(ChartDataLabels);
      }

      const ctx1 = $('#chartMonthly')?.getContext('2d');
      if (ctx1) {
        CHART_MONTHLY?.destroy();
        CHART_MONTHLY = new Chart(ctx1, {
          type: 'bar',
          data: {
            labels: data.monthly.labels,
            datasets: [
              { label: 'Ingresos', data: data.monthly.income },
              { label: 'Gastos', data: data.monthly.expense }
            ]
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'bottom' },
              datalabels: {
                anchor: 'end',
                align: 'top',
                formatter: v => `S/ ${Number(v).toFixed(0)}`,
                font: { weight: '600', size: 10 }
              }
            },
            scales: { y: { beginAtZero: true } }
          }
        });
      }

      const ctx2 = $('#chartCategory')?.getContext('2d');
      if (ctx2) {
        CHART_CATEGORY?.destroy();
        CHART_CATEGORY = new Chart(ctx2, {
          type: 'pie',
          data: { labels: data.categories.labels, datasets: [{ data: data.categories.expense }] },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'bottom' },
              datalabels: {
                formatter: (value, ctx) => {
                  const arr = ctx.chart.data.datasets[0].data || [];
                  const sum = arr.reduce((a, b) => a + Number(b || 0), 0);
                  const pct = sum ? (value / sum * 100) : 0;
                  return `${pct.toFixed(1)}%\nS/ ${Number(value).toFixed(2)}`;
                },
                color: '#fff',
                font: { weight: '600', size: 10 }
              }
            }
          }
        });
      }

      showMsg('msg', 'success', 'Panel actualizado.');
    }

    $('#btnResumen')?.addEventListener('click', verResumen);
    $('#btnActualizar')?.addEventListener('click', verInsights);
    $('#btnExcel')?.addEventListener('click', () => descargar('xlsx'));
    $('#btnPDFLista')?.addEventListener('click', () => descargar('pdf'));

    setDefaultDates();
    loadFilters();
    verResumen();
    verInsights();
  }

})();
