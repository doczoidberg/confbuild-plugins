#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pluginRoot = path.join(repositoryRoot, 'plugins', 'confbuild');
const semverPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(repositoryRoot, relativePath), 'utf8'));
}

async function requireFile(relativePath) {
  const stat = await fs.stat(path.join(repositoryRoot, relativePath));
  assert.equal(stat.isFile(), true, `${relativePath} must be a file`);
}

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

process.stdout.write(`confBuild plugin ${codexManifest.version} package and both marketplace catalogs are consistent.\n`);
