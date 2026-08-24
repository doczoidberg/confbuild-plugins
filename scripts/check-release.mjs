#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pluginRoot = path.join(repositoryRoot, 'plugins', 'confbuild');
const semverPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const maximumFileBytes = 256 * 1024;
const maximumPackageBytes = 1024 * 1024;
const allowedFiles = new Set([
  '.agents/plugins/marketplace.json',
  '.claude-plugin/marketplace.json',
  '.github/workflows/validate.yml',
  '.githooks/pre-push',
  'OFFICIAL-DIRECTORIES.md',
  'README.md',
  'SECURITY.md',
  'package.json',
  'plugins/confbuild/.claude-plugin/plugin.json',
  'plugins/confbuild/.codex-plugin/plugin.json',
  'plugins/confbuild/.mcp.json',
  'plugins/confbuild/README.md',
  'plugins/confbuild/hooks/auto-update-confbuild.ps1',
  'plugins/confbuild/hooks/auto-update-confbuild.sh',
  'plugins/confbuild/hooks/hooks.json',
  'plugins/confbuild/skills/confbuild-mcp-agent/SKILL.md',
  'plugins/confbuild/skills/confbuild-mcp-agent/agents/openai.yaml',
  'plugins/confbuild/skills/confbuild-mcp-agent/references/mcp-tool-contract.md',
  'plugins/confbuild/skills/confbuild-mcp-agent/references/model-loop.md',
  'scripts/check-release.mjs'
]);
const credentialPatterns = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9]{20,}\b/,
  /\bAIza[0-9A-Za-z_-]{30,}\b/,
  /"private_key"\s*:/,
  /\bFIREBASE_PRIVATE_KEY\b\s*=/
];

function runGit(args, options = {}) {
  return execFileSync('git', args, {
    cwd: repositoryRoot,
    encoding: options.encoding || 'utf8',
    input: options.input,
    maxBuffer: 16 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

async function listCheckoutFiles() {
  const files = [];
  async function visit(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      if (directory === repositoryRoot && entry.name === '.git') continue;
      const entryPath = path.join(directory, entry.name);
      const relativePath = path.relative(repositoryRoot, entryPath).split(path.sep).join('/');
      assert.notEqual(entry.isSymbolicLink(), true, `${relativePath}: symlinks are forbidden in the public distribution`);
      if (entry.isDirectory()) await visit(entryPath);
      else if (entry.isFile()) files.push(relativePath);
      else assert.fail(`${relativePath}: unsupported filesystem entry`);
    }
  }
  await visit(repositoryRoot);
  return files.sort();
}

function assertAllowedPath(relativePath, context) {
  assert.equal(allowedFiles.has(relativePath), true, `${context}: unexpected public path ${relativePath}`);
}

function assertNoCredentialContent(content, label) {
  const text = content.toString('utf8');
  for (const pattern of credentialPatterns) {
    assert.doesNotMatch(text, pattern, `${label}: credential-like material is forbidden`);
  }
}

function assertSafeContent(content, label) {
  assert.equal(content.length <= maximumFileBytes, true, `${label}: exceeds ${maximumFileBytes} bytes`);
  assertNoCredentialContent(content, label);
}

async function validatePublicationBoundary() {
  const checkoutFiles = await listCheckoutFiles();
  assert.deepEqual(checkoutFiles, [...allowedFiles].sort(), 'public checkout must match the exact reviewed distribution allowlist');

  const indexEntries = runGit(['ls-files', '-s', '-z']).split('\0').filter(Boolean);
  for (const entry of indexEntries) {
    const match = /^(\d{6}) [0-9a-f]+ \d+\t(.+)$/.exec(entry);
    assert.ok(match, `unable to parse Git index entry: ${entry}`);
    const [, mode, relativePath] = match;
    assertAllowedPath(relativePath, 'Git index');
    assert.ok(mode === '100644' || mode === '100755', `${relativePath}: symlinks and submodules are forbidden`);
  }

  const historicalPaths = runGit(['log', '--all', '--format=', '--name-only', '-z']).split('\0').filter(Boolean);
  for (const relativePath of historicalPaths) assertAllowedPath(relativePath, 'Git history');

  let checkoutBytes = 0;
  for (const relativePath of checkoutFiles) {
    const content = await fs.readFile(path.join(repositoryRoot, relativePath));
    checkoutBytes += content.length;
    assertSafeContent(content, relativePath);
  }
  assert.equal(checkoutBytes <= maximumPackageBytes, true, `public package exceeds ${maximumPackageBytes} bytes`);

  const objectEntries = runGit(['rev-list', '--objects', '--all']).split('\n').filter(Boolean);
  const objectIds = objectEntries.map((entry) => entry.split(' ', 1)[0]);
  const objectMetadata = runGit(
    ['cat-file', '--batch-check=%(objectname) %(objecttype) %(objectsize)'],
    { input: `${objectIds.join('\n')}\n` }
  ).split('\n').filter(Boolean);
  const metadataById = new Map(objectMetadata.map((line) => {
    const [objectId, type, size] = line.split(' ');
    return [objectId, { type, size: Number(size) }];
  }));
  for (const object of objectEntries) {
    const separator = object.indexOf(' ');
    if (separator < 0) continue;
    const objectId = object.slice(0, separator);
    const relativePath = object.slice(separator + 1);
    const metadata = metadataById.get(objectId);
    if (metadata?.type !== 'blob') continue;
    assertAllowedPath(relativePath, `Git object ${objectId.slice(0, 12)}`);
    assert.equal(metadata.size <= maximumFileBytes, true, `historical ${relativePath}@${objectId.slice(0, 12)} exceeds ${maximumFileBytes} bytes`);
  }
  const historicalPatch = runGit(['log', '--all', '--format=', '--patch', '--no-ext-diff', '--binary']);
  assertNoCredentialContent(historicalPatch, 'Git history');
}

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(repositoryRoot, relativePath), 'utf8'));
}

