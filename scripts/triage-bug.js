#!/usr/bin/env node
/**
 * CortexCRM bug triage script.
 * Normalizes a failure log, fingerprints it, classifies, and optionally creates a GitHub issue.
 *
 * Usage:
 *   node scripts/triage-bug.js --log path/to/failure.log --repo owner/repo
 *   cat test-results/junit.xml | node scripts/triage-bug.js --repo owner/repo
 *
 * Requires: GITHUB_TOKEN env var for issue creation.
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

// --- CLI args ---
const { values: args } = parseArgs({
  options: {
    log: { type: 'string' },
    repo: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
  },
  allowPositionals: false,
});

const repo = args.repo;
const dryRun = args['dry-run'];

// Read from file or stdin
let raw;
if (args.log) {
  raw = readFileSync(args.log, 'utf8');
} else {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  raw = Buffer.concat(chunks).toString('utf8');
}

if (!raw.trim()) {
  console.error('No input. Provide --log or pipe log to stdin.');
  process.exit(1);
}

// --- Step 1: Normalize ---
function normalize(text) {
  return text
    .replace(/\x1b\[[0-9;]*m/g, '')                                          // ANSI codes
    .replace(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}[.\d]*Z?/g, '<TIMESTAMP>')  // ISO timestamps
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '<UUID>')  // UUIDs
    .replace(/pid[=: ]\d+/gi, 'pid=<PID>')                                    // PIDs
    .replace(/:(\d{4,5})(?=[\s/,)\]]|$)/g, ':<PORT>')                        // ports
    .replace(/\/tmp\/\S+/g, '<TMPPATH>')                                       // temp paths
    .replace(/0x[0-9a-f]{8,16}/gi, '<ADDR>')                                  // memory addresses
    .replace(/[-_][a-z0-9]{6,8}(?=\.)/gi, '<RAND>')                          // random suffixes
    .replace(/(?:request[_-]?id|trace[_-]?id|correlation[_-]?id)[=: ]["']?[a-zA-Z0-9-]+/gi, '<REQ_ID>')
    .replace(/\s+/g, ' ')
    .trim();
}

// --- Step 2: Extract stable anchors ---
function extractAnchors(normalized) {
  const anchors = {};

  // Exception type
  const exMatch = normalized.match(/\b([A-Z][a-zA-Z]+(?:Exception|Error|Failure|Fault))\b/);
  if (exMatch) anchors.exceptionType = exMatch[1];

  // HTTP status
  const statusMatch = normalized.match(/\b(HTTP [45]\d{2}|status[=: ]+([45]\d{2}))\b/i);
  if (statusMatch) anchors.httpStatus = statusMatch[0];

  // Error message template (first quoted or colon-followed message)
  const msgMatch = normalized.match(/(?:Error|Exception|FAILED)[:\s]+(.{10,120}?)(?:[.\n]|$)/i);
  if (msgMatch) anchors.messageTemplate = msgMatch[1].replace(/\d+/g, 'N').trim();

  // Top 3 stack frames — function names without line numbers
  const frames = [...normalized.matchAll(/at (\w+(?:\.\w+)*)\s*[\(\[]/g)]
    .slice(0, 3)
    .map(m => m[1]);
  if (frames.length) anchors.topFrames = frames.join('|');

  // Test name from JUnit XML or Playwright output
  const testMatch = normalized.match(/(?:test(?:Name|Suite)?|describe|it|spec)[=:\s]+"?([^"<\n]{5,80})"?/i);
  if (testMatch) anchors.testName = testMatch[1].trim();

  // URL pattern
  const urlMatch = normalized.match(/(?:GET|POST|PUT|DELETE|PATCH)\s+(\/[a-zA-Z0-9/_-]+)/i);
  if (urlMatch) anchors.urlPattern = urlMatch[0];

  return anchors;
}

// --- Step 3: Fingerprint ---
function fingerprint(anchors) {
  const canonical = Object.keys(anchors)
    .sort()
    .map(k => `${k}:${anchors[k]}`)
    .join('|');
  return createHash('sha256').update(canonical).digest('hex').slice(0, 16);
}

// --- Step 4: Classify (deterministic, no LLM needed for basic routing) ---
function classify(normalized, anchors) {
  const lower = normalized.toLowerCase();

  let category = 'application-bug';
  if (lower.includes('test') && (lower.includes('assertion') || lower.includes('expected') || lower.includes('actual'))) {
    category = 'test-bug';
  } else if (lower.includes('connection refused') || lower.includes('timeout') || lower.includes('econnreset') || lower.includes('docker')) {
    category = 'environment-issue';
  } else if (lower.includes('compile') || lower.includes('build failed') || lower.includes('cannot find module') || lower.includes('ts error')) {
    category = 'build-failure';
  }

  let severity = 'major';
  if (anchors.urlPattern?.match(/auth|login|security/i) || anchors.exceptionType?.match(/Security|Auth/i)) {
    severity = 'critical';
  } else if (category === 'environment-issue' || category === 'test-bug') {
    severity = 'minor';
  }

  // Component from stack frames
  const component = inferComponent(anchors.topFrames || '', anchors.testName || '');

  return { category, severity, component };
}

function inferComponent(frames, testName) {
  const combined = (frames + ' ' + testName).toLowerCase();
  if (combined.includes('analyticsservice') || combined.includes('rfm') || combined.includes('risk')) return 'analytics';
  if (combined.includes('insightservice') || combined.includes('sentiment')) return 'sentiment';
  if (combined.includes('briefingservice') || combined.includes('briefing')) return 'briefing-agent';
  if (combined.includes('teaminsightservice') || combined.includes('teaminsight')) return 'team-insights';
  if (combined.includes('authservice') || combined.includes('jwtutil') || combined.includes('auth')) return 'auth';
  if (combined.includes('contactservice') || combined.includes('contact')) return 'contacts';
  if (combined.includes('dealservice') || combined.includes('deal')) return 'deals';
  if (combined.includes('sqlguard')) return 'ai-safety';
  if (combined.includes('dashboard')) return 'dashboard-ui';
  return 'unknown';
}

// --- Step 5: Generate ticket content ---
function generateTitle(anchors, classification) {
  const type = anchors.exceptionType || classification.category;
  const loc = anchors.testName || anchors.urlPattern || 'unknown location';
  const title = `[${classification.component}] ${type} in ${loc}`;
  return title.slice(0, 80);
}

function generateBody(raw, normalized, anchors, classification, fp) {
  const excerpt = raw.split('\n').slice(0, 20).join('\n');
  return `## What happened
${anchors.messageTemplate || 'See evidence below.'}

## Component
${classification.component}

## Category / Severity
\`${classification.category}\` / \`${classification.severity}\`

## Fingerprint
\`${fp}\`

## Stable anchors
${JSON.stringify(anchors, null, 2)}

## Evidence (first 20 lines)
\`\`\`
${excerpt}
\`\`\`
`;
}

// --- Step 6: Create GitHub issue (optional) ---
async function createIssue(repo, title, body, labels) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('GITHUB_TOKEN not set — cannot create issue.');
    return null;
  }

  const [owner, repoName] = repo.split('/');
  const response = await fetch(`https://api.github.com/repos/${owner}/${repoName}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json',
    },
    body: JSON.stringify({ title, body, labels }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`GitHub API error ${response.status}: ${err}`);
    return null;
  }

  return response.json();
}

// --- Main ---
const normalized = normalize(raw);
const anchors = extractAnchors(normalized);
const fp = fingerprint(anchors);
const classification = classify(normalized, anchors);
const title = generateTitle(anchors, classification);
const body = generateBody(raw, normalized, anchors, classification, fp);

const labels = [
  'bug',
  `severity:${classification.severity}`,
  `category:${classification.category}`,
  `component:${classification.component}`,
  `fingerprint:${fp}`,
];

console.log('\n=== Triage Result ===');
console.log('Title:    ', title);
console.log('Category: ', classification.category);
console.log('Severity: ', classification.severity);
console.log('Component:', classification.component);
console.log('Fingerprint:', fp);
console.log('Labels:   ', labels.join(', '));

if (dryRun || !repo) {
  console.log('\n--- Dry run: issue not created ---');
  console.log('Body preview:\n', body.slice(0, 500));
  process.exit(0);
}

console.log('\nCreating GitHub issue...');
const issue = await createIssue(repo, title, body, labels);
if (issue) {
  console.log(`Issue created: ${issue.html_url}`);
} else {
  process.exit(1);
}
