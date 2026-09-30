#!/usr/bin/env bash
#
# Publish scheduled blog articles.
#
# For every open pull request that adds or updates a blog article whose front
# matter is dated today (UTC) or earlier and is not a draft, this script
# confirms the article's checks passed, marks the pull request ready for review
# when it is still a draft, and squash-merges it. Merging with the workflow
# token does not trigger the push-based Deploy Pages workflow, so it dispatches
# that workflow once at the end.
#
# Run by .github/workflows/publish-scheduled-blog.yml every day at 00:00 UTC.
# DRY_RUN=1 reports what would merge without changing anything; PUBLISH_DATE
# overrides today's date (YYYY-MM-DD).

set -euo pipefail

# Accept 1/true (and their uppercase forms) as "dry run"; anything else is off.
case "${DRY_RUN:-0}" in
  1|true|True|TRUE) dry_run=1 ;;
  *) dry_run=0 ;;
esac

today="${PUBLISH_DATE:-$(date -u +%F)}"
repo="${GITHUB_REPOSITORY:-}"
if [ -z "$repo" ]; then
  repo="$(gh repo view --json nameWithOwner --jq '.nameWithOwner')"
fi

echo "Scheduled blog publish for $today (UTC) in $repo; dry_run=$dry_run"

merged=0

while IFS= read -r number; do
  [ -n "$number" ] || continue

  title="$(gh pr view "$number" --json title --jq '.title')"
  base="$(gh pr view "$number" --json baseRefName --jq '.baseRefName')"
  if [ "$base" != "master" ]; then
    echo "PR #$number: base is '$base', not master, skipping"
    continue
  fi

  # Find a changed blog article that is due and marked publishable.
  article=""
  while IFS= read -r path; do
    case "$path" in
      content/blog/*.md) ;;
      *) continue ;;
    esac

    head_sha="$(gh pr view "$number" --json headRefOid --jq '.headRefOid')"
    body="$(gh api -H 'Accept: application/vnd.github.raw' \
      "repos/$repo/contents/$path?ref=$head_sha")"
    date="$(printf '%s\n' "$body" | awk '/^date[[:space:]]*=/ { sub(/^[^=]*=[[:space:]]*/, ""); gsub(/["\r]/, ""); print; exit }')"
    draft="$(printf '%s\n' "$body" | awk '/^draft[[:space:]]*=/ { sub(/^[^=]*=[[:space:]]*/, ""); gsub(/["\r]/, ""); print; exit }')"

    if [[ "$date" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ && ! "$date" > "$today" && "$draft" == "false" ]]; then
      article="$path"
      break
    fi
  done < <(gh pr diff "$number" --name-only)

  if [ -z "$article" ]; then
    echo "PR #$number: no publishable article dated $today or earlier, skipping"
    continue
  fi

  echo "PR #$number \"$title\": article $article is due"

  checks="$(gh pr view "$number" --json statusCheckRollup --jq '
    [ .statusCheckRollup[] |
      if .__typename == "CheckRun" then
        (if .status != "COMPLETED" then "pending"
         else (.conclusion // "failure" | ascii_downcase) end)
      else
        (if .state == "SUCCESS" then "success"
         elif .state == "PENDING" then "pending"
         else "failure" end)
      end
    ] | unique | join(",")')"
  echo "PR #$number: checks=$checks"

  if [ -z "$checks" ]; then
    echo "PR #$number: no checks reported yet, leaving it for the next run"
    continue
  fi
  case ",$checks," in
    *",pending,"*|*",failure,"*|*",cancelled,"*|*",timed_out,"*|*",action_required,"*|*",startup_failure,"*|*",stale,"*)
      echo "PR #$number: checks are not green, leaving it for the next run"
      continue
      ;;
  esac

  if [ "$dry_run" = "1" ]; then
    echo "PR #$number: would merge (dry run)"
    merged=$((merged + 1))
    continue
  fi

  if [ "$(gh pr view "$number" --json isDraft --jq '.isDraft')" = "true" ]; then
    echo "PR #$number: marking ready for review"
    gh pr ready "$number"
  fi

  # Mergeability can lag right after readiness flips; poll briefly.
  mergeable="UNKNOWN"
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    mergeable="$(gh pr view "$number" --json mergeable --jq '.mergeable')"
    [ "$mergeable" = "MERGEABLE" ] && break
    [ "$mergeable" = "CONFLICTING" ] && break
    sleep 3
  done
  if [ "$mergeable" != "MERGEABLE" ]; then
    echo "PR #$number: mergeable=$mergeable, leaving it for the next run"
    continue
  fi

  echo "PR #$number: squash-merging"
  if gh pr merge "$number" --squash --delete-branch; then
    merged=$((merged + 1))
  else
    echo "PR #$number: merge failed, leaving it for the next run"
  fi
done < <(gh pr list --state open --limit 100 --json number --jq '.[].number')

if [ "$merged" -eq 0 ]; then
  echo "Nothing to publish."
  exit 0
fi

echo "Merged $merged pull request(s)."
if [ "$dry_run" = "1" ]; then
  exit 0
fi

echo "Dispatching Deploy Pages (the token merge suppressed the push event)."
gh workflow run deploy-pages.yml --ref master
