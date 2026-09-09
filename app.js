import { boardPosts, filterPosts, typeLabels, validateContent } from './shared/content.js';
import { escape, icon, postCard, bindMedia } from './shared/ui.js';
const base = new URL('./', import.meta.url).pathname;
const app = document.querySelector('#app');
let content;
let query = '', tag = '', type = '';
const boardId = () => location.pathname.slice(base.length).match(/^boards\/([^/]+)\/?(?:index.html)?$/)?.[1];
const boardUrl = id => `${base}boards/${id}/`;
const link = (id, label, cls = '') => `<a class="${cls}" href="${id ? boardUrl(id) : base}" data-board="${id || ''}">${label}</a>`;
function renderPage() {
  const id = boardId();
  document.querySelector('.skip-link').href = `${location.pathname}#main`;
  const board = content.boards.find(b => b.id === id);
  document.title = board ? `${board.title} · ${board.year} · Nástěnka` : 'Nástěnka · SPSŠOL';
  for (const [selector, value] of [['meta[name="description"]', board?.description || 'Studijní materiály k vyučovaným předmětům.'], ['meta[property="og:title"]', document.title], ['meta[property="og:description"]', board?.description || 'Studijní materiály k vyučovaným předmětům.']]) document.querySelector(selector)?.setAttribute('content', value);
  app.innerHTML = `<div class="app-shell"><header class="mobile-header">${link('', `<img src="${base}favicon.svg" alt="">Nástěnka`, 'brand')}<button class="icon-button" id="menu-toggle" aria-label="Otevřít navigaci" aria-expanded="false">${icon('menu')}</button></header><button class="menu-backdrop" id="menu-backdrop" aria-label="Zavřít navigaci" hidden></button><aside class="sidebar">${link('', `<img src="${base}favicon.svg" alt=""><span>Nástěnka<small>SPSŠOL · VÝUKOVÉ MATERIÁLY</small></span>`, 'brand')}<nav aria-label="Hlavní navigace">${link('', `${icon('grid')}Všechny materiály`, `nav-home ${!id ? 'active' : ''}`)}<div class="nav-caption">PŘEDMĚTY</div>${content.boards.map(b => link(b.id, `<span class="mini-icon tone-${b.color}">${icon(b.icon, 17)}</span><span>${escape(b.title)}<small>${escape(b.year)}</small></span>`, `nav-board ${id === b.id ? 'active' : ''}`)).join('')}</nav><div class="sidebar-bottom">${['127.0.0.1', 'localhost'].includes(location.hostname) ? '<a href="/editor/" class="editor-link">Otevřít editor ↗</a>' : ''}<span class="sidebar-copyright">SPSŠOL · Digitální nástěnka</span></div></aside><div class="main-shell"><div class="topbar"><span>Výuka <span class="crumb">/</span><strong>${board ? `${escape(board.title)} · ${escape(board.year)}` : 'Všechny materiály'}</strong></span></div><main id="main" tabindex="-1"><div class="page-heading"><div><p class="eyebrow">${board ? `${escape(board.year)} / ${escape(board.schoolYear)}` : 'VÝUKA'}</p><h1>${board ? escape(board.title) : 'Studijní materiály'}</h1><p class="lead">${escape(board?.description || 'Odkazy, dokumenty, videa a poznámky k vyučovaným předmětům.')}</p></div><span class="heading-icon tone-${board?.color || 'purple'}">${icon(board?.icon || 'book', 30)}</span></div>${id && !board ? '<div class="empty-state"><h2>Tato nástěnka není dostupná</h2><a href="' + base + '">Zpět na přehled</a></div>' : `<section class="feed-section" aria-labelledby="feed-heading"><div class="section-heading"><h2 id="feed-heading">${board ? 'Materiály na nástěnce' : 'Nejnovější příspěvky'} <span id="result-count"></span></h2><span>${icon('clock', 14)}Nejnovější nahoře</span></div><div class="search-row"><label class="search-field">${icon('search', 19)}<input id="search" type="search" aria-label="Hledat v materiálech" placeholder="${board ? 'Hledat na této nástěnce…' : 'Hledat ve všech materiálech…'}" value="${escape(query)}"></label><label class="filter-field">${icon('filter', 17)}<select id="type-filter" aria-label="Typ zdroje"><option value="">Všechny typy</option>${Object.entries(typeLabels).map(([key, label]) => `<option value="${key}" ${key === type ? 'selected' : ''}>${label}</option>`).join('')}</select></label></div><div class="tag-filter" id="tag-filter"></div><span class="sr-only" id="results-status" role="status"></span><div id="feed"></div></section>`}</main><footer>Studijní materiály<span>Mgr. Libor Čamek · SPSŠOL</span></footer></div></div>`;
  document.querySelectorAll('nav a.active').forEach(a => a.setAttribute('aria-current', 'page'));
  renderFeed();
}
function renderFeed() {
  if (!document.querySelector('#feed')) return;
  const posts = filterPosts(content.posts, boardId(), query, tag, type);
  const tags = [...new Set(boardPosts(content.posts, boardId()).flatMap(p => p.tags))].sort((a,b) => a.localeCompare(b, 'cs'));
  document.querySelector('#result-count').textContent = posts.length;
  document.querySelector('#results-status').textContent = `${posts.length} nalezených materiálů`;
  document.querySelector('#tag-filter').innerHTML = ['', ...tags].map(t => `<button data-tag="${escape(t)}" class="${tag === t ? 'selected' : ''}" aria-pressed="${tag === t}">${escape(t || 'Všechny štítky')}</button>`).join('');
  document.querySelector('#feed').innerHTML = posts.length ? `<div class="post-grid">${posts.map(p => postCard(p, { boards: content.boards })).join('')}</div>` : `<div class="empty-state">${icon('search', 30)}<h3>${query || tag || type ? 'Nebyly nalezeny žádné materiály' : 'Zatím nejsou vloženy žádné materiály'}</h3><p>${query || tag || type ? 'Zkuste jiné slovo nebo zrušte filtry.' : 'Až učitel přidá nový materiál, objeví se tady.'}</p>${query || tag || type ? '<button class="secondary-button" id="reset-filters">Zrušit filtry</button>' : ''}</div>`;
}
app.addEventListener('input', e => { if (e.target.id === 'search') { query = e.target.value; renderFeed(); } });
app.addEventListener('change', e => { if (e.target.id === 'type-filter') { type = e.target.value; renderFeed(); } });
app.addEventListener('click', e => {
  const nav = e.target.closest('[data-board]');
  if (nav && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0) { e.preventDefault(); history.pushState({}, '', nav.href); query = tag = type = ''; renderPage(); document.querySelector('#main').focus({ preventScroll: true }); window.scrollTo(0, 0); return; }
  const tagButton = e.target.closest('[data-tag]');
  if (tagButton) { tag = tagButton.dataset.tag; renderFeed(); document.querySelector('#tag-filter').querySelectorAll('button').forEach(b => { if (b.dataset.tag === tag) b.focus({ preventScroll: true }); }); }
  if (e.target.closest('#reset-filters')) { query = tag = type = ''; document.querySelector('#search').value = ''; document.querySelector('#type-filter').value = ''; renderFeed(); document.querySelector('#search').focus(); }
  if (e.target.closest('#menu-toggle, #menu-backdrop')) toggleMenu();
});
function toggleMenu(close = false) { const open = !close && !document.querySelector('.sidebar').classList.contains('is-open'); document.querySelector('.sidebar').classList.toggle('is-open', open); document.querySelector('#menu-toggle').setAttribute('aria-expanded', open); document.querySelector('#menu-backdrop').hidden = !open; }
document.addEventListener('keydown', e => { if (e.key === 'Escape' && content) toggleMenu(true); });
window.addEventListener('popstate', () => { query = tag = type = ''; renderPage(); });
bindMedia(app);
try { const response = await fetch(`${base}content.json`); if (!response.ok) throw new Error(); content = validateContent(await response.json()); renderPage(); }
catch { app.innerHTML = '<main class="empty-state"><h1>Nástěnky se nepodařilo načíst</h1><p>Zkontrolujte připojení a zkuste to znovu.</p><button id="retry" class="primary-button">Zkusit znovu</button></main>'; document.querySelector('#retry').onclick = () => location.reload(); }
