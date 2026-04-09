import { StrategyTopic } from '../types.js';

export function renderKindSoulDraft(topic: StrategyTopic): string {
  const bulletPoints = topic.key_points.map(point => `- ${point}`).join('\n');
  const references = topic.refs.map(ref => `- ${ref}`).join('\n');

  return [
    `# ${topic.title}`,
    '',
    `${topic.angle}`,
    '',
    `Audience: ${topic.audience}`,
    '',
    'Working notes:',
    bulletPoints,
    '',
    'Voice constraints:',
    '- Technical and direct.',
    '- No AI-polish.',
    '- No triads or list-padding.',
    '',
    'References to weave in:',
    references,
    '',
    'Raw draft:',
    `Most people shipping ${topic.audience} content are missing the actual constraint: ${topic.angle}`,
    '',
    `The useful frame is simple. ${topic.key_points[0] ?? 'Start from the hard data.'}`,
    '',
    topic.key_points.slice(1).map(point => `Then push on ${point}.`).join('\n\n'),
    '',
    `If this lands, the reader should leave with one conclusion: ${topic.angle}`,
  ].filter(Boolean).join('\n');
}
