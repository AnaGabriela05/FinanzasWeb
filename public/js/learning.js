// /js/learning.js
(() => {
  'use strict';
  Auth.protect?.();

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  // --- Storage por usuario ---
  // Tomamos un identificador estable del usuario (id si existe, si no correo, si no 'anon').
  const getUID = () => {
    const u = (typeof Auth !== 'undefined' && Auth.user && Auth.user()) || {};
    return String(u.id ?? u.correo ?? 'anon');
  };

  // Claves nuevas: learn:<uid>:notes:<videoId> y learn:<uid>:todos:<videoId>
  const LS2 = {
    notes: (uid, vid) => `learn:${uid}:notes:${vid}`,
    todos: (uid, vid) => `learn:${uid}:todos:${vid}`,
  };

  // Carga/guarda usando UID
  const loadNotes = (vid) => {
    const uid = getUID();
    return localStorage.getItem(LS2.notes(uid, vid)) || '';
  };
  const saveNotes = (vid, txt) => {
    const uid = getUID();
    localStorage.setItem(LS2.notes(uid, vid), txt);
  };

  const loadTodos = (vid) => {
    const uid = getUID();
    try { return JSON.parse(localStorage.getItem(LS2.todos(uid, vid)) || '[]'); }
    catch { return []; }
  };
  const saveTodos = (vid, arr) => {
    const uid = getUID();
    localStorage.setItem(LS2.todos(uid, vid), JSON.stringify(arr));
  };

  // ---------- Helpers (notas + checklist en localStorage) ----------
  //  const LS = {
  //  notes: id => `learn:notes:${id}`,
  //  todos: id => `learn:todos:${id}`,
  //};
  //const loadNotes = id => localStorage.getItem(LS.notes(id)) || '';
  //const saveNotes = (id, txt) => localStorage.setItem(LS.notes(id), txt);
  //
  //const loadTodos = id => { try { return JSON.parse(localStorage.getItem(LS.todos(id)) || '[]'); } catch { return []; } };
  //const saveTodos = (id, arr) => localStorage.setItem(LS.todos(id), JSON.stringify(arr));

  const escapeHTML = s => String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const debounce = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  // ---------- YouTube helpers ----------
  const getId = (item) => {
    if (item.youtubeId) return item.youtubeId;
    if (!item.url) return null;
    try {
      const u = new URL(item.url);
      if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
      if (u.searchParams.get('v')) return u.searchParams.get('v');
      if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2] || null;
      if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2] || null;
    } catch { }
    return null;
  };
  const thumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  const ytWatch = (id) => `https://www.youtube.com/watch?v=${id}`;
  const ytEmbed = (id, { autoplay = 1, mute = 1 } = {}) =>
    `https://www.youtube.com/embed/${id}?autoplay=${autoplay}&mute=${mute}&playsinline=1&rel=0&modestbranding=1&controls=1`;

  // ---------- Datos y filtros ----------
  // IMPORTANTE: asegúrate que /js/videos-data.js va antes de este archivo y define window.VIDEOS = [...]
  const VIDEOS = (window.VIDEOS || []).map(v => ({ ...v, id: getId(v) })).filter(v => v.id);

  const tagSelect = $('#vTag');
  const searchIn = $('#vSearch');
  const grid = $('#videoGrid');

  if (tagSelect) {
    const ALL_TAGS = [...new Set(VIDEOS.flatMap(v => v.tags || []))];
    tagSelect.innerHTML =
      `<option value="">Todos los temas</option>` +
      ALL_TAGS.map(t => `<option value="${t}">${t}</option>`).join('');
  }

  // ---------- Tarjetas ----------
  function cardTpl(v) {
    const tags = (v.tags || []).map(t => `<span class="pill">${t}</span>`).join('');
    return `
      <article class="video-card" data-id="${v.id}" data-tags="${(v.tags || []).join(',').toLowerCase()}">
        <div class="ratio-16x9">
          <div class="video-thumb" data-ytid="${v.id}">
            <img loading="lazy" src="${thumb(v.id)}" alt="${escapeHTML(v.title || 'Video')}" />
            <button class="sound-badge" title="Activar sonido" data-action="toggle-sound" data-muted="1">🔊</button>
          </div>
        </div>
        <div class="video-info">
          <h3 title="${escapeHTML(v.title || '')}">${escapeHTML(v.title || '')}</h3>
          <p>${escapeHTML(v.channel || '')}</p>
          <div class="tags">${tags}</div>
          <div class="video-actions">
            <a class="secondary small" href="${ytWatch(v.id)}" target="_blank" rel="noopener">Ver en YouTube</a>
            <button class="primary small" data-action="open-modal">Ver aquí</button>
          </div>
        </div>
      </article>`;
  }

  function render(list) {
    if (!grid) return;
    grid.innerHTML = list.map(cardTpl).join('') || '<div class="muted">No hay videos para mostrar.</div>';
    wireCards();
  }

  // ---------- Filtros ----------
  function applyFilters() {
    const q = (searchIn?.value || '').toLowerCase().trim();
    const tag = (tagSelect?.value || '').toLowerCase().trim();
    const out = VIDEOS.filter(v => {
      const hayQ = !q || [v.title, v.channel, (v.tags || []).join(' ')].join(' ').toLowerCase().includes(q);
      const hayT = !tag || (v.tags || []).map(t => t.toLowerCase()).includes(tag);
      return hayQ && hayT;
    });
    render(out);
  }
  searchIn?.addEventListener('input', applyFilters);
  tagSelect?.addEventListener('change', applyFilters);

  // ---------- Hover preview + botón de sonido ----------
  function wireCards() {
    if (!CSS.supports?.('aspect-ratio: 16/9')) {
      $$('.ratio-16x9').forEach(el => el.dataset.polyfill = '1');
    }

    $$('.video-thumb').forEach(box => {
      let timer = null, hasIframe = false;
      const id = box.dataset.ytid;

      const makeIframe = (muted = true) => {
        hasIframe = true;
        box.innerHTML = `
          <iframe
            src="${ytEmbed(id, { autoplay: 1, mute: 0 })}"
            title="YouTube preview"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowfullscreen
            style="width:100%;height:100%;border:0"></iframe>
          <button class="sound-badge" title="${muted ? 'Activar sonido' : 'Silenciar'}" data-action="toggle-sound" data-muted="${muted ? 1 : 0}">🔊</button>`;
      };
      const restoreThumb = () => {
        hasIframe = false;
        box.innerHTML = `
          <img loading="lazy" src="${thumb(id)}" alt="Miniatura"/>
          <button class="sound-badge" title="Activar sonido" data-action="toggle-sound" data-muted="1">🔊</button>`
        };

      /* const showPreview = () => { timer = setTimeout(() => makeIframe(true), 150); };
      const hidePreview = () => { clearTimeout(timer); restoreThumb(); };

      box.addEventListener('mouseenter', showPreview);
      box.addEventListener('mouseleave', hidePreview); */

      // Clicks dentro del thumbnail (toggle sonido)
      box.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="toggle-sound"]');
        if (!btn) return;
        const isMuted = btn.dataset.muted === '1';
        if (!hasIframe) {
          makeIframe(false); // primer gesto del usuario → crear con audio
        } else {
          const iframe = box.querySelector('iframe');
          const url = new URL(iframe.src);
          url.searchParams.set('mute', isMuted ? '0' : '1');
          url.searchParams.set('autoplay', '1');
          iframe.src = url.toString();
        }
        btn.dataset.muted = isMuted ? '0' : '1';
        btn.title = isMuted ? 'Silenciar' : 'Activar sonido';
      });

      // Botón "Ver aquí" (está fuera del thumbnail)
      const card = box.closest('.video-card');
      card?.querySelector('[data-action="open-modal"]')?.addEventListener('click', () => {
        const vid = card.dataset.id;
        const v = VIDEOS.find(x => x.id === vid);
        if (v) openVideoModal(v);
      });
    });
  }

  // ---------- Modal (video + puntos + notas + checklist) ----------
  function openVideoModal(v) {
    // título + link
    $('#vidTitle').textContent = v.title || 'Reproduciendo…';
    const link = $('#ytLink');
    if (link) link.href = ytWatch(v.id);

    // player (con audio)
    $('#vidFrameWrap').innerHTML = `
      <iframe
        src="${ytEmbed(v.id, { autoplay: 1, mute: 0 })}"
        title="${escapeHTML(v.title || 'Video')}"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowfullscreen
        style="width:100%;height:100%;border:0"></iframe>`;

    // Puntos clave
    const ul = $('#vidKeyPoints');
    const pts = Array.isArray(v.points) ? v.points : [];
    if (ul) ul.innerHTML = pts.map(p => `<li>${escapeHTML(p)}</li>`).join('');
    const noPts = $('#noPoints');
    if (noPts) noPts.style.display = pts.length ? 'none' : 'block';

    // Notas (autosave + copiar/descargar)
    const notesBox = $('#vidNotes');
    const savedBadge = $('#notesSaved');
    if (notesBox) {
      notesBox.value = loadNotes(v.id);
      if (savedBadge) savedBadge.style.opacity = 0;
      notesBox.oninput = debounce(() => {
        saveNotes(v.id, notesBox.value);
        if (savedBadge) {
          savedBadge.style.opacity = 1;
          setTimeout(() => savedBadge.style.opacity = 0, 800);
        }
      }, 350);
    }
    $('#btnCopyNotes')?.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(notesBox?.value || ''); } catch { }
    }, { once: true });
    $('#btnDownloadNotes')?.addEventListener('click', () => {
      const blob = new Blob([notesBox?.value || ''], { type: 'text/plain' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (v.title ? v.title.replace(/\s+/g, '_') : 'notas') + '.txt';
      a.click();
    }, { once: true });

    // Checklist
    let todos = loadTodos(v.id);
    const ulTodo = $('#todoList');
    function renderTodos() {
      if (!ulTodo) return;
      ulTodo.innerHTML = todos.map((t, i) => `
        <li class="${t.done ? 'done' : ''}">
          <label>
            <input type="checkbox" data-i="${i}" ${t.done ? 'checked' : ''}>
            <span>${escapeHTML(t.text)}</span>
          </label>
          <button class="link del" data-i="${i}" title="Eliminar">✕</button>
        </li>
      `).join('') || '<li class="muted small">Sin tareas.</li>';
    }
    renderTodos();

    $('#todoAdd')?.addEventListener('click', () => {
      const inp = $('#todoInput');
      const txt = (inp?.value || '').trim();
      if (!txt) return;
      todos.push({ text: txt, done: false });
      saveTodos(v.id, todos);
      if (inp) inp.value = '';
      renderTodos();
    }, { once: false });

    ulTodo?.addEventListener('change', (e) => {
      const i = e.target?.dataset?.i;
      if (i === undefined) return;
      todos[i].done = !!e.target.checked;
      saveTodos(v.id, todos);
      renderTodos();
    });
    ulTodo?.addEventListener('click', (e) => {
      const btn = e.target.closest('.del');
      if (!btn) return;
      const i = Number(btn.dataset.i);
      todos.splice(i, 1);
      saveTodos(v.id, todos);
      renderTodos();
    });

    // Tabs
    $$('.notes-tabs .tab-btn').forEach(b => {
      b.onclick = () => {
        $$('.notes-tabs .tab-btn').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        const target = b.dataset.tab; // points | notes | todo
        $$('.tab-panel').forEach(p => {
          const should = p.id === ('tab' + target.charAt(0).toUpperCase() + target.slice(1));
          p.classList.toggle('active', should);
        });
      };
    });

    // Mostrar modal
    $('#videoModalOv').style.display = 'flex';
  }

  window.closeVideoModal = () => {
    $('#videoModalOv').style.display = 'none';
    $('#vidFrameWrap').innerHTML = ''; // detiene reproducción
  };

  window.logout = () => { Auth.logout(); location.href = '/'; };

  // ---------- Inicio ----------
  // Si por cualquier motivo VIDEOS viene vacío, al menos muestra un aviso en consola:
  if (!VIDEOS.length) console.warn('[learning] No hay VIDEOS cargados. Revisa que /js/videos-data.js se cargue antes.');
  applyFilters();
})();
