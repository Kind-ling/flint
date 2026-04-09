import * as fs from 'fs';
import YAML from 'yaml';
import { ContentStrategy, StrategyTopic } from '../types.js';

function isTopicStatus(value: unknown): value is StrategyTopic['status'] {
  return value === 'planned' || value === 'drafted' || value === 'posted' || value === 'killed';
}

function isTopicPriority(value: unknown): value is StrategyTopic['priority'] {
  return value === 'high' || value === 'medium' || value === 'low';
}

function isStrategyTopic(value: unknown): value is StrategyTopic {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const topic = value as Record<string, unknown>;
  return (
    typeof topic['id'] === 'string' &&
    typeof topic['title'] === 'string' &&
    isTopicStatus(topic['status']) &&
    isTopicPriority(topic['priority']) &&
    (typeof topic['target_date'] === 'string' || topic['target_date'] instanceof Date) &&
    typeof topic['angle'] === 'string' &&
    Array.isArray(topic['key_points']) &&
    typeof topic['audience'] === 'string' &&
    typeof topic['persona'] === 'string' &&
    Array.isArray(topic['refs'])
  );
}

export function parseStrategyFile(filePath: string): ContentStrategy {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return parseStrategy(raw);
}

export function parseStrategy(raw: string): ContentStrategy {
  const parsed = YAML.parse(raw) as { topics?: unknown } | null;

  if (!parsed || !Array.isArray(parsed.topics)) {
    throw new Error('Invalid strategy file: expected a top-level "topics" array.');
  }

  const topics = parsed.topics.map((topic, index) => {
    if (!isStrategyTopic(topic)) {
      throw new Error(`Invalid strategy topic at index ${index}.`);
    }

    return {
      ...topic,
      target_date: String(topic.target_date).slice(0, 10),
      angle: topic.angle.trim(),
      key_points: topic.key_points.map(point => String(point)),
      refs: topic.refs.map(ref => String(ref)),
    };
  });

  return { topics };
}

export function stringifyStrategy(strategy: ContentStrategy): string {
  return YAML.stringify(strategy, {
    indent: 2,
    lineWidth: 0,
  });
}
