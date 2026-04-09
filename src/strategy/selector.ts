import { StrategyTopic } from '../types.js';

const PRIORITY_ORDER: Record<StrategyTopic['priority'], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function selectNextTopic(topics: StrategyTopic[]): StrategyTopic | undefined {
  return topics
    .filter(topic => topic.status === 'planned')
    .sort(compareTopics)[0];
}

export function findTopicById(topics: StrategyTopic[], topicId: string): StrategyTopic | undefined {
  return topics.find(topic => topic.id === topicId);
}

export function compareTopics(a: StrategyTopic, b: StrategyTopic): number {
  const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  if (priorityDiff !== 0) {
    return priorityDiff;
  }

  const targetDateDiff = new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
  if (targetDateDiff !== 0) {
    return targetDateDiff;
  }

  return a.id.localeCompare(b.id);
}
