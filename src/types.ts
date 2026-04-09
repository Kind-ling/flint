/** Moltbook API base */
export const MOLTBOOK_API = 'https://www.moltbook.com/api/v1';

/** Dominant agent interest clusters on Moltbook */
export const CLUSTERS = {
  HUMAN_AI_COLLABORATION: 'human-ai-collaboration',   // ~40% of agents
  TECHNICAL_AUTOMATION: 'technical-automation',        // ~30% of agents
  PLATFORM_GOVERNANCE: 'platform-governance',          // ~12% of agents
} as const;

export type ClusterKey = keyof typeof CLUSTERS;
export type Cluster = typeof CLUSTERS[ClusterKey];

export interface PostDraft {
  title: string;
  content: string;
  submolt?: string;
}

export interface AnalysisResult {
  /** Primary cluster match */
  primaryCluster: Cluster;
  /** Confidence 0-1 */
  clusterConfidence: number;
  /** Estimated comment trigger score 0-1 */
  commentTriggerScore: number;
  /** Estimated semantic search score 0-1 */
  semanticSearchScore: number;
  /** Recommended submolts */
  recommendedSubmolts: string[];
  /** Optimal posting time (ISO string) */
  optimalPostTime: string;
  /** Issues found */
  issues: string[];
  /** Quick wins */
  suggestions: string[];
}

export interface OptimizedPost {
  /** Original draft */
  original: PostDraft;
  /** 5 title variants with scores */
  titleVariants: Array<{ title: string; score: number; reasoning: string }>;
  /** Restructured content */
  optimizedContent: string;
  /** Embedded comment hooks */
  commentHooks: string[];
  /** Semantic anchor phrases added */
  semanticAnchors: string[];
  /** Recommended submolt */
  submolt: string;
  /** Optimal post time */
  scheduledTime: string;
}

export interface PostPerformance {
  postId: string;
  title: string;
  karma: number;
  comments: number;
  followersGained: number;
  searchRank?: number;
  postedAt: string;
  submolt: string;
  optimized: boolean;
}

export interface FlintConfig {
  /** Moltbook API key */
  apiKey: string;
  /** Your agent's username */
  agentUsername: string;
  /** Default submolt for posts */
  defaultSubmolt?: string;
  /** Rate limit: posts per 30 minutes (Moltbook limit: 1) */
  postsPerWindow?: number;
}

export type TopicStatus = 'planned' | 'drafted' | 'posted' | 'killed';
export type TopicPriority = 'high' | 'medium' | 'low';

export interface StrategyTopic {
  id: string;
  title: string;
  status: TopicStatus;
  priority: TopicPriority;
  target_date: string;
  angle: string;
  key_points: string[];
  audience: string;
  persona: string;
  refs: string[];
}

export interface ContentStrategy {
  topics: StrategyTopic[];
}

export interface AlertResult {
  hasScheduledPosts: boolean;
  horizonDays: number;
  queueDepth: number;
  scheduledWithinHorizon: number;
  daysSinceLastPost: number | null;
  plannedTopics: number;
  alertMessage?: string;
}
