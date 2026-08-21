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

To update an existing Codex installation and refresh its cached plugin package:

```bash
codex plugin marketplace upgrade confbuild
```

Then start a new Codex session.

For Claude Code:

```bash
claude plugin marketplace add doczoidberg/confbuild-plugins
claude plugin install confbuild@confbuild --scope user
```

To update Claude Code:

```bash
claude plugin marketplace update confbuild
claude plugin update confbuild@confbuild --scope user
```

Then run `/reload-plugins`.

The complete English and German walkthrough is available in the [confBuild MCP setup guide](https://confbuild.com/docs/confbuild-mcp-setup/).

## What gets installed

- Remote OAuth MCP: `https://app.confbuild.com/mcp`
- Skill: `confbuild-mcp-agent`
- Customer model loop: acceptance planning, native part types, deterministic validation, four-view review, and targeted repair
- Codex invocation: `$confbuild-mcp-agent`
- Claude Code invocation: `/confbuild:confbuild-mcp-agent`

No API key, local MCP server, Node.js runtime, or source checkout is required for normal use. The first MCP request opens the confBuild OAuth authorization flow.

The installed skill is a reviewed, versioned workflow snapshot. It starts a design session with `workflowSource: plugin`, so the server returns session, capability, compatibility, and update metadata without replacing the plugin's behavioral instructions at runtime. Hosted tool implementation, validation, rendering, and export improvements reach every user when the MCP service is deployed; workflow changes arrive through a bumped plugin release.

## Repository layout

- `.agents/plugins/marketplace.json`: OpenAI marketplace catalog
- `.claude-plugin/marketplace.json`: Claude Code marketplace catalog
- `plugins/confbuild/`: cross-host plugin package

This self-hosted marketplace is the public beta distribution channel. Inclusion in the OpenAI universal Plugins Directory and Anthropic community marketplace requires separate platform review. Anthropic's separately curated official marketplace has no public application process.

The dated requirements and open submission gates are tracked in [OFFICIAL-DIRECTORIES.md](OFFICIAL-DIRECTORIES.md).

Every release is prepared from the canonical `sheetbuild2/plugins/confbuild` package, assigned one strict-semver version across both host manifests, synchronized here, and checked by this repository's CI before publication.

## Support

See the [setup and troubleshooting guide](https://confbuild.com/docs/confbuild-mcp-setup/) or contact [support@confbuild.com](mailto:support@confbuild.com).
