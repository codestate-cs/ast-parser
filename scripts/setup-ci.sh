#!/bin/bash

# Setup script for CI/CD development environment
# This script helps developers set up the necessary tools for local CI/CD validation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 16 ]; then
            print_success "Node.js version $(node --version) is compatible"
            return 0
        else
            print_error "Node.js version $(node --version) is too old. Please upgrade to Node.js 16 or higher"
            return 1
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 16 or higher"
        return 1
    fi
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing project dependencies..."
    if npm ci; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        return 1
    fi
}

# Function to set up Husky
setup_husky() {
    print_status "Setting up Husky for Git hooks..."
    
    # Check if husky is installed
    if ! command_exists npx; then
        print_error "npx is not available. Please ensure npm is properly installed"
        return 1
    fi
    
    # Install husky if not already installed
    if ! npm list husky >/dev/null 2>&1; then
        print_status "Installing Husky..."
        npm install --save-dev husky
    fi
    
    # Initialize husky
    print_status "Initializing Husky..."
    npx husky install
    
    # Add pre-push hook
    print_status "Adding pre-push hook..."
    npx husky add .husky/pre-push "npm run pre-push"
    
    # Make the hook executable
    chmod +x .husky/pre-push
    
    print_success "Husky setup completed"
}

# Function to verify setup
verify_setup() {
    print_status "Verifying setup..."
    
    # Check if pre-push script exists
    if [ -f "scripts/pre-push.js" ]; then
        print_success "Pre-push script found"
    else
        print_error "Pre-push script not found"
        return 1
    fi
    
    # Check if husky hook exists
    if [ -f ".husky/pre-push" ]; then
        print_success "Husky pre-push hook found"
    else
        print_error "Husky pre-push hook not found"
        return 1
    fi
    
    # Test pre-push script
    print_status "Testing pre-push script..."
    if node scripts/pre-push.js --help >/dev/null 2>&1; then
        print_success "Pre-push script is working"
    else
        print_warning "Pre-push script test failed, but this might be normal"
    fi
}

# Function to run initial validation
run_validation() {
    print_status "Running initial validation..."
    
    # Type checking
    print_status "Running type checking..."
    if npm run type-check; then
        print_success "Type checking passed"
    else
        print_error "Type checking failed"
        return 1
    fi
    
    # Linting
    print_status "Running linting..."
    if npm run lint; then
        print_success "Linting passed"
    else
        print_warning "Linting issues found. Run 'npm run lint:fix' to fix them"
    fi
    
    # Tests
    print_status "Running tests..."
    if npm run test:ci; then
        print_success "Tests passed"
    else
        print_error "Tests failed"
        return 1
    fi
}

# Main setup function
main() {
    echo "🚀 Setting up CI/CD development environment for codestate-ast"
    echo "=========================================================="
    
    # Check Node.js version
    if ! check_node_version; then
        exit 1
    fi
    
    # Install dependencies
    if ! install_dependencies; then
        exit 1
    fi
    
    # Set up Husky
    if ! setup_husky; then
        exit 1
    fi
    
    # Verify setup
    if ! verify_setup; then
        print_error "Setup verification failed"
        exit 1
    fi
    
    # Run initial validation
    if ! run_validation; then
        print_warning "Initial validation had issues, but setup is complete"
    fi
    
    echo ""
    print_success "CI/CD setup completed successfully! 🎉"
    echo ""
    echo "Next steps:"
    echo "1. Make your changes"
    echo "2. Run 'npm run pre-push' to validate before pushing"
    echo "3. The pre-push hook will run automatically when you push"
    echo "4. Create pull requests to trigger CI/CD validation"
    echo ""
    echo "Available commands:"
    echo "  npm run pre-push     - Run all validation checks"
    echo "  npm run test:ci       - Run tests with coverage"
    echo "  npm run type-check    - Run TypeScript type checking"
    echo "  npm run lint          - Run ESLint"
    echo "  npm run ci            - Run all CI checks"
    echo ""
}

# Run main function
main "$@"
