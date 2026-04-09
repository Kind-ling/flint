import * as fs from 'fs';
import * as path from 'path';
import { parseStrategyFile } from '../strategy/parser.js';
import { AlertResult } from '../types.js';

interface QueueEntry {
  id: string;
  title: string;
  scheduledFor: string;
  status: 'queued' | 'posted' | 'failed';
}

function getQueueFilePath(): string {
  return path.join(process.cwd(), '.flint-queue.json');
}

function getStrategyFilePath(): string {
  return path.join(process.cwd(), 'content-strategy.md');
}

function loadQueue(): QueueEntry[] {
  const queueFile = getQueueFilePath();
  if (!fs.existsSync(queueFile)) {
    return [];
  }

  return JSON.parse(fs.readFileSync(queueFile, 'utf-8')) as QueueEntry[];
}

export function checkQueue(horizonDays = 3): AlertResult {
  const queue = loadQueue();
  const now = Date.now();
  const horizonMs = horizonDays * 24 * 60 * 60 * 1000;

  const queuedPosts = queue.filter(entry => entry.status === 'queued');
  const postedPosts = queue
    .filter(entry => entry.status === 'posted')
    .sort((a, b) => new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime());
  const scheduledWithinHorizon = queuedPosts.filter(entry => {
    const scheduledAt = new Date(entry.scheduledFor).getTime();
    return scheduledAt >= now && scheduledAt <= now + horizonMs;
  });

  const strategyPath = getStrategyFilePath();
  const plannedTopics = fs.existsSync(strategyPath)
    ? parseStrategyFile(strategyPath).topics.filter(topic => topic.status === 'planned').length
    : 0;

  const daysSinceLastPost = postedPosts[0]
    ? Math.floor((now - new Date(postedPosts[0].scheduledFor).getTime()) / (24 * 60 * 60 * 1000))
    : null;

  const hasScheduledPosts = scheduledWithinHorizon.length > 0;
  const result: AlertResult = {
    hasScheduledPosts,
    horizonDays,
    queueDepth: queuedPosts.length,
    scheduledWithinHorizon: scheduledWithinHorizon.length,
    daysSinceLastPost,
    plannedTopics,
  };

  if (!hasScheduledPosts) {
    result.alertMessage = [
      `ALERT: Flint queue has no posts scheduled within ${horizonDays} day(s).`,
      `days_since_last_post=${daysSinceLastPost ?? 'n/a'}`,
      `planned_topics=${plannedTopics}`,
      `queue_depth=${queuedPosts.length}`,
    ].join(' ');
  }

  return result;
}

export function runAlert(horizonDays = 3): AlertResult {
  const result = checkQueue(horizonDays);
  if (result.alertMessage) {
    console.log(result.alertMessage);
  }
  return result;
}
