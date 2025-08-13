# Branch Protection Rules for Main Branch

This document describes the recommended branch protection rules for the `main` branch to prevent direct pushes and ensure code quality.

## Setting Up Branch Protection Rules

### Via GitHub Web Interface

1. Navigate to **Settings** → **Branches** in your repository
2. Click **Add rule** under "Branch protection rules"
3. Enter `main` as the branch name pattern

### Recommended Settings

#### 1. Require Pull Request Reviews Before Merging
- ✅ **Require a pull request before merging**
  - ✅ **Require approvals**: 1 (minimum)
  - ✅ **Dismiss stale pull request approvals when new commits are pushed**
  - ✅ **Require review from CODEOWNERS** (if CODEOWNERS file exists)

#### 2. Require Status Checks
- ✅ **Require status checks to pass before merging**
  - ✅ **Require branches to be up to date before merging**
  - Required status checks:
    - `test` (from CI workflow)
    - `lint` (from CI workflow)
    - `build` (from CI workflow)

#### 3. Require Conversation Resolution
- ✅ **Require conversation resolution before merging**

#### 4. Require Signed Commits (Optional but Recommended)
- ✅ **Require signed commits**

#### 5. Include Administrators
- ✅ **Include administrators** (ensures rules apply to everyone)

#### 6. Restrict Who Can Push
- ✅ **Restrict who can push to matching branches**
  - No users or teams (everyone must use PRs)

#### 7. Allow Force Pushes
- ❌ **Do not allow force pushes**
- ❌ **Do not allow deletions**

## Branch Protection Rules Configuration JSON

While GitHub doesn't support JSON file-based configuration for branch protection rules, here's the equivalent configuration structure for reference:

```json
{
  "branch_protection_rules": {
    "main": {
      "required_status_checks": {
        "strict": true,
        "contexts": [
          "test",
          "lint",
          "build",
          "typecheck"
        ]
      },
      "enforce_admins": true,
      "required_pull_request_reviews": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews": true,
        "require_code_owner_reviews": true,
        "require_last_push_approval": false
      },
      "restrictions": {
        "users": [],
        "teams": [],
        "apps": []
      },
      "allow_force_pushes": false,
      "allow_deletions": false,
      "required_conversation_resolution": true,
      "lock_branch": false,
      "allow_fork_syncing": false,
      "required_signatures": false
    }
  }
}
```

## GitHub CLI Command

You can also set up branch protection using GitHub CLI:

```bash
# Install GitHub CLI if not already installed
# brew install gh (macOS)
# or visit: https://cli.github.com/

# Authenticate with GitHub
gh auth login

# Set branch protection rules
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["test","lint","build","typecheck"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false \
  --field required_conversation_resolution=true
```

## Enforcement Workflow

Create `.github/workflows/enforce-pr.yml` to add additional checks:

```yaml
name: Enforce PR Rules

on:
  pull_request:
    types: [opened, edited, synchronize]

jobs:
  check-pr:
    runs-on: ubuntu-latest
    steps:
      - name: Check PR Title
        run: |
          if ! echo "${{ github.event.pull_request.title }}" | grep -qE '^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .+'; then
            echo "PR title must follow conventional commits format"
            echo "Examples:"
            echo "  feat(auth): add login functionality"
            echo "  fix(api): resolve memory leak"
            echo "  docs: update README"
            exit 1
          fi

      - name: Check PR Description
        run: |
          if [ -z "${{ github.event.pull_request.body }}" ]; then
            echo "PR description cannot be empty"
            exit 1
          fi

      - name: Check Branch Name
        run: |
          branch="${{ github.head_ref }}"
          if ! echo "$branch" | grep -qE '^(feature|fix|docs|refactor|test|chore)/.+'; then
            echo "Branch name must follow the pattern: type/description"
            echo "Valid types: feature, fix, docs, refactor, test, chore"
            exit 1
          fi
```

## Benefits of These Rules

### 1. **Code Quality Assurance**
- All code must pass tests, linting, and build checks
- Peer review catches bugs and improves code quality

### 2. **Collaboration**
- Team members review each other's code
- Knowledge sharing through code reviews

### 3. **Audit Trail**
- All changes are documented through PRs
- Clear history of who approved what and when

### 4. **Prevents Accidents**
- No accidental pushes to main
- No force pushes that could lose history
- No branch deletion

### 5. **Consistent Process**
- Everyone follows the same workflow
- Predictable and reliable development process

## Exceptions and Overrides

In emergency situations where direct push is absolutely necessary:

1. **Temporary Disable**: Repository admin can temporarily disable protection
2. **Hotfix Branch**: Create a hotfix branch with relaxed rules
3. **Admin Override**: Admins can merge without reviews (if not enforced on admins)

⚠️ **Important**: Always re-enable protection after emergency fixes

## Team Guidelines

### For Contributors
1. Always create a feature branch
2. Open a PR when ready for review
3. Address review comments
4. Keep PRs small and focused

### For Reviewers
1. Review promptly (within 24 hours)
2. Provide constructive feedback
3. Approve only when satisfied with changes
4. Use "Request changes" sparingly

### For Maintainers
1. Monitor PR queue regularly
2. Merge PRs promptly after approval
3. Keep protection rules up to date
4. Document any rule changes

## Monitoring and Compliance

### Regular Audits
- Review merged PRs monthly
- Check for bypassed rules
- Update rules based on team feedback

### Metrics to Track
- Average PR review time
- Number of force pushes prevented
- Failed status checks caught
- Direct push attempts blocked

## Troubleshooting

### Common Issues

1. **"Push rejected"**
   - Solution: Create a branch and PR

2. **"Required status checks failing"**
   - Solution: Fix tests/lint issues locally first

3. **"PR needs approval"**
   - Solution: Request review from team member

4. **"Branch out of date"**
   - Solution: Merge or rebase with main

## Additional Resources

- [GitHub Docs: About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)
- [GitHub Docs: Managing branch protection rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/managing-a-branch-protection-rule)
- [Conventional Commits](https://www.conventionalcommits.org/)