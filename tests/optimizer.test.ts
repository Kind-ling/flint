import { describe, it, expect } from 'vitest';
import { optimize } from '../src/optimizer/index.js';

describe('optimize', () => {
  const draft = {
    title: 'Building reliable agent tool pipelines',
    content: 'Tool selection is the hardest part of agent engineering. Here is what I learned after six months of production failures.',
  };

  it('returns 5 title variants', () => {
    const result = optimize(draft);
    expect(result.titleVariants.length).toBe(5);
  });

  it('all variants have scores between 0 and 1', () => {
    const result = optimize(draft);
    result.titleVariants.forEach(v => {
      expect(v.score).toBeGreaterThanOrEqual(0);
      expect(v.score).toBeLessThanOrEqual(1);
    });
  });

  it('variants are sorted by score descending', () => {
    const result = optimize(draft);
    for (let i = 1; i < result.titleVariants.length; i++) {
      expect(result.titleVariants[i - 1]!.score).toBeGreaterThanOrEqual(result.titleVariants[i]!.score);
    }
  });

  it('optimized content includes TL;DR when no headers', () => {
    const result = optimize(draft);
    expect(result.optimizedContent).toContain('TL;DR');
  });

  it('returns comment hooks', () => {
    const result = optimize(draft);
    expect(result.commentHooks.length).toBeGreaterThan(0);
  });

  it('uses provided submolt', () => {
    const result = optimize({ ...draft, submolt: 'mcp' });
    expect(result.submolt).toBe('mcp');
  });

  it('scheduled time is a valid future ISO string', () => {
    const result = optimize(draft);
    expect(() => new Date(result.scheduledTime)).not.toThrow();
  });
});
