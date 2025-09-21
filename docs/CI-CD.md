# CI/CD Pipeline Documentation

This document describes the Continuous Integration and Continuous Deployment pipeline for the `codestate-ast` project.

## Overview

The project includes comprehensive CI/CD workflows that ensure code quality, test coverage, and automated deployment. All workflows are designed to maintain the high standards required for a production-ready library.

## GitHub Actions Workflows

### 1. Main CI/CD Pipeline (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Features:**
- Multi-Node.js version testing (18.x, 20.x)
- Automated dependency installation with caching
- Linting and type checking
- Comprehensive test execution with coverage
- Coverage threshold validation
- Security auditing
- Automated npm publishing (main branch only)

**Coverage Thresholds:**
- Statements: 90%
- Branches: 90%
- Functions: 90%
- Lines: 90%

### 2. Pull Request Validation (`.github/workflows/pr-validation.yml`)

**Triggers:**
- Pull requests to `main` or `develop` branches
- PR updates and reopens

**Features:**
- Comprehensive PR validation
- Coverage reporting with PR comments
- Build verification
- Detailed coverage metrics display

## Local Development Tools

### Pre-Push Hook (`scripts/pre-push.js`)

A comprehensive pre-push validation script that runs locally before pushing code.

**Usage:**
```bash
# Run all checks
npm run pre-push

# Or run directly
node scripts/pre-push.js
```

**Features:**
- Type checking
- Linting
- Test execution
- Coverage threshold validation
- Colored output with detailed reporting
- Configurable checks via command-line flags

**Command-line Options:**
```bash
node scripts/pre-push.js --help
node scripts/pre-push.js --skip-lint
node scripts/pre-push.js --skip-types
node scripts/pre-push.js --skip-tests
node scripts/pre-push.js --skip-coverage
```

### Husky Git Hooks

Automatically runs pre-push validation using Husky:

```bash
# Install husky (if not already installed)
npm install --save-dev husky

# Install the pre-push hook
npx husky install
npx husky add .husky/pre-push "npm run pre-push"
```

## Package.json Scripts

The following scripts are available for CI/CD operations:

```json
{
  "scripts": {
    "test:ci": "jest --coverage --watchAll=false --silent",
    "type-check": "tsc --noEmit",
    "pre-push": "node scripts/pre-push.js",
    "ci": "npm run type-check && npm run lint && npm run test:ci"
  }
}
```

## Coverage Requirements

### Global Thresholds
All coverage thresholds are set to **90%** minimum:

- **Statements**: 90%
- **Branches**: 90%
- **Functions**: 90%
- **Lines**: 90%

### Current Coverage Status
As of the latest build:
- **Overall Coverage**: 91.63% ✅
- **Statements**: 91.63% ✅
- **Branches**: 90.19% ✅
- **Functions**: 96% ✅
- **Lines**: 91.5% ✅

## Workflow Status Badges

Add these badges to your README.md:

```markdown
![CI/CD Pipeline](https://github.com/codestate/codestate-ast/workflows/CI/CD%20Pipeline/badge.svg)
![PR Validation](https://github.com/codestate/codestate-ast/workflows/Pull%20Request%20Validation/badge.svg)
![Coverage](https://codecov.io/gh/codestate/codestate-ast/branch/main/graph/badge.svg)
```

## Security Features

### Security Audit
- Automated npm audit on every CI run
- Moderate and high severity vulnerability checks
- Non-blocking warnings for low-severity issues

### Dependency Management
- Automated dependency updates via Dependabot
- Lock file validation
- Security scanning of dependencies

## Deployment

### Automatic Publishing
- Triggers on push to `main` branch
- Requires `NPM_TOKEN` secret in repository settings
- Publishes to npm registry automatically
- Includes build verification before publishing

### Manual Publishing
```bash
# Build the project
npm run build

# Run all checks
npm run ci

# Publish to npm
npm publish
```

## Troubleshooting

### Common Issues

1. **Coverage Threshold Failures**
   ```bash
   # Check current coverage
   npm run test:coverage
   
   # Improve coverage by adding tests
   # Focus on uncovered lines shown in the report
   ```

2. **Linting Failures**
   ```bash
   # Fix linting issues automatically
   npm run lint:fix
   
   # Check specific files
   npx eslint src/path/to/file.ts
   ```

3. **Type Checking Failures**
   ```bash
   # Run type checking
   npm run type-check
   
   # Check specific files
   npx tsc --noEmit src/path/to/file.ts
   ```

4. **Test Failures**
   ```bash
   # Run tests with verbose output
   npm test -- --verbose
   
   # Run specific test file
   npm test -- tests/unit/path/to/test.test.ts
   ```

### Local Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up pre-push hooks:**
   ```bash
   npx husky install
   npx husky add .husky/pre-push "npm run pre-push"
   ```

3. **Run validation:**
   ```bash
   npm run pre-push
   ```

## Best Practices

### Before Pushing
1. Run `npm run pre-push` locally
2. Ensure all tests pass
3. Verify coverage thresholds are met
4. Fix any linting or type issues

### Before Creating PR
1. Update tests for new functionality
2. Ensure adequate test coverage
3. Update documentation if needed
4. Run full CI pipeline locally

### Code Quality Standards
- All code must pass ESLint rules
- TypeScript strict mode enabled
- 90% minimum test coverage
- Comprehensive error handling
- Proper documentation

## Monitoring and Alerts

### Coverage Monitoring
- Coverage reports uploaded to Codecov
- PR comments with coverage details
- Threshold enforcement in CI

### Build Status
- GitHub Actions status checks
- Branch protection rules
- Required status checks for merging

## Contributing

When contributing to this project:

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Add comprehensive tests**
5. **Run `npm run pre-push`**
6. **Create a pull request**
7. **Ensure CI passes**
8. **Address any review feedback**

The CI/CD pipeline will automatically validate your changes and provide feedback on coverage, quality, and build status.
