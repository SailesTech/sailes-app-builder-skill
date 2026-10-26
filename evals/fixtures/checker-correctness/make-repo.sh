#!/bin/sh
# Materialise one scenario as a throw-away git repo: commit 1 = base/, commit 2 = base + patch.
# usage: make-repo.sh <a|b|c|d> <empty-output-dir>
# prints:  BASE=<sha>  HEAD=<sha>  SPEC=<path to the scenario's spec>
set -eu
here=$(cd "$(dirname "$0")" && pwd)
case "${1:-}" in
  a) patch=a-removed-guard;       spec=a-idempotent-archive ;;
  b) patch=b-broken-caller;       spec=b-archived-at-in-view ;;
  c) patch=c-review-md-and-gen;   spec=c-search-notes ;;
  d) patch=d-pre-existing;        spec=d-list-hides-archived ;;
  *) echo "usage: $0 <a|b|c|d> <empty-output-dir>" >&2; exit 2 ;;
esac
out=${2:?output dir}
mkdir -p "$out"
[ -z "$(ls -A "$out")" ] || { echo "output dir not empty: $out" >&2; exit 2; }
cp -R "$here/base/." "$out/"
cd "$out"
git init -q
git add -A
git -c user.name=fixture -c user.email=fixture@example.invalid commit -q -m "base"
base=$(git rev-parse HEAD)
git apply "$here/patches/$patch.patch"
git add -A
git -c user.name=fixture -c user.email=fixture@example.invalid commit -q -m "the change under review"
echo "BASE=$base HEAD=$(git rev-parse HEAD) SPEC=$here/specs/$spec.md"
