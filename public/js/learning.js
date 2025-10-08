// /js/learning.js
(() => {
  'use strict';
  Auth.protect?.();

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  // ---- helpers de notas/checklist (localStorage)
  const LS = {
    notes: id => `learn:notes:${id}`,
    todos: id => `learn:todos:${id}`,
  };
  const loadNotes = id => localStorage.getItem(LS.notes(id)) || '';
  const saveNotes = (id, txt) => localStorage.setItem(LS.notes(id), txt);

  const loadTodos = id => { try { return JSON.parse(localStorage.getItem(LS.todos(id)) || '[]'); } catch { return []; } };
  const saveTodos = (id, arr) => localStorage.setItem(LS.todos(id), JSON.stringify(arr));

  const escapeHTML = s => String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const debounce = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  // ---- YouTube helpers
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

  // ---- Datos y filtros
  const VIDEOS = (window.VIDEOS || []).map(v => ({ ...v, id: getId(v) })).filter(v => v.id);

  const tagSelect = $('#vTag');
  const searchIn = $('#vSearch');
  const grid = $('#videoGrid');
  // Poblar tags únicas
  if (tagSelect) {
    const ALL_TAGS = [...new Set(VIDEOS.flatMap(v => v.tags || []))];
    tagSelect.innerHTML =
      `<option value="">Todos los temas</option>` +
      ALL_TAGS.map(t => `<option value="${t}">${t}</option>`).join('');
  }

  // ---- Tarjeta
  function cardTpl(v) {
    const tags = (v.tags || []).map(t => `<span class="pill">${t}</span>`).join('');
    return `
      <article class="video-card" data-id="${v.id}" data-tags="${(v.tags || []).join(',').toLowerCase()}">
        <div class="ratio-16x9">
          <div class="video-thumb" data-ytid="${v.id}">
            <img loading="lazy" src="${thumb(v.id)}" alt="${(v.title || 'Video')}" />
            <button class="sound-badge" title="Activar sonido" data-action="toggle-sound" data-muted="1">🔊</button>
          </div>
        </div>
        <div class="video-info">
          <h3 title="${v.title || ''}">${v.title || ''}</h3>
          <p>${v.channel || ''}</p>
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

  // ---- Filtros
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

  // ---- Hover preview (mute) + botón parlante para activar sonido
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
          <button class="sound-badge" title="Activar sonido" data-action="toggle-sound" data-muted="1">🔊</button>`;
      };

      const showPreview = () => { timer = setTimeout(() => makeIframe(true), 150); };
      const hidePreview = () => { clearTimeout(timer); restoreThumb(); };


      // Clicks dentro del thumbnail
      box.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="toggle-sound"]');
        if (btn) {
          // Necesita un gesto del usuario para audio → recargamos el iframe con mute=0
          const isMuted = btn.dataset.muted === '1';
          if (!hasIframe) makeIframe(isMuted); // crea iframe si aún era imagen
          else {
            const iframe = box.querySelector('iframe');
            const url = new URL(iframe.src);
            url.searchParams.set('mute', isMuted ? '0' : '1');
            url.searchParams.set('autoplay', '1');
            iframe.src = url.toString();
          }
          btn.dataset.muted = isMuted ? '0' : '1';
          btn.title = isMuted ? 'Silenciar' : 'Activar sonido';
        }
      });

      // Botón "Ver aquí" (fuera del thumbnail)
      const card = box.closest('.video-card');
      card?.querySelector('[data-action="open-modal"]')?.addEventListener('click', () => {
        const vid = card.dataset.id;
        const v = VIDEOS.find(x => x.id === vid);
        if (v) openVideoModal(v);
      });
    });
  }

  // ---- Modal
 function openVideoModal(v){
  // título + enlace
  $('#vidTitle').textContent = v.title || 'Reproduciendo…';
  $('#ytLink').href = ytWatch(v.id);

  // player (con audio)
  $('#vidFrameWrap').innerHTML = `
    <iframe
      src="${ytEmbed(v.id,{autoplay:1,mute:0})}"
      title="${escapeHTML(v.title || 'Video')}"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowfullscreen
      style="width:100%;height:100%;border:0"></iframe>`;

  // --- Puntos clave (tomados de v.points en videos-data.js)
  const ul = $('#vidKeyPoints');
  const pts = Array.isArray(v.points) ? v.points : [];
  ul.innerHTML = pts.map(p => `<li>${escapeHTML(p)}</li>`).join('');
  $('#noPoints').style.display = pts.length ? 'none' : 'block';

  // --- Notas (autosave)
  const notesBox = $('#vidNotes');
  const saved = loadNotes(v.id);
  notesBox.value = saved;
  const savedBadge = $('#notesSaved');
  savedBadge.style.opacity = 0;

  const saveNotesDebounced = debounce(() => {
    saveNotes(v.id, notesBox.value);
    savedBadge.style.opacity = 1;
    setTimeout(()=> savedBadge.style.opacity = 0, 800);
  }, 350);
  notesBox.oninput = saveNotesDebounced;

  // copiar / descargar
  $('#btnCopyNotes').onclick = async () => {
    try { await navigator.clipboard.writeText(notesBox.value || ''); } catch {}
  };
  $('#btnDownloadNotes').onclick = () => {
    const blob = new Blob([notesBox.value || ''], {type:'text/plain'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (v.title ? v.title.replace(/\s+/g,'_') : 'notas') + '.txt';
    a.click();
  };

  // --- Checklist
  let todos = loadTodos(v.id);
  const ulTodo = $('#todoList');
  function renderTodos(){
    ulTodo.innerHTML = todos.map((t,i)=>`
      <li class="${t.done?'done':''}">
        <label>
          <input type="checkbox" data-i="${i}" ${t.done?'checked':''}>
          <span>${escapeHTML(t.text)}</span>
        </label>
        <button class="link del" data-i="${i}" title="Eliminar">✕</button>
      </li>`).join('') || '<li class="muted small">Sin tareas.</li>';
  }
  renderTodos();

  $('#todoAdd').onclick = () => {
    const inp = $('#todoInput');
    const txt = (inp.value||'').trim();
    if(!txt) return;
    todos.push({text:txt, done:false});
    saveTodos(v.id, todos);
    inp.value=''; renderTodos();
  };
  ulTodo.onchange = (e) => {
    const i = e.target?.dataset?.i;
    if (i===undefined) return;
    todos[i].done = !!e.target.checked;
    saveTodos(v.id, todos);
    renderTodos();
  };
  ulTodo.onclick = (e) => {
    const btn = e.target.closest('.del');
    if(!btn) return;
    const i = Number(btn.dataset.i);
    todos.splice(i,1);
    saveTodos(v.id, todos);
    renderTodos();
  };

  // --- Tabs del panel
  $$('.notes-tabs .tab-btn').forEach(b=>{
    b.onclick = ()=>{
      $$('.notes-tabs .tab-btn').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      const target = b.dataset.tab;
      $$('.tab-panel').forEach(p=> p.classList.toggle('active', p.id === 'tab'+target.charAt(0).toUpperCase()+target.slice(1)));
    };
  });

  // mostrar modal
  $('#videoModalOv').style.display = 'flex';
}


  window.closeVideoModal = () => {
    $('#videoModalOv').style.display = 'none';
    $('#vidFrameWrap').innerHTML = ''; // detiene reproducción
  };

  window.logout = () => { Auth.logout(); location.href = '/'; };

  // Init
  applyFilters();
})();
