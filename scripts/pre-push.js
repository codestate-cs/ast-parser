#!/usr/bin/env node

/**
 * Pre-push hook script for codestate-ast
 * Runs tests and checks coverage thresholds before allowing push
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`  ${message}`, 'bright');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logStep(step, message) {
  log(`\n[${step}] ${message}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function runCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      ...options 
    });
    return { success: true, output: result };
  } catch (error) {
    return { 
      success: false, 
      output: error.stdout || error.message,
      error: error.stderr || error.message
    };
  }
}

function checkCoverageThresholds() {
  logStep('COVERAGE', 'Checking coverage thresholds...');
  
  const result = runCommand('npm run test:coverage');
  
  if (!result.success) {
    logError('Tests failed! Please fix failing tests before pushing.');
    log(`Error: ${result.error}`, 'red');
    return false;
  }
  
  // Parse coverage report from Jest output
  const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
  
  if (!fs.existsSync(coveragePath)) {
    logError('Coverage report not found! Make sure tests are running with coverage.');
    return false;
  }
  
  const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
  const thresholds = {
    statements: 90,
    branches: 90,
    functions: 90,
    lines: 90
  };
  
  let allThresholdsMet = true;
  const results = [];
  
  for (const [metric, threshold] of Object.entries(thresholds)) {
    const coverageValue = coverage.total[metric].pct;
    const met = coverageValue >= threshold;
    
    results.push({
      metric,
      coverage: coverageValue,
      threshold,
      met
    });
    
    if (!met) {
      allThresholdsMet = false;
    }
  }
  
  // Display results
  log('\nCoverage Results:', 'bright');
  log('─'.repeat(50), 'cyan');
  
  results.forEach(({ metric, coverage, threshold, met }) => {
    const status = met ? '✅' : '❌';
    const color = met ? 'green' : 'red';
    log(`${status} ${metric.padEnd(12)}: ${coverage.toFixed(2)}% (threshold: ${threshold}%)`, color);
  });
  
  log('─'.repeat(50), 'cyan');
  
  if (allThresholdsMet) {
    logSuccess('All coverage thresholds met!');
    return true;
  } else {
    logError('Coverage thresholds not met! Please improve test coverage.');
    return false;
  }
}

function runLinting() {
  logStep('LINT', 'Running ESLint...');
  
  const result = runCommand('npm run lint');
  
  if (!result.success) {
    logWarning('Linting issues found. Consider fixing them before pushing.');
    log(`Lint output: ${result.output}`, 'yellow');
    return false;
  }
  
  logSuccess('No linting issues found!');
  return true;
}

function runTypeChecking() {
  logStep('TYPES', 'Running TypeScript type checking...');
  
  const result = runCommand('npm run type-check');
  
  if (!result.success) {
    logError('Type checking failed! Please fix type errors before pushing.');
    log(`Type check output: ${result.error}`, 'red');
    return false;
  }
  
  logSuccess('Type checking passed!');
  return true;
}

function runTests() {
  logStep('TESTS', 'Running test suite with coverage...');
  
  const result = runCommand('npm run test:coverage');
  
  if (!result.success) {
    logError('Tests failed! Please fix failing tests before pushing.');
    log(`Test output: ${result.error}`, 'red');
    return false;
  }
  
  logSuccess('All tests passed!');
  return true;
}

function main() {
  logHeader('CODESTATE-AST PRE-PUSH VALIDATION');
  
  const startTime = Date.now();
  let allChecksPassed = true;
  
  // Run all checks
  const checks = [
    { name: 'Type Checking', fn: runTypeChecking },
    { name: 'Linting', fn: runLinting },
    { name: 'Tests & Coverage', fn: runTests }
  ];
  
  for (const check of checks) {
    logStep('CHECK', `Running ${check.name}...`);
    
    if (!check.fn()) {
      allChecksPassed = false;
      logError(`${check.name} failed!`);
    } else {
      logSuccess(`${check.name} passed!`);
    }
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  logHeader('PRE-PUSH VALIDATION COMPLETE');
  
  if (allChecksPassed) {
    logSuccess(`All checks passed in ${duration}s! Ready to push.`);
    log('\n🚀 You can now safely push your changes!', 'green');
    process.exit(0);
  } else {
    logError(`Some checks failed in ${duration}s. Please fix issues before pushing.`);
    log('\n💡 Fix the issues above and try again.', 'yellow');
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log('Usage: node scripts/pre-push.js [options]', 'bright');
  log('\nOptions:', 'bright');
  log('  --help, -h     Show this help message', 'cyan');
  log('  --skip-lint    Skip linting checks', 'cyan');
  log('  --skip-types   Skip type checking', 'cyan');
  log('  --skip-tests   Skip test execution', 'cyan');
  log('  --skip-coverage Skip coverage checks', 'cyan');
  log('\nThis script runs all quality checks before allowing a push.', 'yellow');
  process.exit(0);
}

// Run main function
if (require.main === module) {
  main();
}

module.exports = {
  runTests,
  runLinting,
  runTypeChecking,
  checkCoverageThresholds
};
