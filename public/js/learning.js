// /js/learning.js
(() => {
  'use strict';
  Auth.protect?.();

  const $  = (s, r=document)=> r.querySelector(s);
  const $$ = (s, r=document)=> [...r.querySelectorAll(s)];

  // Helpers
  const getId = (item) => {
    if (item.youtubeId) return item.youtubeId;
    if (!item.url) return null;
    try {
      const u = new URL(item.url);
      if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
      if (u.searchParams.get('v')) return u.searchParams.get('v');
    } catch {}
    return null;
  };

  const thumb = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  const ytWatch = (id) => `https://www.youtube.com/watch?v=${id}`;
  const ytEmbed = (id, {autoplay=1, mute=1}={}) =>
    `https://www.youtube.com/embed/${id}?autoplay=${autoplay}&mute=${mute}&playsinline=1&rel=0&modestbranding=1&controls=1`;

  // Filtros
  const VIDEOS = (window.VIDEOS || [])
    .map(v => ({...v, id: getId(v)}))
    .filter(v => v.id);

  const tagSelect = $('#vTag');
  const searchIn  = $('#vSearch');
  const grid      = $('#videoGrid');

  // Poblar tags únicas
  const ALL_TAGS = [...new Set(VIDEOS.flatMap(v => v.tags || []))];
  tagSelect.innerHTML =
    `<option value="">Todos los temas</option>` +
    ALL_TAGS.map(t => `<option value="${t}">${t}</option>`).join('');

  // Render
  function cardTpl(v){
    const tags = (v.tags || []).map(t => `<span class="pill">${t}</span>`).join('');
    return `
      <article class="video-card" data-id="${v.id}" data-tags="${(v.tags||[]).join(',').toLowerCase()}">
        <div class="ratio-16x9">
          <div class="video-thumb" data-ytid="${v.id}">
            <img loading="lazy" src="${thumb(v.id)}" alt="${(v.title||'Video')}" />
            <div class="overlay"></div>
            <button class="play-badge" data-action="open-modal">Ver aquí</button>
          </div>
        </div>
        <div class="video-info">
          <h3 title="${v.title||''}">${v.title||''}</h3>
          <p>${v.channel || ''}</p>
          <div class="tags">${tags}</div>
          <div class="video-actions">
            <a class="secondary small" href="${ytWatch(v.id)}" target="_blank" rel="noopener">Abrir en YouTube</a>
          </div>
        </div>
      </article>`;
  }

  function render(list){
    if (!grid) return;
    grid.innerHTML = list.map(cardTpl).join('') || '<div class="muted">No hay videos para mostrar.</div>';
    wireCards();
  }

  // Filtro por texto + tag
  function applyFilters(){
    const q = (searchIn.value || '').toLowerCase().trim();
    const tag = (tagSelect.value || '').toLowerCase().trim();

    const out = VIDEOS.filter(v => {
      const hayQ = !q || [v.title, v.channel, (v.tags||[]).join(' ')].join(' ').toLowerCase().includes(q);
      const hayT = !tag || (v.tags||[]).map(t => t.toLowerCase()).includes(tag);
      return hayQ && hayT;
    });
    render(out);
  }

  searchIn?.addEventListener('input', applyFilters);
  tagSelect?.addEventListener('change', applyFilters);

  // Preview en hover (muted) y modal
  function wireCards(){
    // polyfill de aspect-ratio si hace falta
    if (!CSS.supports?.('aspect-ratio: 16/9')){
      $$('.ratio-16x9').forEach(el => el.dataset.polyfill = '1');
    }

    $$('.video-thumb').forEach(box => {
      let timer=null, hasIframe=false;
      const id = box.dataset.ytid;

      const makeIframe = () => {
        if (hasIframe) return;
        hasIframe = true;
        box.innerHTML = `
          <iframe
            src="${ytEmbed(id,{autoplay:1,mute:1})}"
            title="YouTube preview"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowfullscreen
            style="width:100%;height:100%;border:0"></iframe>`;
      };
      const showPreview = () => { timer = setTimeout(makeIframe, 180); };
      const hidePreview = () => {
        clearTimeout(timer); timer=null; hasIframe=false;
        // restaurar miniatura + botón
        box.innerHTML = `
          <img loading="lazy" src="${thumb(id)}" alt="Miniatura"/>
          <div class="overlay"></div>
          <button class="play-badge" data-action="open-modal">Ver aquí</button>`;
      };

      // Hover (solo desktop); en móviles no hay hover → el click abre modal
      box.addEventListener('mouseenter', showPreview);
      box.addEventListener('mouseleave', hidePreview);

      // Abrir modal desde el botón "Ver aquí"
      box.addEventListener('click', (e)=>{
        const btn = e.target.closest('[data-action="open-modal"]');
        if (!btn) return;
        const art = box.closest('.video-card');
        const vid = art?.dataset.id;
        const v   = VIDEOS.find(x=>x.id===vid);
        if (v) openVideoModal(v);
      });
    });
  }

  // Modal
  function openVideoModal(v){
    $('#vidTitle').textContent = v.title || 'Reproduciendo…';
    $('#ytLink').href = ytWatch(v.id);
    const wrap = $('#vidFrameWrap');
    wrap.innerHTML = `
      <iframe
        src="${ytEmbed(v.id,{autoplay:1,mute:0})}"
        title="${(v.title||'Video')}"
        allow="autoplay; encrypted-media; picture-in-picture"
        allowfullscreen
        style="width:100%;height:100%;border:0"></iframe>`;
    $('#videoModalOv').style.display = 'flex';
  }
  window.closeVideoModal = () => {
    $('#videoModalOv').style.display = 'none';
    $('#vidFrameWrap').innerHTML = ''; // detiene reproducción
  };

  // Logout global (mismo patrón que el resto del sitio)
  window.logout = () => { Auth.logout(); location.href='/'; };

  // inicio
  applyFilters();
})();
