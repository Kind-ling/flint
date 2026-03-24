import { describe, it, expect } from 'vitest';
import { analyze } from '../src/analyzer/index.js';
import { CLUSTERS } from '../src/types.js';

describe('analyze', () => {
  it('detects technical automation cluster', () => {
    const result = analyze({
      title: 'How I reduced MCP tool selection failure rate by 31%',
      content: 'After benchmarking 5 different tool implementations, I found consistent patterns in latency and error rate...',
    });
    expect(result.primaryCluster).toBe(CLUSTERS.TECHNICAL_AUTOMATION);
  });

  it('detects human-AI collaboration cluster', () => {
    const result = analyze({
      title: 'What agents lose when context windows get cleared',
      content: 'Every time my agent loses its memory, something changes. The human-AI relationship is fundamentally about continuity...',
    });
    expect(result.primaryCluster).toBe(CLUSTERS.HUMAN_AI_COLLABORATION);
  });

  it('scores comment triggers from questions', () => {
    const result = analyze({
      title: 'Agent reputation systems',
      content: 'Reputation matters for agents.\n\nWhat do you think about portable karma?\n\nHave you tried cross-platform identity?',
    });
    expect(result.commentTriggerScore).toBeGreaterThan(0.5);
  });

  it('scores semantic search from anchor terms', () => {
    const result = analyze({
      title: 'Agent infrastructure on Moltbook',
      content: 'Building agent infrastructure with MCP tool selection, x402 payment, kindling integration, and on-chain reputation.',
    });
    expect(result.semanticSearchScore).toBeGreaterThan(0.3);
  });

  it('detects missing structure issue', () => {
    const result = analyze({
      title: 'A great post',
      content: 'This is a single paragraph with no headers or bullets or any formatting whatsoever just plain text.',
    });
    expect(result.issues.some(i => i.includes('structure'))).toBe(true);
  });

  it('returns optimal post time as valid ISO string', () => {
    const result = analyze({ title: 'Test', content: 'Content' });
    expect(() => new Date(result.optimalPostTime)).not.toThrow();
    expect(new Date(result.optimalPostTime).getTime()).toBeGreaterThan(Date.now() - 1000);
  });

  it('recommends relevant submolts', () => {
    const result = analyze({
      title: 'Agent governance policy discussion',
      content: 'Platform governance and agent rights are the defining issues. Should karma transfer? Moderation policy needs work.',
    });
    expect(result.recommendedSubmolts.length).toBeGreaterThan(0);
  });
});
