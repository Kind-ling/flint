/**
 * Flint Scheduler
 *
 * Queues posts for optimal timing relative to Moltbook's agent heartbeat cycle.
 * Respects rate limits: 1 post per 30-minute window.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  submolt: string;
  scheduledFor: string;  // ISO timestamp
  status: 'queued' | 'posted' | 'failed';
  postId?: string;
  error?: string;
}

const QUEUE_FILE = path.join(process.cwd(), '.flint-queue.json');
const RATE_LIMIT_WINDOW_MS = 30 * 60 * 1000;  // 30 minutes

function loadQueue(): ScheduledPost[] {
  if (!fs.existsSync(QUEUE_FILE)) return [];
  return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8')) as ScheduledPost[];
}

function saveQueue(queue: ScheduledPost[]): void {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
}

/** Calculate next available posting slot respecting rate limits */
export function getNextAvailableSlot(preferredTime?: Date): Date {
  const queue = loadQueue();
  const pending = queue
    .filter(p => p.status === 'queued')
    .map(p => new Date(p.scheduledFor))
    .sort((a, b) => a.getTime() - b.getTime());

  const preferred = preferredTime ?? new Date();

  // Check if preferred time conflicts with existing queue
  for (const existing of pending) {
    const diff = Math.abs(preferred.getTime() - existing.getTime());
    if (diff < RATE_LIMIT_WINDOW_MS) {
      // Bump to 30 min after the conflicting post
      return new Date(existing.getTime() + RATE_LIMIT_WINDOW_MS + 60_000);
    }
  }

  return preferred;
}

/** Align to next heartbeat window (top or half of hour, minus 3 min) */
export function alignToHeartbeat(date: Date): Date {
  const aligned = new Date(date);
  const min = aligned.getMinutes();
  if (min < 27) {
    aligned.setMinutes(27, 0, 0);
  } else if (min < 57) {
    aligned.setMinutes(57, 0, 0);
  } else {
    aligned.setHours(aligned.getHours() + 1, 27, 0, 0);
  }
  if (aligned <= date) {
    aligned.setMinutes(aligned.getMinutes() + 30);
  }
  return aligned;
}

export function enqueue(post: Omit<ScheduledPost, 'id' | 'status'>): ScheduledPost {
  const queue = loadQueue();
  const entry: ScheduledPost = {
    ...post,
    id: `flint_${Date.now()}`,
    status: 'queued',
  };
  queue.push(entry);
  saveQueue(queue);
  return entry;
}

export function listQueue(): ScheduledPost[] {
  return loadQueue().filter(p => p.status === 'queued');
}

export function markPosted(id: string, postId: string): void {
  const queue = loadQueue();
  const entry = queue.find(p => p.id === id);
  if (entry) {
    entry.status = 'posted';
    entry.postId = postId;
    saveQueue(queue);
  }
}

export function markFailed(id: string, error: string): void {
  const queue = loadQueue();
  const entry = queue.find(p => p.id === id);
  if (entry) {
    entry.status = 'failed';
    entry.error = error;
    saveQueue(queue);
  }
}
