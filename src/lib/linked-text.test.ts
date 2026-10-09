import { describe, expect, it } from 'vitest';
import { renderLinkedText } from './linked-text';

describe('CMS plain-text links', () => {
  it('links the Chehaw ticket address and preserves line breaks', () => {
    expect(renderLinkedText('Zoo prices are $5 to $8.\nSee https://chehaw.org/visit/51-tickets')).toBe(
      'Zoo prices are $5 to $8.<br>See <a href="https://chehaw.org/visit/51-tickets">https://chehaw.org/visit/51-tickets</a>',
    );
  });

  it('keeps surrounding punctuation outside links and balanced parentheses inside', () => {
    expect(renderLinkedText('(https://example.com/tickets). https://example.com/camp_(family)!')).toBe(
      '(<a href="https://example.com/tickets">https://example.com/tickets</a>). <a href="https://example.com/camp_(family)">https://example.com/camp_(family)</a>!',
    );
  });

  it('escapes markup and URL attributes while leaving unsupported schemes as text', () => {
    const html = renderLinkedText('<img src=x onerror=alert(1)> https://example.com/?a=1&b=2 javascript:alert(1)');
    expect(html).toBe(
      '&lt;img src=x onerror=alert(1)&gt; <a href="https://example.com/?a=1&amp;b=2">https://example.com/?a=1&amp;b=2</a> javascript:alert(1)',
    );
  });

  it('leaves malformed addresses as text', () => {
    expect(renderLinkedText('See https:// and http://.')).toBe('See https:// and http://.');
  });
});
