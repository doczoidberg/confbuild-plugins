# confBuild agent plugin

This package is the distribution unit for the hosted confBuild MCP and its agent workflow. Installing the package gives a host both the OAuth-authenticated Remote MCP connection and the `confbuild-mcp-agent` skill. Adding the MCP URL by itself gives the tools and `confbuild-design` prompt, but does not install the skill.

## Host manifests

- `.codex-plugin/plugin.json`: Codex/ChatGPT package metadata.
- `.claude-plugin/plugin.json`: Claude Code package metadata.
- `.mcp.json`: shared Remote MCP connection.
- `skills/confbuild-mcp-agent`: shared native-first create/edit/validate/four-view repair workflow.

The customer skill carries the portable quality principles from confBuild's internal model loop without requiring repository access or local generator scripts. It plans acceptance and assemblies before writing rows, prefers native part types, gates every commit through deterministic validation, inspects four rendered views, classifies defects before repair, and stops after a clean pass or a bounded iteration budget. Installed plugins use the reviewed workflow snapshot packaged in `skills/`; direct MCP-only clients receive the same loop inside the server prompt bundle.

Codex invokes the installed skill as `$confbuild-mcp-agent`. Claude Code namespaces plugin skills, so its explicit command is `/confbuild:confbuild-mcp-agent`.

## Install from the confBuild marketplace

The public self-hosted marketplace is distributed from `doczoidberg/confbuild-plugins`. The installation and setup guide is available at <https://confbuild.com/docs/confbuild-mcp-setup/>.

For Codex and ChatGPT, add the marketplace and install **confBuild** from that source:

```bash
codex plugin marketplace add doczoidberg/confbuild-plugins
codex plugin add confbuild@confbuild
```

Restart an already-open client after installation so the new skill and MCP connection are loaded.

To update an installed Codex/ChatGPT plugin from this GitHub marketplace:

```bash
codex plugin marketplace upgrade confbuild
```

Start a new session after the upgrade so the refreshed skill is loaded.

For Claude Code:

```bash
claude plugin marketplace add doczoidberg/confbuild-plugins
claude plugin install confbuild@confbuild --scope user
```

Reload an already-open Claude Code session with `/reload-plugins`; a new session is not required. Then open `/mcp` to approve OAuth and invoke `/confbuild:confbuild-mcp-agent`.

To update an existing user-scoped installation:

```bash
claude plugin marketplace update confbuild
claude plugin update confbuild@confbuild --scope user
```

Use the scope shown by `claude plugin list --json` if the plugin was deliberately installed at project or local scope. The plugin already owns the hosted `confbuild` MCP connection. Do not add the same endpoint manually, and give repository-only developer servers a distinct name such as `confbuild-local`, because Claude gives local and project MCP definitions precedence over plugin-provided servers.

The self-hosted marketplace is the public beta distribution channel. Listing in the OpenAI universal Plugins Directory and Anthropic community marketplace remains a separate review process.

## Validate locally

Use the OpenAI plugin validator from the installed `plugin-creator` skill and the Claude Code validator:

```bash
python3 ~/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py plugins/confbuild
claude plugin validate plugins/confbuild
npm run mcp:confbuild:test
```

For a local Claude Code runtime check, start Claude with `claude --plugin-dir ./plugins/confbuild`. A Codex/ChatGPT local install requires a local marketplace entry; do not confuse that authoring path with public customer distribution.

## Official directory publication

Public availability still requires external registration and review:

1. Register `https://app.confbuild.com/mcp` as the plugin's remote OAuth MCP connection in ChatGPT developer mode and add the resulting registered app mapping when required by the submission flow.
2. Run Scan Tools. The server advertises `io.modelcontextprotocol/skills`, `skills/list`, `skills/get`, and every declared `resources/read` URI so the draft can import and verify a static skill snapshot.
3. Submit the OpenAI package to the universal Plugins Directory shared by ChatGPT and Codex. Every behavioral skill change is a reviewed snapshot update, not a live server-side replacement.
4. Validate the Claude package with `claude plugin validate`, then submit the public Git repository to the Anthropic community marketplace. The separately curated `claude-plugins-official` marketplace has no public application process.

The installed skill starts with `workflowSource: 'plugin'`, so the MCP server omits runtime behavioral instructions and returns only session, target, capability, compatibility, and update metadata. Tool implementation changes still become available to every user when the hosted MCP is deployed; behavioral workflow changes travel through the versioned plugin and the relevant marketplace review/update path.

After changing the skill, keep the plugin copy, the repository development copies, and the staged MCP skill in sync. The MCP tests reject drift between the plugin and `.codex/skills/confbuild-mcp-agent`.

## Maintainer release flow

The canonical package lives at `sheetbuild2/plugins/confbuild`; `doczoidberg/confbuild-plugins` is the customer-facing distribution repository. Prepare one aligned release from the main `sheetbuild2` repository with:

```bash
npm run mcp:confbuild:plugin:release -- 0.10.0
```

The command applies the strict-semver version to both host manifests, the bootstrap skill, and the MCP's latest-client marker; synchronizes the repository and installed skill mirrors; copies the complete package to the adjacent `confbuild-plugins` checkout; and updates the Claude marketplace catalog version. It deliberately does not commit, push, merge, submit to an official directory, or deploy the MCP server.

Before publishing either repository, run:

```bash
python3 ~/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py plugins/confbuild
python3 ~/.codex/skills/.system/skill-creator/scripts/quick_validate.py plugins/confbuild/skills/confbuild-mcp-agent
npm run mcp:confbuild:test
npm run mcp:confbuild:plugin:release-check
npm --prefix ../confbuild-plugins run check
```

Review and publish the main repository and distribution repository independently. Deploying the hosted MCP remains a separate explicit release step; ordinary plugin publication never deploys Firebase.