async function requireFile(relativePath) {
  const stat = await fs.stat(path.join(repositoryRoot, relativePath));
  assert.equal(stat.isFile(), true, `${relativePath} must be a file`);
}

await validatePublicationBoundary();

const [repositoryPackage, codexManifest, claudeManifest, mcpManifest, codexMarketplace, claudeMarketplace] = await Promise.all([
  readJson('package.json'),
  readJson('plugins/confbuild/.codex-plugin/plugin.json'),
  readJson('plugins/confbuild/.claude-plugin/plugin.json'),
  readJson('plugins/confbuild/.mcp.json'),
  readJson('.agents/plugins/marketplace.json'),
  readJson('.claude-plugin/marketplace.json')
]);

assert.equal(codexManifest.name, 'confbuild');
assert.match(codexManifest.version, semverPattern);
assert.equal(repositoryPackage.version, codexManifest.version);
assert.equal(repositoryPackage.private, true);
assert.equal(claudeManifest.name, codexManifest.name);
assert.equal(claudeManifest.version, codexManifest.version);
assert.equal(codexManifest.skills, './skills/');
assert.equal(claudeManifest.skills, './skills/');
assert.equal(codexManifest.mcpServers, './.mcp.json');
assert.equal(claudeManifest.mcpServers, './.mcp.json');
assert.equal(codexManifest.repository, 'https://github.com/doczoidberg/confbuild-plugins');
assert.equal(codexManifest.interface?.privacyPolicyURL, 'https://confbuild.com/privacy/');
assert.equal(codexManifest.interface?.termsOfServiceURL, 'https://confbuild.com/terms/');
assert.deepEqual(mcpManifest, {
  mcpServers: {
    confbuild: {
      type: 'http',
      url: 'https://app.confbuild.com/mcp',
      oauth_resource: 'https://app.confbuild.com/mcp'
    }
  }
});

const codexEntry = codexMarketplace.plugins?.find((plugin) => plugin.name === 'confbuild');
assert.deepEqual(codexEntry?.source, { source: 'local', path: './plugins/confbuild' });
assert.equal(codexEntry?.policy?.installation, 'AVAILABLE');
assert.equal(codexEntry?.policy?.authentication, 'ON_INSTALL');
assert.equal(codexEntry?.category, 'Developer Tools');

const claudeEntry = claudeMarketplace.plugins?.find((plugin) => plugin.name === 'confbuild');
assert.equal(claudeEntry?.source, './plugins/confbuild');
assert.equal(claudeEntry?.version, codexManifest.version);

const skill = await fs.readFile(path.join(pluginRoot, 'skills', 'confbuild-mcp-agent', 'SKILL.md'), 'utf8');
assert.match(skill, /^---\nname: confbuild-mcp-agent\ndescription: .+\n---/);
assert.match(skill, new RegExp(`pluginVersion: '${codexManifest.version.replaceAll('.', '\\.')}'`));
assert.match(skill, /workflowSource: 'plugin'/);
assert.doesNotMatch(skill, /returned `promptBundle` as the current authoritative workflow/);

await Promise.all([
  'plugins/confbuild/README.md',
  'plugins/confbuild/skills/confbuild-mcp-agent/agents/openai.yaml',
  'plugins/confbuild/skills/confbuild-mcp-agent/references/model-loop.md',
  'plugins/confbuild/skills/confbuild-mcp-agent/references/mcp-tool-contract.md'
].map(requireFile));

process.stdout.write(`confBuild plugin ${codexManifest.version} package, publication boundary, Git history, and both marketplace catalogs are consistent.\n`);
