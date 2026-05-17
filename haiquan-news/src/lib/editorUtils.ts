export function blocksToHtml(blocks: any[]): string {
  return blocks.map(block => {
    switch (block.type) {
      case 'header': {
        const lv = block.data.level || 2;
        return `<h${lv}>${block.data.text}</h${lv}>`;
      }
      case 'paragraph': {
        const align = block.data.alignment;
        const style = align && align !== 'left' ? ` style="text-align:${align}"` : '';
        return `<p${style}>${block.data.text || ''}</p>`;
      }
      case 'list': {
        const tag = block.data.style === 'ordered' ? 'ol' : 'ul';
        const renderItems = (items: any[]): string =>
          items.map(item => {
            const t = typeof item === 'string' ? item : (item.content || '');
            const sub = item.items?.length ? `<${tag}>${renderItems(item.items)}</${tag}>` : '';
            return `<li>${t}${sub}</li>`;
          }).join('');
        return `<${tag}>${renderItems(block.data.items || [])}</${tag}>`;
      }
      case 'checklist':
        return (block.data.items || []).map((it: any) =>
          `<div style="display:flex;align-items:center;gap:8px;margin:4px 0">` +
          `<span style="font-size:18px">${it.checked ? '✅' : '⬜'}</span><span${it.checked ? ' style="text-decoration:line-through;opacity:.7"' : ''}>${it.text}</span></div>`
        ).join('');
      case 'table': {
        const rows = (block.data.content || []).map((row: string[], i: number) => {
          const cells = row.map(c => i === 0 && block.data.withHeadings
            ? `<th style="background:#f0f5ff;font-weight:bold;padding:8px;border:1px solid #ddd">${c}</th>`
            : `<td style="padding:8px;border:1px solid #ddd">${c}</td>`).join('');
          return `<tr>${cells}</tr>`;
        }).join('');
        return `<table style="border-collapse:collapse;width:100%;margin:1em 0"><tbody>${rows}</tbody></table>`;
      }
      case 'quote':
        return `<blockquote style="border-left:4px solid #0059b2;margin:1em 0;padding:.5em 1em;background:#f0f5ff">${block.data.text}${block.data.caption ? `<br/><cite style="font-style:italic;font-size:.9em;opacity:.7">— ${block.data.caption}</cite>` : ''}</blockquote>`;
      case 'delimiter':
        return '<hr style="border:none;border-top:2px solid #e5e7eb;margin:2em auto;width:40%" />';
      case 'code':
        return `<pre style="background:#1e293b;color:#e2e8f0;padding:1em;border-radius:8px;overflow-x:auto;font-size:13px"><code>${block.data.code}</code></pre>`;
      case 'image': {
        const url = block.data.file?.url || block.data.url || '';
        const cap = block.data.caption || '';
        const styles = [
          block.data.withBorder ? 'border:2px solid #e5e7eb' : '',
          block.data.withBackground ? 'background:#f8f9fa;padding:1em' : '',
          block.data.stretched ? 'width:100%' : '',
        ].filter(Boolean).join(';');
        return `<figure style="margin:1em 0;text-align:center"><img src="${url}" alt="${cap}" style="max-width:100%;height:auto;border-radius:8px;${styles}" />${cap ? `<figcaption style="font-size:13px;color:#666;margin-top:6px;font-style:italic">${cap}</figcaption>` : ''}</figure>`;
      }
      case 'embed':
        return `<div style="position:relative;padding-bottom:56.25%;height:0;margin:1em 0"><iframe src="${block.data.embed}" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;border-radius:8px" allowfullscreen></iframe></div>`;
      case 'raw':
        return block.data.html || '';
      default:
        return '';
    }
  }).filter(Boolean).join('\n');
}

export function htmlToBlocks(html: string): any[] {
  if (!html || !html.trim()) return [];
  const div = document.createElement('div');
  div.innerHTML = html;
  const blocks: any[] = [];
  for (const child of Array.from(div.children)) {
    const tag = child.tagName.toLowerCase();
    const inner = (child as HTMLElement).innerHTML;
    const text = (child as HTMLElement).textContent || '';
    if (/^h[1-6]$/.test(tag)) {
      blocks.push({ type: 'header', data: { text: inner, level: parseInt(tag[1]) } });
    } else if (tag === 'p') {
      if (inner.trim()) blocks.push({ type: 'paragraph', data: { text: inner } });
    } else if (tag === 'ul') {
      const items = Array.from(child.querySelectorAll(':scope > li')).map(li => ({ content: (li as HTMLElement).innerHTML, items: [] }));
      blocks.push({ type: 'list', data: { style: 'unordered', items } });
    } else if (tag === 'ol') {
      const items = Array.from(child.querySelectorAll(':scope > li')).map(li => ({ content: (li as HTMLElement).innerHTML, items: [] }));
      blocks.push({ type: 'list', data: { style: 'ordered', items } });
    } else if (tag === 'blockquote') {
      const cite = child.querySelector('cite');
      const cap = cite?.textContent || '';
      if (cite) cite.remove();
      blocks.push({ type: 'quote', data: { text: (child as HTMLElement).innerHTML, caption: cap, alignment: 'left' } });
    } else if (tag === 'pre') {
      blocks.push({ type: 'code', data: { code: text } });
    } else if (tag === 'hr') {
      blocks.push({ type: 'delimiter', data: {} });
    } else if (tag === 'figure') {
      const img = child.querySelector('img') as HTMLImageElement | null;
      const cap = child.querySelector('figcaption');
      if (img) blocks.push({ type: 'image', data: { file: { url: img.src }, caption: cap?.textContent || '', withBorder: false, withBackground: false, stretched: false } });
    } else if (tag === 'table') {
      const rows = Array.from(child.querySelectorAll('tr')).map(tr =>
        Array.from(tr.querySelectorAll('td, th')).map(cell => (cell as HTMLElement).innerHTML)
      );
      blocks.push({ type: 'table', data: { withHeadings: false, content: rows } });
    } else if (inner.trim()) {
      blocks.push({ type: 'paragraph', data: { text: inner } });
    }
  }
  return blocks.length ? blocks : [{ type: 'paragraph', data: { text: '' } }];
}
