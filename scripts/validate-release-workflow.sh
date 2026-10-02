#!/usr/bin/env bash
set -euo pipefail

WORKFLOW_FILE=".github/workflows/release.yml"

if [[ ! -f "$WORKFLOW_FILE" ]]; then
  echo "❌ Error: $WORKFLOW_FILE not found" >&2
  exit 1
fi

CONTENT=$(cat "$WORKFLOW_FILE")

# 1. Triggered only on semantic version tags v*.*.*
if ! echo "$CONTENT" | grep -q "tags:" || ! echo "$CONTENT" | grep -q "'v\*.\*.\*'"; then
  echo "❌ Error: Workflow must trigger on tag pattern 'v*.*.*'" >&2
  exit 1
fi

# 2. Permissions check
if ! echo "$CONTENT" | grep -q "contents: read" || ! echo "$CONTENT" | grep -q "packages: write"; then
  echo "❌ Error: Workflow must declare 'contents: read' and 'packages: write'" >&2
  exit 1
fi

# 3. GitHub environment check
if ! echo "$CONTENT" | grep -q "environment: production"; then
  echo "❌ Error: Deployment job must declare 'environment: production'" >&2
  exit 1
fi

# 4. Strict SSH host key verification (never disable StrictHostKeyChecking)
if echo "$CONTENT" | grep -i -E "StrictHostKeyChecking(=|[[:space:]]+)no"; then
  echo "❌ Security Error: StrictHostKeyChecking=no is strictly FORBIDDEN in release workflow!" >&2
  exit 1
fi

# 5. Pinned known-host entry verification
if ! echo "$CONTENT" | grep -q "PROD_SSH_HOST_KEY"; then
  echo "❌ Error: Release workflow must configure pinned known_hosts using PROD_SSH_HOST_KEY secret" >&2
  exit 1
fi

# 6. Never publish mutable :latest tag
if echo "$CONTENT" | grep -q ":latest"; then
  echo "❌ Error: Release workflow must not publish or use mutable :latest tag" >&2
  exit 1
fi

echo "✅ Release workflow validation PASSED! All security and policy invariants verified."
