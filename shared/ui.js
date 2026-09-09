import { detectProvider, safeUrl } from './content.js';
export const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const paths = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  code: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-14-2 16"/>',
  terminal: '<rect x="2" y="3" width="20" height="18" rx="3"/><path d="m6 8 4 4-4 4m7 0h5"/>',
  braces: '<path d="M8 3H6a2 2 0 0 0-2 2v4l-2 3 2 3v4a2 2 0 0 0 2 2h2m8-18h2a2 2 0 0 1 2 2v4l2 3-2 3v4a2 2 0 0 1-2 2h-2"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  sparkles: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3ZM21 2v4m-2-2h4"/>',
  search: '<circle cx="10.5" cy="10.5" r="7.5"/><path d="m16 16 5 5"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  external: '<path d="M7 17 17 7M7 7h10v10"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  book: '<path d="M12 5v16M12 5C8 2 4 3 2 4v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-2-1-6-2-10 1Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  filter: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2" fill="currentColor"/><circle cx="16" cy="12" r="2" fill="currentColor"/><circle cx="10" cy="18" r="2" fill="currentColor"/>',
  text: '<path d="M14 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-9L14 3Z"/><path d="M14 3v7h7M7 14h10M7 17h6"/>',
  video: '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3Z"/>',
  github: '<path d="M9 19c-4 1-4-2-6-2m12 5v-4c0-1-.3-2-1-2 4-.5 6-2 6-6 0-1-.5-3-1.5-4 0-1 0-2-.5-3-2 0-3 1-4 1a14 14 0 0 0-5 0C8 3 7 3 5 3c-.5 1-.5 2-.5 3C3.5 7 3 9 3 10c0 4 2 5.5 6 6-.7.5-1 1-1 2v4"/>',
  link: '<path d="m10 13 4-4m-6 6-2 2a3 3 0 0 1-4-4l5-5a3 3 0 0 1 4 0m2 3a3 3 0 0 0 4 0l5-5a3 3 0 0 0-4-4l-2 2"/>',
  document: '<path d="M14 2H5v20h14V7l-5-5Z"/><path d="M14 2v6h5M8 12h8m-8 4h8"/>',
  teams: '<circle cx="9" cy="7" r="3"/><circle cx="18" cy="8" r="2"/><path d="M2 21v-4a7 7 0 0 1 14 0v4m2-8a4 4 0 0 1 4 4v4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  edit: '<path d="m15 4 5 5M3 21l5-1L21 7a3.5 3.5 0 0 0-5-5L3 15v6Z"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'
};
export function icon(name, size = 20) { return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.link}</svg>`; }
export function postCard(post, { tags = true, boards = [] } = {}) {
  const provider = detectProvider(post.url);
  const image = post.image || provider.image;
  const title = escape(post.title);
  const subjects = post.boards.includes('*')
    ? '<span class="post-subject tone-purple">Všechny předměty</span>'
    : boards.filter(board => post.boards.includes(board.id)).map(board => `<span class="post-subject tone-${escape(board.color)}">${escape(board.title)} · ${escape(board.year)}</span>`).join('');
  const subjectLabels = subjects ? `<div class="post-subjects" aria-label="Předměty">${subjects}</div>` : '';
  const picture = image && safeUrl(image) && post.size !== 'small' ? `<div class="post-image"><img src="${escape(image)}" alt="" loading="lazy" referrerpolicy="no-referrer">${provider.videoId ? `<button class="play-button" data-play="${provider.videoId}" aria-label="Přehrát ${title}">▶</button><span class="video-label">VIDEO</span>` : ''}</div>` : '';
  return `<article class="post-card size-${escape(post.size)} ${post.type === 'text' ? 'note-card' : ''}">${picture}<div class="post-body"><div class="post-meta"><span class="provider provider-${provider.icon}">${icon(provider.icon, 16)}${escape(provider.name)}</span><time datetime="${escape(post.publishedAt)}">${new Intl.DateTimeFormat('cs', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(post.publishedAt))}</time></div>${subjectLabels}<h3>${post.url && safeUrl(post.url) ? `<a href="${escape(post.url)}" target="_blank" rel="noopener noreferrer">${title}${icon('external', 18)}</a>` : title}</h3>${post.description ? `<p class="post-description">${escape(post.description)}</p>` : ''}<div class="post-tags">${post.tags.map(t => tags ? `<button data-tag="${escape(t)}">#${escape(t)}</button>` : `<span>#${escape(t)}</span>`).join('')}</div></div></article>`;
}
export function bindMedia(root) {
  root.addEventListener('error', e => { if (e.target instanceof HTMLImageElement) e.target.closest('.post-image')?.classList.add('image-failed'); }, true);
  root.addEventListener('click', e => {
    const button = e.target.closest('[data-play]');
    if (!button || !/^[\w-]{11}$/.test(button.dataset.play)) return;
    const wrap = button.closest('.post-image');
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${button.dataset.play}?autoplay=1`;
    iframe.title = button.getAttribute('aria-label'); iframe.allow = 'autoplay; encrypted-media; picture-in-picture'; iframe.allowFullscreen = true; iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    wrap.replaceChildren(iframe);
  });
}
