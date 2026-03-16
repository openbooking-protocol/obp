#!/usr/bin/env bash
# OBP Local Development Setup Script
# Usage: ./setup.sh

set -euo pipefail

RESET="\033[0m"
BOLD="\033[1m"
GREEN="\033[32m"
BLUE="\033[34m"
YELLOW="\033[33m"
RED="\033[31m"

info()    { echo -e "${BLUE}[info]${RESET} $*"; }
success() { echo -e "${GREEN}[ok]${RESET}   $*"; }
warn()    { echo -e "${YELLOW}[warn]${RESET} $*"; }
error()   { echo -e "${RED}[error]${RESET} $*" >&2; }
step()    { echo -e "\n${BOLD}→ $*${RESET}"; }

# ─── Check prerequisites ──────────────────────────────────────────────────────

step "Checking prerequisites"

check_cmd() {
  if command -v "$1" &>/dev/null; then
    success "$1 found ($(command -v "$1"))"
  else
    error "$1 is required but not installed."
    echo "  Install: $2"
    exit 1
  fi
}

check_version() {
  local cmd="$1" required="$2" actual
  actual=$($cmd --version 2>&1 | grep -oE '[0-9]+\.[0-9]+' | head -1)
  if [ -z "$actual" ]; then
    warn "Could not determine $cmd version"
    return
  fi
  success "$cmd $actual"
}

check_cmd node  "https://nodejs.org"
check_cmd npm   "https://nodejs.org"
check_cmd docker "https://docs.docker.com/get-docker/"
check_version node "18"
check_version npm "9"

# ─── Server setup ─────────────────────────────────────────────────────────────

step "Setting up server"

if [ ! -f server/.env ]; then
  cp server/.env.example server/.env
  success "Created server/.env from .env.example"

  # Generate secrets
  if command -v openssl &>/dev/null; then
    API_KEY_SECRET=$(openssl rand -hex 32)
    JWT_SECRET=$(openssl rand -hex 32)
    # Use sed to replace placeholder values
    sed -i "s/^API_KEY_SECRET=.*/API_KEY_SECRET=${API_KEY_SECRET}/" server/.env
    sed -i "s/^JWT_SECRET=.*/JWT_SECRET=${JWT_SECRET}/" server/.env
    success "Generated API_KEY_SECRET and JWT_SECRET"
  else
    warn "openssl not found — please manually set API_KEY_SECRET and JWT_SECRET in server/.env"
  fi
else
  info "server/.env already exists, skipping"
fi

if [ -d server ]; then
  info "Installing server dependencies..."
  (cd server && npm install --silent)
  success "Server dependencies installed"
fi

# ─── Frontend setup ───────────────────────────────────────────────────────────

step "Setting up frontend"

if [ -d frontend ]; then
  info "Installing frontend dependencies..."
  (cd frontend && npm install --silent)
  success "Frontend dependencies installed"
fi

# ─── SDK setup ────────────────────────────────────────────────────────────────

step "Setting up JavaScript SDK"

if [ -d sdk/js ]; then
  info "Installing SDK dependencies..."
  (cd sdk/js && npm install --silent)
  success "SDK dependencies installed"
fi

# ─── Tools setup ──────────────────────────────────────────────────────────────

step "Setting up tools"

if [ -d tools/validator ]; then
  info "Installing validator dependencies..."
  (cd tools/validator && npm install --silent)
  success "Validator dependencies installed"
fi

if [ -d tools/scaffold ]; then
  info "Installing scaffold dependencies..."
  (cd tools/scaffold && npm install --silent)
  success "Scaffold dependencies installed"
fi

# ─── Start infrastructure ─────────────────────────────────────────────────────

step "Starting PostgreSQL and Redis"

if docker compose version &>/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
elif docker-compose version &>/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
else
  error "Docker Compose not found"
  exit 1
fi

$COMPOSE_CMD up -d postgres redis
success "PostgreSQL and Redis started"

# Wait for PostgreSQL to be ready
info "Waiting for PostgreSQL to be ready..."
for i in $(seq 1 30); do
  if $COMPOSE_CMD exec -T postgres pg_isready -U obp -d obp &>/dev/null 2>&1; then
    success "PostgreSQL is ready"
    break
  fi
  if [ "$i" -eq 30 ]; then
    error "PostgreSQL did not become ready in time"
    exit 1
  fi
  sleep 1
done

# ─── Database migrations ──────────────────────────────────────────────────────

step "Running database migrations"

if [ -d server ]; then
  (cd server && npm run db:migrate)
  success "Migrations complete"
fi

# ─── Seed data ────────────────────────────────────────────────────────────────

step "Seeding database with test data"

if [ -d server ]; then
  (cd server && npm run db:seed)
  success "Database seeded"
fi

# ─── Done ─────────────────────────────────────────────────────────────────────

echo ""
echo -e "${GREEN}${BOLD}✓ Setup complete!${RESET}"
echo ""
echo -e "  ${BOLD}Start the server:${RESET}"
echo "    cd server && npm run dev"
echo ""
echo -e "  ${BOLD}Start the frontend:${RESET}"
echo "    cd frontend && npm run dev"
echo ""
echo -e "  ${BOLD}Verify the server:${RESET}"
echo "    curl http://localhost:3000/.well-known/obp"
echo "    npx @obp/validator http://localhost:3000"
echo ""
echo -e "  ${BOLD}Dashboard:${RESET}"
echo "    http://localhost:3001/dashboard"
echo ""
echo -e "  ${BOLD}Admin key:${RESET}"
echo "    See server/.env → ADMIN_API_KEY"
echo ""
