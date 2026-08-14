# confBuild Plugins

Public plugin marketplace for the hosted [confBuild](https://confbuild.com/) OAuth MCP and its deterministic parametric 3D modeling workflow.

The repository contains marketplace catalogs for OpenAI clients and Claude Code plus the shared `confbuild` plugin package. You can inspect the host manifests, skill instructions, and exact MCP endpoint before installing anything.

## Install

For ChatGPT and Codex, add this marketplace and install the plugin:

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

The complete English and German walkthrough is available at [confbuild.com/install](https://confbuild.com/install/).

## What gets installed

- Remote OAuth MCP: `https://app.confbuild.com/mcp`
- Skill: `confbuild-mcp-agent`
- Codex invocation: `$confbuild-mcp-agent`
- Claude Code invocation: `/confbuild:confbuild-mcp-agent`

No API key, local MCP server, Node.js runtime, or source checkout is required for normal use. The first MCP request opens the confBuild OAuth authorization flow.

## Repository layout

- `.agents/plugins/marketplace.json`: OpenAI marketplace catalog
- `.claude-plugin/marketplace.json`: Claude Code marketplace catalog
- `plugins/confbuild/`: cross-host plugin package

This self-hosted marketplace is the public beta distribution channel. Inclusion in the OpenAI universal Plugins Directory and Anthropic community marketplace requires separate platform review.

## Support

See the [setup and troubleshooting guide](https://confbuild.com/docs/confbuild-mcp-setup/) or contact [support@confbuild.com](mailto:support@confbuild.com).
