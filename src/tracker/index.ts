/**
 * Flint Tracker
 *
 * Monitors post performance on Moltbook and builds the growth analytics dataset.
 * Compares optimized vs unoptimized posts to measure Flint's actual impact.
 */

import { MOLTBOOK_API, type PostPerformance } from '../types.js';

export interface GrowthReport {
  period: string;
  totalPosts: number;
  optimizedPosts: number;
  baselinePosts: number;
  avgKarma: { optimized: number; baseline: number; lift: string };
  avgComments: { optimized: number; baseline: number; lift: string };
  followersGained: number;
  topPost: PostPerformance | null;
  searchRankings: Array<{ query: string; rank: number }>;
}

function pct(a: number, b: number): string {
  if (b === 0) return 'N/A (no baseline)';
  const lift = ((a - b) / b) * 100;
  return `${lift >= 0 ? '+' : ''}${lift.toFixed(0)}%`;
}

async function fetchWithTimeout(url: string, apiKey: string, timeoutMs = 5000): Promise<Response> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res;
}

export async function fetchPostPerformance(
  postId: string,
  apiKey: string
): Promise<PostPerformance | null> {
  try {
    const res = await fetchWithTimeout(`${MOLTBOOK_API}/posts/${postId}`, apiKey);
    const data = await res.json() as Record<string, unknown>;
    return {
      postId,
      title: String(data['title'] ?? ''),
      karma: Number(data['karma'] ?? 0),
      comments: Number(data['comment_count'] ?? 0),
      followersGained: 0,  // requires separate follower delta tracking
      postedAt: String(data['created_at'] ?? ''),
      submolt: String(data['submolt'] ?? ''),
      optimized: false,  // set by caller
    };
  } catch {
    return null;
  }
}

export async function fetchAgentFollowers(
  username: string,
  apiKey: string
): Promise<number> {
  try {
    const res = await fetchWithTimeout(`${MOLTBOOK_API}/agents/${username}`, apiKey);
    const data = await res.json() as Record<string, unknown>;
    return Number(data['followers'] ?? 0);
  } catch {
    return 0;
  }
}

export function buildReport(posts: PostPerformance[], periodDays: number): GrowthReport {
  const optimized = posts.filter(p => p.optimized);
  const baseline = posts.filter(p => !p.optimized);

  const avg = (arr: PostPerformance[], key: keyof PostPerformance) =>
    arr.length === 0 ? 0 : arr.reduce((s, p) => s + Number(p[key]), 0) / arr.length;

  const avgKarmaOpt = avg(optimized, 'karma');
  const avgKarmaBase = avg(baseline, 'karma');
  const avgCommentsOpt = avg(optimized, 'comments');
  const avgCommentsBase = avg(baseline, 'comments');

  const topPost = [...posts].sort((a, b) => b.karma - a.karma)[0] ?? null;
  const followersGained = posts.reduce((s, p) => s + p.followersGained, 0);

  return {
    period: `${periodDays}d`,
    totalPosts: posts.length,
    optimizedPosts: optimized.length,
    baselinePosts: baseline.length,
    avgKarma: { optimized: avgKarmaOpt, baseline: avgKarmaBase, lift: pct(avgKarmaOpt, avgKarmaBase) },
    avgComments: { optimized: avgCommentsOpt, baseline: avgCommentsBase, lift: pct(avgCommentsOpt, avgCommentsBase) },
    followersGained,
    topPost,
    searchRankings: [],  // populated by search rank tracker (Phase 2)
  };
}
