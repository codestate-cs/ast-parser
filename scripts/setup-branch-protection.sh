#!/bin/bash

# Branch Protection Setup Script
# This script helps set up branch protection rules for the repository

set -e

echo "🔒 Setting up branch protection rules..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not in a git repository. Please run this script from the repository root."
    exit 1
fi

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Please install it first:"
    echo "   https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI. Please run 'gh auth login' first."
    exit 1
fi

echo "✅ GitHub CLI is available and authenticated"

# Get repository information
REPO_OWNER=$(gh repo view --json owner --jq '.owner.login')
REPO_NAME=$(gh repo view --json name --jq '.name')

echo "📋 Repository: $REPO_OWNER/$REPO_NAME"

# Function to apply branch protection
apply_branch_protection() {
    local branch=$1
    echo "🔒 Applying protection rules to $branch branch..."
    
    # Apply branch protection rules
    gh api repos/$REPO_OWNER/$REPO_NAME/branches/$branch/protection \
        --method PUT \
        --field required_status_checks='{"strict":true,"contexts":["CI/CD Pipeline","PR Validation","Build Check"]}' \
        --field enforce_admins=true \
        --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":false,"require_last_push_approval":false}' \
        --field allow_force_pushes=false \
        --field allow_deletions=false \
        --field required_linear_history=false \
        --field allow_squash_merge=true \
        --field allow_merge_commit=true \
        --field allow_rebase_merge=true \
        --field allow_auto_merge=false
    
    echo "✅ Branch protection applied to $branch"
}

# Apply protection to main branch
apply_branch_protection "main"

# Check if develop branch exists and apply protection
if gh api repos/$REPO_OWNER/$REPO_NAME/branches/develop &> /dev/null; then
    apply_branch_protection "develop"
else
    echo "⚠️ Develop branch doesn't exist yet, skipping..."
fi

echo ""
echo "🎉 Branch protection setup complete!"
echo ""
echo "📋 Protection rules applied:"
echo "  ✅ Required status checks: CI/CD Pipeline, PR Validation, Build Check"
echo "  ✅ Required pull request reviews: 1 approval"
echo "  ✅ Enforce admins: true"
echo "  ✅ Allow force pushes: false"
echo "  ✅ Allow deletions: false"
echo ""
echo "🔍 You can verify the protection rules in GitHub:"
echo "   https://github.com/$REPO_OWNER/$REPO_NAME/settings/branches"
echo ""
echo "⚠️  Note: All future PRs will now require:"
echo "   - All CI/CD checks to pass"
echo "   - At least 1 code review approval"
echo "   - No direct pushes to protected branches"
