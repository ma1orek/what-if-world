#!/bin/bash

# History Rewriter Live Deployment Script
# This script handles the complete deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="history-rewriter-live"
DOCKER_IMAGE="$PROJECT_NAME:latest"
CONTAINER_NAME="$PROJECT_NAME-container"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking deployment requirements..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if environment file exists
    if [ ! -f ".env.production.local" ]; then
        log_warn ".env.production.local not found. Creating from template..."
        cp .env.production .env.production.local
        log_warn "Please edit .env.production.local with your actual API keys before continuing."
        read -p "Press Enter to continue after editing the file..."
    fi
    
    log_info "Requirements check passed!"
}

build_application() {
    log_info "Building the application..."
    
    # Build Docker image
    docker build -t $DOCKER_IMAGE .
    
    if [ $? -eq 0 ]; then
        log_info "Docker image built successfully!"
    else
        log_error "Failed to build Docker image"
        exit 1
    fi
}

run_tests() {
    log_info "Running tests..."
    
    # Run tests in Docker container
    docker run --rm -v $(pwd):/app -w /app node:18-alpine sh -c "npm ci && npm test"
    
    if [ $? -eq 0 ]; then
        log_info "All tests passed!"
    else
        log_error "Tests failed"
        exit 1
    fi
}

deploy_application() {
    log_info "Deploying the application..."
    
    # Stop existing containers
    docker-compose down
    
    # Start new containers
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        log_info "Application deployed successfully!"
    else
        log_error "Failed to deploy application"
        exit 1
    fi
}

health_check() {
    log_info "Performing health check..."
    
    # Wait for services to start
    sleep 10
    
    # Check frontend health
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log_info "Frontend is healthy!"
    else
        log_error "Frontend health check failed"
        return 1
    fi
    
    # Check backend health
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        log_info "Backend is healthy!"
    else
        log_error "Backend health check failed"
        return 1
    fi
    
    log_info "All services are healthy!"
}

cleanup() {
    log_info "Cleaning up old Docker images..."
    
    # Remove dangling images
    docker image prune -f
    
    log_info "Cleanup completed!"
}

show_status() {
    log_info "Deployment Status:"
    echo "===================="
    docker-compose ps
    echo "===================="
    
    log_info "Application URLs:"
    echo "Frontend: http://localhost:3000"
    echo "Backend API: http://localhost:3001"
    echo "Health Check: http://localhost:3001/health"
}

# Main deployment process
main() {
    log_info "Starting deployment of $PROJECT_NAME..."
    
    # Parse command line arguments
    SKIP_TESTS=false
    SKIP_BUILD=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --skip-tests    Skip running tests"
                echo "  --skip-build    Skip building Docker image"
                echo "  --help          Show this help message"
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Execute deployment steps
    check_requirements
    
    if [ "$SKIP_BUILD" = false ]; then
        build_application
    fi
    
    if [ "$SKIP_TESTS" = false ]; then
        run_tests
    fi
    
    deploy_application
    health_check
    cleanup
    show_status
    
    log_info "Deployment completed successfully! 🎉"
    log_info "Your History Rewriter Live application is now running."
}

# Handle script interruption
trap 'log_error "Deployment interrupted!"; exit 1' INT TERM

# Run main function
main "$@"