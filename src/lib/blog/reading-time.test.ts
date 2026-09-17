import { describe, expect, it } from 'vitest';
import { readingTime } from './reading-time';

describe('readingTime', () => {
  it('returns 1 minute for empty body', () => {
    expect(readingTime('')).toBe(1);
  });

  it('returns 1 minute for very short content', () => {
    expect(readingTime('Hello world')).toBe(1);
  });

  it('returns 1 minute for ~200 words at 200 wpm', () => {
    const body = Array(200).fill('word').join(' ');
    expect(readingTime(body)).toBe(1);
  });

  it('rounds up partial minutes', () => {
    const body = Array(250).fill('word').join(' ');
    expect(readingTime(body)).toBe(2);
  });

  it('returns 3 minutes for ~600 words', () => {
    const body = Array(600).fill('word').join(' ');
    expect(readingTime(body)).toBe(3);
  });

  it('strips markdown headings, links, code fences, and inline code from the count', () => {
    const md = `# Heading
## Sub
[link](https://example.com)
\`inline\`
\`\`\`ts
const ignored = 'this code block does not count toward reading time at all';
\`\`\`
A few real words here.`;
    // Real prose words: "A few real words here." = 5 words → still 1 minute.
    expect(readingTime(md)).toBe(1);
  });

  it('counts text inside link labels but not the URL', () => {
    // 100 link labels of "the link label" (3 words each) = 300 words → 2 minutes.
    const link = '[the link label](https://example.com/some/path/that/should/not/count)';
    const body = Array(100).fill(link).join(' ');
    expect(readingTime(body)).toBe(2);
  });
});
