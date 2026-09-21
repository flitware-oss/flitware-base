#!/usr/bin/env bash
#
# Verifiable TypeScript baseline.
#
# Upstream v0.26.1 ships 4 pre-existing tsc errors (see UPSTREAM.md) that we
# deliberately do NOT fix silently. This gate fails when:
#   - any NEW error appears (Flitware regression), or
#   - a known error disappears without updating scripts/tsc-known-errors.txt
#     (forces a conscious baseline change, never a silent one).
#
# Matching is on `file + TS code + message` with line/col stripped, so
# unrelated edits shifting line numbers don't break the gate, while any
# genuinely new error signature does.
set -u

cd "$(dirname "$0")/.."

RAW="$(mktemp)"
NORM="$(mktemp)"
trap 'rm -f "$RAW" "$NORM"' EXIT

npx tsc --noEmit > "$RAW" 2>&1 || true
sed -E -e 's#^.*/flitware-base/##' -e 's#\([0-9]+,[0-9]+\)##' "$RAW" \
    | grep -E "error TS" | sort > "$NORM" || true

if ! diff -u scripts/tsc-known-errors.txt "$NORM"; then
    echo ""
    echo "TSC BASELINE MISMATCH (see diff above):"
    echo "  - lines prefixed '+' are NEW errors -> fix the regression, or"
    echo "  - lines prefixed '-' are resolved known errors -> update"
    echo "    scripts/tsc-known-errors.txt deliberately in the same change."
    exit 1
fi

echo "tsc baseline OK: $(wc -l < "$NORM" | tr -d ' ') known error(s), 0 new."
