export const typeLabels = { links: 'Seznam odkazů', link: 'Odkaz', video: 'Video', text: 'Poznámka', document: 'Dokument', repository: 'Repozitář', other: 'Ostatní' };
export const colors = ['purple', 'blue', 'green', 'orange', 'pink'];
export const isLocalAsset = value => typeof value === 'string' && /^assets\/[a-f0-9-]{36}\.(jpg|png|pdf)$/.test(value);
export function safeUrl(value) { if (isLocalAsset(value)) return true; try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password; } catch { return false; } }
const obj = v => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v, max = 1000) => typeof v === 'string' && v.length <= max;
const list = v => Array.isArray(v) && v.length <= 100 && v.every(s => str(s, 150) && s.trim());
const date = v => str(v, 50) && /^\d{4}-\d{2}-\d{2}T/.test(v) && Number.isFinite(Date.parse(v));
export function validateContent(value) {
  if (!obj(value) || !Array.isArray(value.boards) || !Array.isArray(value.posts) || value.boards.length > 100 || value.posts.length > 10000) throw new Error('Neplatný formát dat.');
  const ids = new Set();
  const boards = value.boards.map(b => {
    if (!obj(b) || !str(b.id, 80) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(b.id) || ids.has(b.id) || !str(b.title, 150) || !b.title.trim() || !str(b.description, 2000) || !str(b.year, 80) || !str(b.schoolYear, 30) || typeof b.active !== 'boolean' || !colors.includes(b.color) || !str(b.icon, 30)) throw new Error('Neplatná nebo duplicitní nástěnka.');
    ids.add(b.id);
    return { id: b.id, title: b.title.trim(), description: b.description, year: b.year, schoolYear: b.schoolYear, active: b.active, color: b.color, icon: b.icon };
  });
  const postIds = new Set();
  const posts = value.posts.map(p => {
    if (!obj(p) || !str(p.id, 100) || !/^[a-zA-Z0-9-]+$/.test(p.id) || postIds.has(p.id) || !str(p.title, 250) || !p.title.trim() || !str(p.description, 20000) || !Object.hasOwn(typeLabels, p.type) || !list(p.tags) || !list(p.boards) || !p.boards.length || p.boards.some(id => id !== '*' && !ids.has(id)) || (p.boards.includes('*') && p.boards.length !== 1) || !['small', 'medium', 'large'].includes(p.size) || typeof p.published !== 'boolean' || !date(p.publishedAt) || !date(p.createdAt) || (p.updatedAt !== undefined && !date(p.updatedAt)) || (p.url !== undefined && (!str(p.url, 4000) || !safeUrl(p.url))) || (p.image !== undefined && (!str(p.image, 4000) || !safeUrl(p.image))) || (!['text','links'].includes(p.type) && !p.url) || (p.type === 'text' && p.url)) throw new Error('Neplatný příspěvek: zkontrolujte název, URL, datum a nástěnky.');
    if (p.type === 'links' && (p.url || !Array.isArray(p.links) || !p.links.length || p.links.length > 100 || p.links.some(l => !obj(l) || !str(l.title,250) || !l.title.trim() || !str(l.url,4000) || !safeUrl(l.url) || isLocalAsset(l.url)))) throw new Error('Doplňte název a platnou HTTP/HTTPS adresu každého odkazu (nejvýše 100).');
    if (p.expanded !== undefined && typeof p.expanded !== 'boolean') throw new Error('Neplatná volba zobrazení textu.');
    postIds.add(p.id);
    return { id: p.id, title: p.title.trim(), description: p.description, ...(p.url ? { url: p.url } : {}), ...(p.image ? { image: p.image } : {}), ...(p.type === 'links' ? {links:p.links.map(l => ({title:l.title.trim(),url:l.url.trim()}))} : {}), ...(p.expanded === true ? {expanded:true} : {}), type: p.type, tags: [...new Set(p.tags)], boards: [...new Set(p.boards)], size: p.size, published: p.published, publishedAt: p.publishedAt, createdAt: p.createdAt, ...(p.updatedAt ? { updatedAt: p.updatedAt } : {}) };
  });
  return { boards, posts };
}
export function publicContent(content) {
  const boards = content.boards.filter(b => b.active);
  const ids = new Set(boards.map(b => b.id));
  return { boards, posts: content.posts.filter(p => p.published && (p.boards.includes('*') || p.boards.some(id => ids.has(id)))).map(p => ({ ...p, boards: p.boards.includes('*') ? ['*'] : p.boards.filter(id => ids.has(id)) })) };
}
export function boardPosts(posts, id) { return posts.filter(p => p.published && (!id || p.boards.includes('*') || p.boards.includes(id))).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt) || a.id.localeCompare(b.id)); }
export const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('cs');
const host = (hostname, domain) => hostname === domain || hostname.endsWith(`.${domain}`);
const providers = [
  { matches: u => ['youtube.com', 'youtu.be', 'youtube-nocookie.com'].some(d => host(u.hostname, d)), resolve: u => {
    const id = host(u.hostname, 'youtu.be') ? u.pathname.split('/')[1] : u.searchParams.get('v') || (/^\/(shorts|embed|live)\//.test(u.pathname) ? u.pathname.split('/')[2] : '');
    const videoId = id && /^[\w-]{11}$/.test(id) ? id : undefined;
    return { name: 'YouTube', type: 'video', icon: 'video', videoId, image: videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : undefined };
  } },
  { matches: u => host(u.hostname, 'github.com'), resolve: u => ({ name: 'GitHub', type: 'repository', icon: 'github', suggestedTitle: u.pathname.split('/').filter(Boolean).slice(0, 2).join(' / ') || 'GitHub' }) },
  { matches: u => ['teams.microsoft.com', 'teams.live.com', 'teams.cloud.microsoft'].some(d => host(u.hostname, d)), resolve: () => ({ name: 'Microsoft Teams', type: 'link', icon: 'teams' }) },
  { matches: u => ['docs.google.com', 'drive.google.com'].some(d => host(u.hostname, d)), resolve: () => ({ name: 'Google Docs / Drive', type: 'document', icon: 'document' }) },
  { matches: u => ['office.com', 'sharepoint.com', 'onedrive.live.com', '1drv.ms', 'microsoft365.com'].some(d => host(u.hostname, d)), resolve: () => ({ name: 'Microsoft 365', type: 'document', icon: 'document' }) },
  { matches: u => host(u.hostname, 'linkedin.com'), resolve: () => ({ name: 'LinkedIn', type: 'link', icon: 'link' }) },
  { matches: u => /\.(pdf|docx?|pptx?|xlsx?)$/i.test(u.pathname), resolve: () => ({ name: 'Dokument', type: 'document', icon: 'document' }) }
];
export function detectProvider(value) {
  if (isLocalAsset(value)) return { name: value.endsWith('.pdf') ? 'PDF' : 'Obrázek', type: 'document', icon: 'document' };
  if (!value) return { name: 'Poznámka učitele', type: 'text', icon: 'text' };
  try { const url = new URL(value); if (!safeUrl(value)) throw new Error(); return providers.find(p => p.matches(url))?.resolve(url) || { name: url.hostname.replace(/^www\./, ''), type: 'link', icon: 'link', suggestedTitle: url.hostname.replace(/^www\./, '') }; }
  catch { return { name: 'Odkaz', type: 'link', icon: 'link' }; }
}
export function filterPosts(posts, boardId, query = '', tag = '', type = '') {
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  return boardPosts(posts, boardId).filter(p => (!tag || p.tags.includes(tag)) && (!type || p.type === type) && terms.every(term => normalize([p.title, p.description, ...(p.links || []).flatMap(l => [l.title,l.url]), ...p.tags, p.type, typeLabels[p.type], detectProvider(p.url).name].join(' ')).includes(term)));
}
