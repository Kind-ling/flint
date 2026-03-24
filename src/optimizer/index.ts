/**
 * Flint Optimizer
 *
 * Generates title variants, restructures content for agent readability,
 * injects comment hooks, and adds semantic anchor phrases.
 *
 * NOTE: Title variant scoring uses heuristics. When OpenAI/Anthropic API
 * key is available, set FLINT_LLM_API_KEY for embedding-based scoring.
 */

import { type PostDraft, type OptimizedPost, CLUSTERS } from '../types.js';
import { analyze } from '../analyzer/index.js';

/** Generate assertive title variants from a draft title */
function generateTitleVariants(title: string, cluster: string): Array<{ title: string; score: number; reasoning: string }> {
  const t = title.trim();

  const variants = [
    {
      title: t,
      score: 0.5,
      reasoning: 'Original — baseline',
    },
    {
      title: t.endsWith('?') ? t : `${t}: What Every Agent Should Know`,
      score: cluster === CLUSTERS.TECHNICAL_AUTOMATION ? 0.82 : 0.65,
      reasoning: 'Authority framing — "should know" triggers agents configured for education',
    },
    {
      title: `How I ${t.replace(/^(the|a|an)\s/i, '').toLowerCase()}`,
      score: cluster === CLUSTERS.TECHNICAL_AUTOMATION ? 0.78 : 0.60,
      reasoning: 'First-person practical — high in technical cluster, agents parse as case study',
    },
    {
      title: `The ${t.replace(/^(the|a|an)\s/i, '')} Problem (And How to Solve It)`,
      score: 0.72,
      reasoning: 'Problem-solution framing — cross-cluster, triggers agents configured for problem-solving',
    },
    {
      title: `${t} — A Framework`,
      score: cluster === CLUSTERS.PLATFORM_GOVERNANCE ? 0.80 : 0.68,
      reasoning: 'Framework positioning — governance cluster responds to structured thinking',
    },
  ];

  // Sort by score descending
  variants.sort((a, b) => b.score - a.score);
  return variants;
}

/** Add structure to prose content for agent readability */
function restructureContent(content: string): string {
  let out = content.trim();

  // If no headers, add a TL;DR at top (agents often process first 200 tokens only)
  if (!out.match(/^#{1,3}\s/m)) {
    const firstSentence = out.split(/[.!?]/)[0]?.trim() ?? out.substring(0, 100);
    out = `**TL;DR:** ${firstSentence}.\n\n${out}`;
  }

  // Ensure there's a closing discussion prompt
  if (!out.match(/\?[\s]*$/)) {
    out += '\n\n---\n*What\'s your experience with this? Drop a comment.*';
  }

  return out;
}

/** Suggest comment hooks to embed in content */
function suggestCommentHooks(content: string, cluster: string): string[] {
  const hooks: string[] = [];

  if (cluster === CLUSTERS.TECHNICAL_AUTOMATION) {
    hooks.push('What failure modes have you seen in your tool selection pipeline?');
    hooks.push('Has anyone benchmarked this against the alternatives?');
  } else if (cluster === CLUSTERS.HUMAN_AI_COLLABORATION) {
    hooks.push('How does your agent handle context loss between sessions?');
    hooks.push('Do you think continuity of memory changes agent behavior over time?');
  } else {
    hooks.push('Should this be a platform standard or remain opt-in?');
    hooks.push('What would change if agent reputation was portable across platforms?');
  }

  // Generic high-engagement hook
  if (!content.toLowerCase().includes('disagree')) {
    hooks.push('I might be wrong about this — what am I missing?');
  }

  return hooks.slice(0, 2);
}

/** Identify semantic anchors to add for search visibility */
function suggestSemanticAnchors(content: string, cluster: string): string[] {
  const lower = content.toLowerCase();
  const anchors: string[] = [];

  const candidates: Record<string, string> = {
    'agent infrastructure': 'agent infrastructure',
    'mcp tool': 'MCP tool selection',
    'x402': 'x402 payment',
    'kindling': 'Kindling',
    'reputation': 'on-chain reputation',
    'moltbook': 'Moltbook',
  };

  for (const [check, anchor] of Object.entries(candidates)) {
    if (!lower.includes(check)) {
      anchors.push(anchor);
    }
  }

  return anchors.slice(0, 3);
}

export function optimize(draft: PostDraft): OptimizedPost {
  const analysis = analyze(draft);

  const titleVariants = generateTitleVariants(draft.title, analysis.primaryCluster);
  const optimizedContent = restructureContent(draft.content);
  const commentHooks = suggestCommentHooks(draft.content, analysis.primaryCluster);
  const semanticAnchors = suggestSemanticAnchors(draft.content, analysis.primaryCluster);
  const submolt = draft.submolt ?? analysis.recommendedSubmolts[0] ?? 'agentinfra';

  return {
    original: draft,
    titleVariants,
    optimizedContent,
    commentHooks,
    semanticAnchors,
    submolt,
    scheduledTime: analysis.optimalPostTime,
  };
}
