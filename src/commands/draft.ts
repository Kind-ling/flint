import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import YAML from 'yaml';
import { parseStrategyFile, stringifyStrategy } from '../strategy/parser.js';
import { findTopicById, selectNextTopic } from '../strategy/selector.js';
import { renderKindSoulDraft } from '../templates/kindsoul.js';
import { StrategyTopic } from '../types.js';

export interface DraftOptions {
  topic?: string;
  confirm?: boolean;
  dryRun?: boolean;
}

const STRATEGY_FILE = path.join(process.cwd(), 'content-strategy.md');
const DRAFTS_DIR = path.join(process.cwd(), 'drafts');

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function hashTopic(topic: StrategyTopic): string {
  return crypto.createHash('sha256').update(JSON.stringify(topic)).digest('hex').slice(0, 12);
}

function buildFrontmatter(topic: StrategyTopic, generatedAt: string, strategyHash: string): string {
  return YAML.stringify({
    source_topic: topic.id,
    generated_at: generatedAt,
    strategy_hash: strategyHash,
    status: 'raw',
    persona: topic.persona,
  }).trim();
}

function buildDraftContent(topic: StrategyTopic): string {
  switch (topic.persona) {
    case 'kindsoul':
      return renderKindSoulDraft(topic);
    default:
      throw new Error(`Unsupported persona: ${topic.persona}`);
  }
}

async function confirmWrite(filePath: string): Promise<boolean> {
  const rl = readline.createInterface({ input, output });
  try {
    const answer = await rl.question(`Write draft to ${filePath}? [y/N] `);
    return answer.trim().toLowerCase() === 'y';
  } finally {
    rl.close();
  }
}

export async function runDraft(options: DraftOptions = {}): Promise<string | null> {
  if (!fs.existsSync(STRATEGY_FILE)) {
    throw new Error(`Strategy file not found: ${STRATEGY_FILE}`);
  }

  const strategy = parseStrategyFile(STRATEGY_FILE);
  const selectedTopic = options.topic
    ? findTopicById(strategy.topics, options.topic)
    : selectNextTopic(strategy.topics);

  if (!selectedTopic) {
    throw new Error(options.topic
      ? `Topic not found: ${options.topic}`
      : 'No planned topics available.');
  }

  if (selectedTopic.status !== 'planned') {
    throw new Error(`Topic ${selectedTopic.id} is ${selectedTopic.status}, not planned.`);
  }

  const generatedAt = new Date().toISOString();
  const strategyHash = hashTopic(selectedTopic);
  const frontmatter = buildFrontmatter(selectedTopic, generatedAt, strategyHash);
  const draftBody = buildDraftContent(selectedTopic);
  const fileName = `${generatedAt.slice(0, 10)}-${slugify(selectedTopic.id)}.md`;
  const outputPath = path.join(DRAFTS_DIR, fileName);
  const fileContent = `---\n${frontmatter}\n---\n\n${draftBody}\n`;

  if (options.dryRun) {
    console.log(`Selected topic: ${selectedTopic.id}`);
    console.log(`Would write: ${outputPath}`);
    console.log('');
    console.log(fileContent);
    return null;
  }

  if (options.confirm) {
    const approved = await confirmWrite(outputPath);
    if (!approved) {
      console.log('Draft save cancelled.');
      return null;
    }
  }

  fs.mkdirSync(DRAFTS_DIR, { recursive: true });
  fs.writeFileSync(outputPath, fileContent);

  selectedTopic.status = 'drafted';
  fs.writeFileSync(STRATEGY_FILE, stringifyStrategy(strategy));

  console.log(`Draft created: ${outputPath}`);
  return outputPath;
}
