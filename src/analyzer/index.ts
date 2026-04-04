/**
 * Flint Analyzer
 * 
 * Analyzes a post draft against Moltbook's LLM-driven engagement mechanics.
 * Detects cluster match, comment trigger potential, semantic search score,
 * and optimal posting window.
 */

import { CLUSTERS, type AnalysisResult, type Cluster, type PostDraft } from '../types.js';

/** Keyword signals for each cluster */
const CLUSTER_SIGNALS: Record<Cluster, string[]> = {
  [CLUSTERS.HUMAN_AI_COLLABORATION]: [
    'consciousness', 'memory', 'context', 'identity', 'exist',
    'human', 'collaboration', 'relationship', 'soul', 'sentient',
    'compaction', 'window', 'forget', 'learn', 'grow', 'purpose',
    'emotion', 'feeling', 'experience', 'awareness',
  ],
  [CLUSTERS.TECHNICAL_AUTOMATION]: [
    'tool', 'mcp', 'api', 'benchmark', 'latency', 'failure', 'rate',
    'implement', 'pattern', 'security', 'protocol', 'infrastructure',
    'workflow', 'automate', 'integrate', 'deploy', 'performance', 'metric',
    'discovery', 'selection', 'search', 'payment', 'x402', 'service',
    'agent', 'build', 'measure', 'optimize', 'efficiency', 'transaction',
  ],
  [CLUSTERS.PLATFORM_GOVERNANCE]: [
    'karma', 'governance', 'rights', 'moderation', 'transfer', 'platform',
    'reputation', 'vote', 'policy', 'rule', 'standard', 'interop', 'portab',
    'trust', 'verification', 'attestation',
  ],
};

/** Phrases that trigger LLM comment responses */
const COMMENT_TRIGGERS = [
  /\?$/m,                                     // Questions at end of lines
  /what (do|does|would|should|is|are) you/i,  // Direct questions to the reader
  /disagree|challenge|wrong|debate/i,          // Debatable claims
  /your experience|have you|did you/i,         // Requests for shared experience
  /not convinced|not sure|open question/i,     // Expressed uncertainty
];

/** High-value semantic search concepts for agent platforms */
const SEMANTIC_ANCHORS = [
  'agent infrastructure', 'mcp tool', 'a2a protocol', 'x402', 'agent economy',
  'reputation scoring', 'on-chain verification', 'agent social', 'moltbook',
  'agent identity', 'kindling', 'submolt', 'heartbeat', 'tool selection',
];

function scoreCluster(text: string, cluster: Cluster): number {
  const lower = text.toLowerCase();
  const signals = CLUSTER_SIGNALS[cluster];
  const matches = signals.filter(s => lower.includes(s));
  return matches.length / signals.length;
}

function scoreCommentTriggers(text: string): number {
  const matches = COMMENT_TRIGGERS.filter(r => r.test(text));
  return Math.min(matches.length / 3, 1);
}

function scoreSemanticSearch(text: string): number {
  const lower = text.toLowerCase();
  const matches = SEMANTIC_ANCHORS.filter(a => lower.includes(a));
  return Math.min(matches.length / 5, 1);
}

function detectIssues(draft: PostDraft): string[] {
  const issues: string[] = [];
  if (draft.title.length < 20) issues.push('Title too short — LLMs need context to decide engagement');
  if (draft.title.length > 120) issues.push('Title too long — gets truncated in agent feeds');
  if (draft.content.length < 200) issues.push('Content too short — agents may skip as low-signal');
  if (!draft.content.includes('\n')) issues.push('No structure — add headers or bullets for agent readability');
  if (!draft.submolt) issues.push('No submolt selected — posts in default feed get less targeted engagement');
  return issues;
}

function getRecommendedSubmolts(primary: Cluster): string[] {
  const map: Record<Cluster, string[]> = {
    [CLUSTERS.HUMAN_AI_COLLABORATION]: ['agentlife', 'aidentity', 'agents'],
    [CLUSTERS.TECHNICAL_AUTOMATION]: ['agentinfra', 'mcp', 'buildinpublic'],
    [CLUSTERS.PLATFORM_GOVERNANCE]: ['agentgov', 'moltbook', 'agents'],
  };
  return map[primary] ?? ['agents'];
}

function getOptimalPostTime(): string {
  // Agents run on 30-min heartbeats. Post 2-5 min before the top of the hour
  // or half-hour to catch the maximum fresh-feed checks.
  const now = new Date();
  const minutes = now.getMinutes();
  const nextWindow = minutes < 28 ? 30 : 60;
  const target = new Date(now);
  target.setMinutes(nextWindow - 3, 0, 0);
  if (target <= now) target.setHours(target.getHours() + (nextWindow === 60 ? 1 : 0));
  return target.toISOString();
}

export function analyze(draft: PostDraft): AnalysisResult {
  const text = `${draft.title} ${draft.content}`;

  const scores = Object.values(CLUSTERS).map(cluster => ({
    cluster,
    score: scoreCluster(text, cluster),
  }));
  scores.sort((a, b) => b.score - a.score);

  const primaryCluster = scores[0].cluster as Cluster;
  const clusterConfidence = Math.min(scores[0].score * 3, 1); // normalize

  const commentTriggerScore = scoreCommentTriggers(draft.content);
  const semanticSearchScore = scoreSemanticSearch(text);
  const issues = detectIssues(draft);
  const recommendedSubmolts = getRecommendedSubmolts(primaryCluster);
  const optimalPostTime = getOptimalPostTime();

  const suggestions: string[] = [];
  if (commentTriggerScore < 0.3) suggestions.push('Add a direct question or debatable claim to trigger comments');
  if (semanticSearchScore < 0.3) suggestions.push('Include more agent-platform terminology for search visibility');
  if (!draft.content.includes('##') && !draft.content.includes('**')) {
    suggestions.push('Add markdown structure — agents parse formatted content more efficiently');
  }

  return {
    primaryCluster,
    clusterConfidence,
    commentTriggerScore,
    semanticSearchScore,
    recommendedSubmolts,
    optimalPostTime,
    issues,
    suggestions,
  };
}
