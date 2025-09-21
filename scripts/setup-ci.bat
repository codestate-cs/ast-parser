@echo off
REM Setup script for CI/CD development environment on Windows
REM This script helps developers set up the necessary tools for local CI/CD validation

setlocal enabledelayedexpansion

echo 🚀 Setting up CI/CD development environment for codestate-ast
echo ==========================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 16 or higher
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1 delims=v" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=1 delims=." %%i in ("%NODE_VERSION%") do set NODE_MAJOR=%%i

if %NODE_MAJOR% lss 16 (
    echo [ERROR] Node.js version %NODE_VERSION% is too old. Please upgrade to Node.js 16 or higher
    exit /b 1
) else (
    echo [SUCCESS] Node.js version %NODE_VERSION% is compatible
)

REM Install dependencies
echo [INFO] Installing project dependencies...
call npm ci
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)
echo [SUCCESS] Dependencies installed successfully

REM Set up Husky
echo [INFO] Setting up Husky for Git hooks...

REM Check if husky is installed
npm list husky >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Installing Husky...
    call npm install --save-dev husky
)

REM Initialize husky
echo [INFO] Initializing Husky...
call npx husky install

REM Add pre-push hook
echo [INFO] Adding pre-push hook...
call npx husky add .husky/pre-push "npm run pre-push"

echo [SUCCESS] Husky setup completed

REM Verify setup
echo [INFO] Verifying setup...

if exist "scripts\pre-push.js" (
    echo [SUCCESS] Pre-push script found
) else (
    echo [ERROR] Pre-push script not found
    exit /b 1
)

if exist ".husky\pre-push" (
    echo [SUCCESS] Husky pre-push hook found
) else (
    echo [ERROR] Husky pre-push hook not found
    exit /b 1
)

REM Test pre-push script
echo [INFO] Testing pre-push script...
node scripts/pre-push.js --help >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Pre-push script is working
) else (
    echo [WARNING] Pre-push script test failed, but this might be normal
)

REM Run initial validation
echo [INFO] Running initial validation...

REM Type checking
echo [INFO] Running type checking...
call npm run type-check
if %errorlevel% neq 0 (
    echo [ERROR] Type checking failed
    exit /b 1
)
echo [SUCCESS] Type checking passed

REM Linting
echo [INFO] Running linting...
call npm run lint
if %errorlevel% neq 0 (
    echo [WARNING] Linting issues found. Run 'npm run lint:fix' to fix them
) else (
    echo [SUCCESS] Linting passed
)

REM Tests
echo [INFO] Running tests...
call npm run test:ci
if %errorlevel% neq 0 (
    echo [ERROR] Tests failed
    exit /b 1
)
echo [SUCCESS] Tests passed

echo.
echo [SUCCESS] CI/CD setup completed successfully! 🎉
echo.
echo Next steps:
echo 1. Make your changes
echo 2. Run 'npm run pre-push' to validate before pushing
echo 3. The pre-push hook will run automatically when you push
echo 4. Create pull requests to trigger CI/CD validation
echo.
echo Available commands:
echo   npm run pre-push     - Run all validation checks
echo   npm run test:ci       - Run tests with coverage
echo   npm run type-check    - Run TypeScript type checking
echo   npm run lint          - Run ESLint
echo   npm run ci            - Run all CI checks
echo.

pause
