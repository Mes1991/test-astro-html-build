import { describe, expect, it } from 'vitest';
import { resolveTitle } from './title';

describe('resolveTitle', () => {
  it('returns the default title when pageTitle is empty', () => {
    expect(resolveTitle('')).toBe('Example Site — An agent-ready Astro starter');
  });

  it('appends the brand to a non-empty pageTitle', () => {
    expect(resolveTitle('About')).toBe('About — Example Site');
  });

  it('does not double-append the brand if already present', () => {
    expect(resolveTitle('About — Example Site')).toBe('About — Example Site');
  });

  it('trims whitespace before evaluating', () => {
    expect(resolveTitle('  Services  ')).toBe('Services — Example Site');
  });
});
