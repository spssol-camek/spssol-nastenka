// Deliberately limited Markdown: raw HTML is always rendered as text.
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function inline(s, depth = 0) {
  if (depth > 4) return esc(s);
  const token = /`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let result = '', end = 0;
  for (const m of s.matchAll(token)) {
    result += esc(s.slice(end,m.index)); end = m.index+m[0].length;
    if (m[1]) result += `<code>${esc(m[1])}</code>`;
    else if (m[2]) {
      let valid=false; try { const u=new URL(m[3]); valid=!u.username&&!u.password; } catch {}
      result += valid ? `<a href="${esc(m[3])}" target="_blank" rel="noopener noreferrer">${inline(m[2],depth+1)}</a>` : esc(m[0]);
    } else if (m[4]) result += `<strong>${inline(m[4],depth+1)}</strong>`;
    else result += `<em>${inline(m[5],depth+1)}</em>`;
  }
  return result+esc(s.slice(end));
}
const cells = line => line.trim().replace(/^\|/,'').replace(/\|$/,'').split(/(?<!\\)\|/).map(s=>s.trim().replace(/\\\|/g,'|'));
const separator = line => line.includes('|') && cells(line).every(c=>/^:?-{3,}:?$/.test(c));
export function renderMarkdown(text) {
  const lines=text.replace(/\r\n?/g,'\n').split('\n'); const out=[];
  for(let i=0;i<lines.length;) {
    const line=lines[i];
    if (!line.trim()) {i++;continue;}
    if (/^\s*```/.test(line)) {
      const code=[]; i++; while(i<lines.length&&!/^\s*```/.test(lines[i])) code.push(lines[i++]);
      if(i<lines.length)i++; out.push(`<pre><code>${esc(code.join('\n'))}</code></pre>`);continue;
    }
    if (i+1<lines.length && line.includes('|') && separator(lines[i+1])) {
      const headers=cells(line); i+=2; const rows=[];
      while(i<lines.length&&lines[i].includes('|')&&lines[i].trim()) rows.push(cells(lines[i++]));
      out.push(`<div class="table-scroll" tabindex="0" role="region" aria-label="Tabulka"><table><thead><tr>${headers.map(h=>`<th scope="col">${inline(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${headers.map((_,j)=>`<td>${inline(row[j]||'')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);continue;
    }
    const heading=line.match(/^(#{1,6})\s+(.+)$/);
    if(heading){const level=Math.min(6,heading[1].length+3);out.push(`<h${level}>${inline(heading[2])}</h${level}>`);i++;continue;}
    if (/^\s*([-*+] |\d+\. )/.test(line)) {
      const ordered=/^\s*\d+\./.test(line), kind=ordered?'ol':'ul', items=[];
      const pattern=ordered?/^\s*\d+\.\s+(.+)$/:/^\s*[-*+]\s+(.+)$/;
      while(i<lines.length){const m=lines[i].match(pattern);if(!m)break;items.push(`<li>${inline(m[1])}</li>`);i++;}
      out.push(`<${kind}>${items.join('')}</${kind}>`);continue;
    }
    out.push(`<p>${inline(line)}</p>`);i++;
  }
  return out.join('');
}
