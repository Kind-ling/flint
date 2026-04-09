import { describe, expect, it } from 'vitest';
import { selectNextTopic, findTopicById } from '../src/strategy/selector.js';
import { StrategyTopic } from '../src/types.js';

const topics: StrategyTopic[] = [
  {
    id: 'medium-early',
    title: 'Medium Early',
    status: 'planned',
    priority: 'medium',
    target_date: '2026-04-10',
    angle: 'angle',
    key_points: ['one'],
    audience: 'aud',
    persona: 'kindsoul',
    refs: ['ref'],
  },
  {
    id: 'high-late',
    title: 'High Late',
    status: 'planned',
    priority: 'high',
    target_date: '2026-04-20',
    angle: 'angle',
    key_points: ['one'],
    audience: 'aud',
    persona: 'kindsoul',
    refs: ['ref'],
  },
  {
    id: 'high-early',
    title: 'High Early',
    status: 'planned',
    priority: 'high',
    target_date: '2026-04-11',
    angle: 'angle',
    key_points: ['one'],
    audience: 'aud',
    persona: 'kindsoul',
    refs: ['ref'],
  },
  {
    id: 'already-drafted',
    title: 'Already Drafted',
    status: 'drafted',
    priority: 'high',
    target_date: '2026-04-09',
    angle: 'angle',
    key_points: ['one'],
    audience: 'aud',
    persona: 'kindsoul',
    refs: ['ref'],
  },
];

describe('strategy selector', () => {
  it('selects highest priority planned topic, then earliest target date', () => {
    expect(selectNextTopic(topics)?.id).toBe('high-early');
  });

  it('finds a topic by explicit topic id', () => {
    expect(findTopicById(topics, 'medium-early')?.id).toBe('medium-early');
  });
});
