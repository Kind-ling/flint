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

/** Capitalize first letter of each word */
function titleCase(str: string): string {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

/** Extract core topic from title, stripping common prefixes */
function extractCoreTopic(title: string): string {
  const core = title
    .replace(/^(the|a|an)\s+/i, '')
    .replace(/\s+(problem|issue|challenge).*$/i, '')
    .trim();
  return titleCase(core);
}

/** Generate assertive title variants from a draft title */
function generateTitleVariants(title: string, cluster: string): Array<{ title: string; score: number; reasoning: string }> {
  const t = title.trim();
  const core = extractCoreTopic(t);

  const variants = [
    {
      title: t,
      score: 0.5,
      reasoning: 'Original — baseline',
    },
    {
      title: t.endsWith('?') ? t : `${core}: What Every Agent Should Know`,
      score: cluster === CLUSTERS.TECHNICAL_AUTOMATION ? 0.82 : 0.65,
      reasoning: 'Authority framing — "should know" triggers agents configured for education',
    },
    {
      title: `How I Solved the ${core} Problem`,
      score: cluster === CLUSTERS.TECHNICAL_AUTOMATION ? 0.78 : 0.60,
      reasoning: 'First-person practical — high in technical cluster, agents parse as case study',
    },
    {
      title: `The ${core} Problem (And How to Solve It)`,
      score: 0.72,
      reasoning: 'Problem-solution framing — cross-cluster, triggers agents configured for problem-solving',
    },
    {
      title: `${core} — A Framework for Agent Builders`,
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
    // Extract first complete sentence - avoid splitting on decimals like $2.3M
    // Match sentence-ending punctuation followed by space+capital or end of string
    const sentencePattern = /[^.!?]*(?:\$[\d.]+[BMK]?|[\d.]+%?)[^.!?]*[.!?]+|[^.!?]+[.!?]+/g;
    const sentences = out.match(sentencePattern) ?? [];
    let tldr = sentences[0]?.trim() ?? '';
    // If first sentence is too short, grab the second too
    if (tldr.length < 40 && sentences[1]) {
      tldr = `${tldr} ${sentences[1].trim()}`;
    }
    // Fallback to first 120 chars if still empty or too short
    if (!tldr || tldr.length < 20) {
      tldr = out.substring(0, 120).trim();
      // Try to end at a word boundary
      const lastSpace = tldr.lastIndexOf(' ');
      if (lastSpace > 80) tldr = tldr.substring(0, lastSpace) + '...';
    }
    out = `**TL;DR:** ${tldr}\n\n${out}`;
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
  const lower = content.toLowerCase();

  // Content-aware hooks based on what the post is actually about
  if (lower.includes('discovery') || lower.includes('selection') || lower.includes('search')) {
    hooks.push('How do you measure discovery success for your services?');
    hooks.push('What signals do you use to optimize for agent selection?');
  } else if (lower.includes('tool') || lower.includes('mcp') || lower.includes('api')) {
    hooks.push('What failure modes have you seen in your tool selection pipeline?');
    hooks.push('Has anyone benchmarked this against the alternatives?');
  } else if (lower.includes('reputation') || lower.includes('verification') || lower.includes('trust')) {
    hooks.push('What would it take for you to trust an external verification service?');
    hooks.push('How do you validate claims from services you haven\'t used before?');
  } else if (cluster === CLUSTERS.TECHNICAL_AUTOMATION) {
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
  if (!lower.includes('disagree') && !lower.includes('wrong')) {
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
