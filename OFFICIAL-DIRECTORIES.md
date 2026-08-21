# Official directory readiness

Status reviewed on 2026-08-21. Platform requirements can change; re-check the linked primary sources immediately before submission.

## Distribution architecture

- `sheetbuild2/plugins/confbuild` is the canonical source package.
- This repository is the public customer marketplace and release copy.
- One semantic version is shared by the Codex manifest, Claude manifest, Claude marketplace entry, repository package, and the client version reported to the MCP server.
- Hosted MCP deployments update compatible tools and infrastructure for every user.
- Behavioral workflow changes are reviewed plugin snapshots. Installed plugins pass `workflowSource: plugin`, so the MCP server does not replace their behavioral instructions at runtime.

## OpenAI universal Plugins Directory

Current technical foundation:

- public production Streamable HTTP MCP at `https://app.confbuild.com/mcp`;
- OAuth/PKCE and per-tool scopes;
- dual MCP-plus-skill package and static skill import surface;
- complete read/write/destructive/open-world tool annotations;
- public website, privacy, terms, support, and setup URLs;
- package, skill, protocol, Functions, and benchmark validation.

Submission work still required:

- verify the publishing individual or business in the OpenAI Platform and confirm Apps Management write access;
- complete the generated domain-verification challenge;
- provide a reviewer account with useful sample projects and no MFA/email/SMS gate;
- prepare at least five positive and three negative reproducible test cases;
- review all 29 tool schemas, annotations, and returned fields against privacy disclosures;
- supply production listing copy, logo, category, starter prompts, regions, and release notes;
- scan the final MCP tools and skill snapshot, fix every finding, submit, and publish only after approval.

Primary source: [OpenAI plugin submission](https://developers.openai.com/plugins/deploy/submission).

## Anthropic marketplaces

The public application route is the reviewed `claude-community` marketplace. Run `claude plugin validate plugins/confbuild` before submission; approved packages are pinned to a repository commit, and the community catalog's CI advances that pin when new commits are pushed.

Submission work still required:

- provide verified contact/support information, public privacy documentation, and clear troubleshooting documentation;
- provide a standard reviewer account with sample data;
- prepare at least three working prompt/use-case examples;
- re-audit tool descriptions, token use, error handling, OAuth, annotations, and returned data against the directory policy;
- decide and document the package's license/usage rights before broad public promotion.

Anthropic's separately curated `claude-plugins-official` marketplace has no public application process. Community approval therefore does not imply or trigger an official-marketplace listing.

Primary sources: [Claude plugin submission](https://code.claude.com/docs/en/plugins#submit-your-plugin-to-the-community-marketplace), [Anthropic Software Directory Policy](https://support.claude.com/en/articles/13145358-anthropic-software-directory-policy), and [Anthropic Software Directory Terms](https://support.claude.com/en/articles/13145338-anthropic-software-directory-terms).
