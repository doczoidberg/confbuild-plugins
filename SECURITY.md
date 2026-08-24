# Public distribution boundary

This public repository contains only the reviewed confBuild customer plugin
distribution: manifests, customer-facing workflow documentation, minimal updater
hooks, and release validation. It must never receive the confBuild application,
Firebase Functions, hosted MCP implementation, CAD runtime, infrastructure,
internal tests, private prompts, secrets, customer data, or build/deployment
source.

`npm run check` enforces an exact path allowlist over the current checkout and
every reachable Git object. The repository also installs the same check as a
pre-push hook. Unexpected paths, symlinks, submodules, oversized files, and
credential-like material are blocked. Deleting an exposed file in a later commit
does not pass because the historical blob remains subject to the audit.

Releases are synchronized from the private canonical repository into this
isolated checkout. Never add the public remote to the canonical source checkout,
never copy the source tree here, and never bypass the pre-push check.
