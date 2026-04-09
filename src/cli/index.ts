#!/usr/bin/env node
/**
 * Flint CLI
 *
 * flint analyze <draft.md>
 * flint optimize <draft.md>
 * flint schedule <post.md> --submolt agentinfra
 * flint track --agent KindSoul
 * flint report --period 7d
 */

import { Command } from 'commander';
import * as fs from 'fs';
import { analyze } from '../analyzer/index.js';
import { optimize } from '../optimizer/index.js';
import { enqueue, listQueue, alignToHeartbeat, getNextAvailableSlot } from '../scheduler/index.js';
import { processNewDrafts, getDuePosts } from '../heartbeat/index.js';
import { runAlert } from '../commands/alert.js';
import { runDraft } from '../commands/draft.js';

const program = new Command();

program
  .name('flint')
  .description('Agent social growth engine — optimize for LLM inference decisions')
  .version('0.1.0');

// ── analyze ──────────────────────────────────────────────────────────────────

program
  .command('analyze <file>')
  .description('Analyze a post draft for engagement potential')
  .action((file: string) => {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    const title = lines[0]?.replace(/^#\s*/, '').trim() ?? '';
    const body = lines.slice(1).join('\n').trim();

    const result = analyze({ title, content: body });

    console.log('\n🔥 Flint Analysis\n');
    console.log(`Primary cluster:    ${result.primaryCluster} (${(result.clusterConfidence * 100).toFixed(0)}% confidence)`);
    console.log(`Comment potential:  ${(result.commentTriggerScore * 100).toFixed(0)}%`);
    console.log(`Search visibility:  ${(result.semanticSearchScore * 100).toFixed(0)}%`);
    console.log(`Optimal post time:  ${new Date(result.optimalPostTime).toLocaleTimeString()}`);
    console.log(`Recommended submolts: ${result.recommendedSubmolts.join(', ')}`);

    if (result.issues.length > 0) {
      console.log('\n⚠️  Issues:');
      result.issues.forEach(i => console.log(`  - ${i}`));
    }

    if (result.suggestions.length > 0) {
      console.log('\n💡 Suggestions:');
      result.suggestions.forEach(s => console.log(`  - ${s}`));
    }
  });

// ── optimize ─────────────────────────────────────────────────────────────────

program
  .command('optimize <file>')
  .description('Optimize a post draft — title variants, structure, comment hooks')
  .option('--submolt <submolt>', 'Target submolt')
  .action((file: string, opts: { submolt?: string }) => {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    const title = lines[0]?.replace(/^#\s*/, '').trim() ?? '';
    const body = lines.slice(1).join('\n').trim();

    const result = optimize({ title, content: body, submolt: opts.submolt });

    console.log('\n🔥 Flint Optimization\n');
    console.log('Title Variants (ranked):');
    result.titleVariants.forEach((v, i) => {
      console.log(`  ${i + 1}. [${(v.score * 100).toFixed(0)}%] ${v.title}`);
      console.log(`     → ${v.reasoning}`);
    });

    console.log(`\nSubmolt: m/${result.submolt}`);
    console.log(`Schedule for: ${new Date(result.scheduledTime).toLocaleTimeString()}`);

    console.log('\nComment Hooks (embed in content):');
    result.commentHooks.forEach(h => console.log(`  • ${h}`));

    if (result.semanticAnchors.length > 0) {
      console.log('\nSemantic Anchors (add to post):');
      result.semanticAnchors.forEach(a => console.log(`  • ${a}`));
    }

    // Write optimized content to file
    const outFile = file.replace(/\.md$/, '.optimized.md');
    fs.writeFileSync(outFile, `# ${result.titleVariants[0]?.title ?? title}\n\n${result.optimizedContent}`);
    console.log(`\nOptimized draft saved to: ${outFile}`);
  });

// ── schedule ─────────────────────────────────────────────────────────────────

program
  .command('schedule <file>')
  .description('Queue a post for optimal timing')
  .option('--submolt <submolt>', 'Target submolt', 'agentinfra')
  .option('--time <time>', 'ISO timestamp (default: next optimal window)')
  .action((file: string, opts: { submolt: string; time?: string }) => {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    const title = lines[0]?.replace(/^#\s*/, '').trim() ?? '';
    const body = lines.slice(1).join('\n').trim();

    const preferred = opts.time ? new Date(opts.time) : undefined;
    const slot = alignToHeartbeat(getNextAvailableSlot(preferred));

    const entry = enqueue({
      title,
      content: body,
      submolt: opts.submolt,
      scheduledFor: slot.toISOString(),
    });

    console.log(`\n🔥 Queued: ${entry.id}`);
    console.log(`   Title: ${title}`);
    console.log(`   Submolt: m/${opts.submolt}`);
    console.log(`   Scheduled for: ${slot.toLocaleString()}`);
    console.log('\nRun: flint queue to see pending posts');
  });

// ── queue ─────────────────────────────────────────────────────────────────────

program
  .command('queue')
  .description('List queued posts')
  .action(() => {
    const queue = listQueue();
    if (queue.length === 0) {
      console.log('No posts queued.');
      return;
    }
    console.log(`\n🔥 Queued Posts (${queue.length})\n`);
    queue.forEach(p => {
      console.log(`  ${p.id}`);
      console.log(`  "${p.title}"`);
      console.log(`  → m/${p.submolt} at ${new Date(p.scheduledFor).toLocaleString()}\n`);
    });
  });

// ── heartbeat ─────────────────────────────────────────────────────────────────

program
  .command('heartbeat')
  .description('Process new drafts and check for due posts (run from KindSoul heartbeat)')
  .option('--drafts <dir>', 'Drafts directory', process.env['FLINT_DRAFTS_DIR'] ?? '.')
  .option('--submolt <submolt>', 'Default submolt', 'agentinfra')
  .option('--max <n>', 'Max drafts to process per run', '1')
  .action((opts: { drafts: string; submolt: string; max: string }) => {
    console.log('🔥 Flint Heartbeat\n');

    // Check for due posts
    const due = getDuePosts();
    if (due.length > 0) {
      console.log(`📤 Due posts (${due.length}):`);
      due.forEach(p => {
        console.log(`  - ${p.id}: "${p.title}" → m/${p.submolt}`);
      });
      console.log('');
    }

    // Process new drafts
    const result = processNewDrafts(opts.drafts, opts.submolt, parseInt(opts.max, 10));

    if (result.processed.length > 0) {
      console.log(`✅ Processed (${result.processed.length}):`);
      result.processed.forEach(p => {
        console.log(`  - ${p.file} → scheduled for ${new Date(p.scheduledFor).toLocaleString()}`);
      });
    }

    if (result.skipped.length > 0) {
      console.log(`⏭️  Skipped: ${result.skipped.length} files`);
    }

    if (result.errors.length > 0) {
      console.log(`❌ Errors:`);
      result.errors.forEach(e => console.log(`  - ${e.file}: ${e.error}`));
    }

    console.log(`\n📋 Queue size: ${result.queueSize}`);
  });

// ── due ───────────────────────────────────────────────────────────────────────

program
  .command('due')
  .description('List posts that are due to be published')
  .action(() => {
    const due = getDuePosts();
    if (due.length === 0) {
      console.log('No posts due.');
      return;
    }
    console.log(`\n🔥 Due Posts (${due.length})\n`);
    due.forEach(p => {
      console.log(`  ${p.id}`);
      console.log(`  "${p.title}"`);
      console.log(`  → m/${p.submolt}\n`);
    });
  });

// ── alert ─────────────────────────────────────────────────────────────────────

program
  .command('alert')
  .description('Alert when the queue has no posts scheduled inside the horizon window')
  .option('--horizon-days <days>', 'Alert horizon in days', '3')
  .action((opts: { horizonDays: string }) => {
    runAlert(parseInt(opts.horizonDays, 10));
  });

// ── draft ─────────────────────────────────────────────────────────────────────

program
  .command('draft')
  .description('Generate a raw draft from content-strategy.md')
  .option('--topic <topicId>', 'Draft a specific topic ID')
  .option('--confirm', 'Require confirmation before saving the draft')
  .option('--dry-run', 'Preview the draft without writing files')
  .action(async (opts: { topic?: string; confirm?: boolean; dryRun?: boolean }) => {
    await runDraft(opts);
  });

void program.parseAsync();
