# confBuild agent plugin

This package is the distribution unit for the hosted confBuild MCP and its agent workflow. Installing the package gives a host both the OAuth-authenticated Remote MCP connection and the `confbuild-mcp-agent` skill. Adding the MCP URL by itself gives the tools and `confbuild-design` prompt, but does not install the skill.

## Host manifests

- `.codex-plugin/plugin.json`: Codex/ChatGPT package metadata.
- `.claude-plugin/plugin.json`: Claude Code package metadata.
- `.mcp.json`: shared Remote MCP connection.
- `skills/confbuild-mcp-agent`: shared deterministic create/edit/validate/render workflow.

Codex invokes the installed skill as `$confbuild-mcp-agent`. Claude Code namespaces plugin skills, so its explicit command is `/confbuild:confbuild-mcp-agent`.

## Install from the confBuild marketplace

The public self-hosted marketplace is distributed from `doczoidberg/confbuild-plugins`. The branded installation guide is available at <https://confbuild.com/install/>.

For Codex and ChatGPT, add the marketplace and install **confBuild** from that source:

```bash
codex plugin marketplace add doczoidberg/confbuild-plugins
codex plugin add confbuild@confbuild
```

Restart an already-open client after installation so the new skill and MCP connection are loaded.

For Claude Code:

```bash
claude plugin marketplace add doczoidberg/confbuild-plugins
claude plugin install confbuild@confbuild
```

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
3. Submit the OpenAI package to the universal Plugins Directory shared by ChatGPT and Codex.
4. Submit the same package to the Anthropic community marketplace for Claude users.

After changing the skill, keep the plugin copy, the repository development copies, and the staged MCP skill in sync. The MCP tests reject drift between the plugin and `.codex/skills/confbuild-mcp-agent`.
