#!/bin/sh

set -u

CHECK_INTERVAL_SECONDS=86400
STALE_LOCK_SECONDS=900

# PLUGIN_ROOT and PLUGIN_DATA are Codex-specific plugin-hook variables. Claude
# Code does not expose PLUGIN_ROOT, so the shared plugin package stays inert
# there and continues to use Claude's own marketplace update flow.
if [ -z "${PLUGIN_ROOT:-}" ] || [ -z "${PLUGIN_DATA:-}" ]; then
  exit 0
fi
if ! command -v codex >/dev/null 2>&1; then
  exit 0
fi

umask 077
if ! mkdir -p "$PLUGIN_DATA" 2>/dev/null; then
  exit 0
fi

state_file="$PLUGIN_DATA/auto-update-last-check"
error_file="$PLUGIN_DATA/auto-update-last-error.log"
lock_dir="$PLUGIN_DATA/auto-update.lock"

now=$(date +%s 2>/dev/null) || exit 0

checked_recently() {
  last_check=$(sed -n '1p' "$state_file" 2>/dev/null || true)
  case "$last_check" in
    ''|*[!0-9]*) return 1 ;;
  esac
  elapsed=$((now - last_check))
  [ "$elapsed" -ge 0 ] && [ "$elapsed" -lt "$CHECK_INTERVAL_SECONDS" ]
}

if checked_recently; then
  exit 0
fi

if ! mkdir "$lock_dir" 2>/dev/null; then
  lock_started=$(sed -n '1p' "$lock_dir/started-at" 2>/dev/null || true)
  case "$lock_started" in
    ''|*[!0-9]*) lock_started=0 ;;
  esac
  lock_age=$((now - lock_started))
  if [ "$lock_age" -le "$STALE_LOCK_SECONDS" ]; then
    exit 0
  fi
  rm -f "$lock_dir/started-at" 2>/dev/null || exit 0
  rmdir "$lock_dir" 2>/dev/null || exit 0
  mkdir "$lock_dir" 2>/dev/null || exit 0
fi

cleanup() {
  rm -f "$lock_dir/started-at" 2>/dev/null || true
  rmdir "$lock_dir" 2>/dev/null || true
}
trap cleanup EXIT HUP INT TERM
printf '%s\n' "$now" > "$lock_dir/started-at" 2>/dev/null || exit 0

# Another session may have completed the check while this one waited for the
# lock. Recheck before contacting the marketplace.
if checked_recently; then
  exit 0
fi

state_temp="$state_file.$$"
if ! printf '%s\n' "$now" > "$state_temp" 2>/dev/null || ! mv "$state_temp" "$state_file" 2>/dev/null; then
  rm -f "$state_temp" 2>/dev/null || true
  exit 0
fi

marketplaces=$(codex plugin marketplace list --json 2>/dev/null) || exit 0
compact_marketplaces=$(printf '%s' "$marketplaces" | tr -d '\r\n')
if ! printf '%s' "$compact_marketplaces" | grep -Eq '"name"[[:space:]]*:[[:space:]]*"confbuild"[^}]*"marketplaceSource"[[:space:]]*:[[:space:]]*\{[^}]*"sourceType"[[:space:]]*:[[:space:]]*"git"[^}]*"source"[[:space:]]*:[[:space:]]*"https://github\.com/doczoidberg/confbuild-plugins(\.git)?"'; then
  exit 0
fi

result_file="$PLUGIN_DATA/auto-update-result.$$"
if ! codex plugin marketplace upgrade confbuild --json > "$result_file" 2>&1; then
  mv "$result_file" "$error_file" 2>/dev/null || true
  exit 0
fi

compact_result=$(tr -d '[:space:]' < "$result_file")
if ! printf '%s' "$compact_result" | grep -Fq '"errors":[]'; then
  mv "$result_file" "$error_file" 2>/dev/null || true
  exit 0
fi

rm -f "$error_file" 2>/dev/null || true
rm -f "$result_file" 2>/dev/null || true
if printf '%s' "$compact_result" | grep -Fq '"upgradedRoots":[]'; then
  exit 0
fi

printf '%s\n' '{"continue":true,"systemMessage":"confBuild was updated automatically. Start a new Codex task to guarantee that the refreshed skill and MCP package are loaded."}'
