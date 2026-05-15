#!/usr/bin/env node
// AV Map V2 pipeline — three focused Claude prompts behind one CLI.
//
// Usage:
//   node scripts/v2-pipeline.mjs --prompt=refresh    [--since=YYYY-MM-DD]
//   node scripts/v2-pipeline.mjs --prompt=cleanup
//   node scripts/v2-pipeline.mjs --prompt=geo
//   node scripts/v2-pipeline.mjs --prompt=newsletter [--since=YYYY-MM-DD] [--issue=N]
//
// Requires: ANTHROPIC_API_KEY in env. @anthropic-ai/sdk installed.
//
// Models (override via env):
//   PIPELINE_MODEL      default claude-sonnet-4-5  (refresh/cleanup/newsletter)
//   PIPELINE_MODEL_GEO  default = PIPELINE_MODEL   (set to an Opus id for
//                       higher-reasoning geography scouting)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)=?(.*)$/);
    return m ? [m[1], m[2] === '' ? true : m[2]] : [a, true];
  }),
);

const PROMPT = args.prompt;
const VALID = { refresh: 1, cleanup: 1, geo: 1, newsletter: 1 };
if (!PROMPT || !VALID[PROMPT]) {
  console.error('Usage: --prompt={refresh|cleanup|geo|newsletter} [--since=YYYY-MM-DD] [--issue=N]');
  process.exit(1);
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY env var is required');
  process.exit(1);
}

const MODEL = process.env.PIPELINE_MODEL || 'claude-sonnet-4-5';
const MODEL_GEO = process.env.PIPELINE_MODEL_GEO || MODEL;
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PROMPT_FILE = {
  refresh: 'prompts/01-weekly-refresh.md',
  cleanup: 'prompts/02-cleanup.md',
  geo: 'prompts/03-new-geographies.md',
  newsletter: 'prompts/04-newsletter-draft.md',
};

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}
function writeOut(rel, content) {
  const full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
  console.log(`  wrote ${rel} (${content.length} bytes)`);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}
function extractBlock(text, label) {
  // Matches ```label\n ... \n``` (label optional / fuzzy).
  const re = new RegExp('```' + label + '\\s*\\n([\\s\\S]*?)```', 'i');
  const m = text.match(re);
  return m ? m[1].replace(/\s+$/, '') : null;
}

function buildUserMessage() {
  const eventsCsv = read('events.csv');
  if (PROMPT === 'cleanup') {
    return `EVENTS_CSV:\n${eventsCsv}`;
  }
  const newsCsv = read('news.csv');
  if (PROMPT === 'geo') {
    return `EVENTS_CSV:\n${eventsCsv}\n\nNEWS_CSV:\n${newsCsv}`;
  }
  const since = args.since || '(unknown — treat as last 7 days)';
  if (PROMPT === 'newsletter') {
    const issue = args.issue || 1;
    return `EVENTS_CSV:\n${eventsCsv}\n\nNEWS_CSV:\n${newsCsv}\n\nRANGE: ${since} to ${today()}\nISSUE_NUMBER: ${issue}`;
  }
  // refresh
  return `EVENTS_CSV:\n${eventsCsv}\n\nNEWS_CSV:\n${newsCsv}\n\nRANGE: ${since} to ${today()}`;
}

async function main() {
  const system = read(PROMPT_FILE[PROMPT]);
  const userMessage = buildUserMessage();
  const model = PROMPT === 'geo' ? MODEL_GEO : MODEL;

  console.log(`▶ v2-pipeline --prompt=${PROMPT}`);
  console.log(`  model: ${model}`);

  const resp = await client.messages.create({
    model,
    max_tokens: 4000,
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: userMessage }],
  });

  const out = resp.content.map((b) => (b.type === 'text' ? b.text : '')).join('').trim();
  const stamp = today();

  if (PROMPT === 'refresh') {
    const ev = extractBlock(out, 'new_events\\.csv') ?? '';
    const nw = extractBlock(out, 'new_news\\.csv') ?? '';
    writeOut(`pipeline-out/${stamp}-new_events.csv`, ev + '\n');
    writeOut(`pipeline-out/${stamp}-new_news.csv`, nw + '\n');
  } else if (PROMPT === 'cleanup') {
    const corr = extractBlock(out, 'corrections\\.csv') ?? '';
    const summary = extractBlock(out, 'corrections_summary\\.md') ?? out;
    writeOut(`pipeline-out/${stamp}-corrections.csv`, corr + '\n');
    writeOut(`pipeline-out/${stamp}-corrections_summary.md`, summary + '\n');
  } else if (PROMPT === 'geo') {
    const geo = extractBlock(out, 'new_geographies\\.md') ?? out;
    writeOut(`pipeline-out/${stamp}-new_geographies.md`, geo + '\n');
  } else if (PROMPT === 'newsletter') {
    const draft = extractBlock(out, 'draft\\.md') ?? out;
    const issue = args.issue || 1;
    writeOut(`drafts/${stamp}-issue-${issue}.md`, draft + '\n');
  }

  const u = resp.usage;
  console.log(`✓ done. tokens in=${u?.input_tokens} out=${u?.output_tokens}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
