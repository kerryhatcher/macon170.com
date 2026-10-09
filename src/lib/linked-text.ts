const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c] ?? c);

/** Render CMS plain text safely, making explicit web URLs clickable. */
export function renderLinkedText(value: string): string {
  let result = '';
  let cursor = 0;
  for (const match of value.matchAll(/\bhttps?:\/\/[^\s<>"']+/gi)) {
    const start = match.index;
    let candidate = match[0];
    // Sentence punctuation belongs to the prose; balanced URL parentheses stay.
    while (/[.,!?;:\])}]$/.test(candidate)) {
      const last = candidate.at(-1)!;
      const opener = { ')': '(', ']': '[', '}': '{' }[last];
      if (opener && candidate.split(last).length <= candidate.split(opener).length) break;
      candidate = candidate.slice(0, -1);
    }
    result += escapeHtml(value.slice(cursor, start));
    try {
      const url = new URL(candidate);
      result += '<a href="' + escapeHtml(url.href) + '">' + escapeHtml(candidate) + '</a>';
    } catch {
      result += escapeHtml(candidate);
    }
    cursor = start + candidate.length;
  }
  return (result + escapeHtml(value.slice(cursor))).replace(/\r?\n/g, '<br>');
}
