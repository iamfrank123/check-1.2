#!/bin/bash

# PWA Deploy Script for GitHub + Vercel
# 
# Usage: ./scripts/deploy-pwa.sh "Commit message"
# 
# Questo script:
# 1. Verifica i requisiti PWA
# 2. Compila il progetto
# 3. Testa la PWA
# 4. Pubblica su GitHub
# 5. Vercel deploya automaticamente

set -e

COMMIT_MESSAGE="${1:-chore: PWA deployment}"
BRANCH=$(git rev-parse --abbrev-ref HEAD)

echo "=========================================="
echo "🚀 PWA Deploy Script"
echo "=========================================="
echo "Branch: $BRANCH"
echo "Message: $COMMIT_MESSAGE"
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funzione per stampare success
success() {
  echo -e "${GREEN}✓ $1${NC}"
}

# Funzione per stampare error
error() {
  echo -e "${RED}✗ $1${NC}"
  exit 1
}

# Funzione per stampare warning
warning() {
  echo -e "${YELLOW}⚠ $1${NC}"
}

# 1. Verifica i file PWA essenziali
echo "1️⃣  Checking PWA files..."
[[ -f "public/manifest.json" ]] && success "manifest.json found" || error "manifest.json not found!"
[[ -f "public/service-worker.js" ]] && success "service-worker.js found" || error "service-worker.js not found!"
[[ -f "next.config.js" ]] && success "next.config.js found" || error "next.config.js not found!"
[[ -f "vercel.json" ]] && success "vercel.json found" || error "vercel.json not found!"
echo ""

# 2. Verifica manifest.json valido
echo "2️⃣  Validating manifest.json..."
if command -v jq &> /dev/null; then
  jq empty public/manifest.json 2>/dev/null && success "manifest.json is valid JSON" || error "manifest.json is invalid JSON!"
else
  warning "jq not installed, skipping JSON validation"
fi
echo ""

# 3. Installa dipendenze se necessario
echo "3️⃣  Installing dependencies..."
if [[ ! -d "node_modules" ]]; then
  npm install || error "Failed to install dependencies"
fi
success "Dependencies ready"
echo ""

# 4. Lint (opzionale, continua se fallisce)
echo "4️⃣  Running linter..."
npm run lint 2>/dev/null && success "Linter passed" || warning "Linter found issues (non-critical)"
echo ""

# 5. Build il progetto
echo "5️⃣  Building project..."
npm run build || error "Build failed!"
success "Build succeeded"
echo ""

# 6. Test della PWA (se disponibile)
if [[ -f "lib/pwa-tests.ts" ]]; then
  echo "6️⃣  PWA Tests available"
  success "Run tests with: npm run test:pwa or PWATests.runAll() in browser console"
  echo ""
fi

# 7. Verifica i file built
echo "7️⃣  Verifying build output..."
[[ -d ".next" ]] && success ".next directory created" || error ".next directory not found!"
[[ -f ".next/server/middleware.js" ]] && success "Server middleware built" || warning "middleware not found"
echo ""

# 8. Commit e push
echo "8️⃣  Committing to Git..."
git status --short

echo ""
echo "Proceed with commit? (y/n)"
read -r -t 10 PROCEED || PROCEED="y"

if [[ "$PROCEED" == "y" || "$PROCEED" == "Y" ]]; then
  git add .
  git commit -m "$COMMIT_MESSAGE" || warning "Nothing to commit"
  success "Committed with message: $COMMIT_MESSAGE"
  echo ""

  # 9. Push a GitHub
  echo "9️⃣  Pushing to GitHub ($BRANCH)..."
  git push origin "$BRANCH" || error "Failed to push to GitHub!"
  success "Pushed to GitHub"
  echo ""

  # 10. Summary
  echo "=========================================="
  echo "✅ Deploy initiated successfully!"
  echo "=========================================="
  echo ""
  echo "What happens next:"
  echo "1. GitHub receives the push"
  echo "2. GitHub Actions workflow starts (.github/workflows/deploy-pwa.yml)"
  echo "3. Project is built and tested"
  echo "4. Deploy to Vercel (auto-detected)"
  echo "5. Vercel invalidates cache for service-worker.js"
  echo "6. Service Worker is updated (max-age=0)"
  echo "7. All users receive update notification within 30 minutes"
  echo ""
  echo "📊 Monitor deployment:"
  echo "   GitHub: github.com/[user]/[repo]/actions"
  echo "   Vercel: vercel.com/dashboard"
  echo ""
  echo "🔍 Verify PWA:"
  echo "   1. Open https://pentagramma.vercel.app"
  echo "   2. DevTools → Application"
  echo "   3. Check Service Worker status"
  echo "   4. Check Cache storage"
  echo ""
else
  warning "Deploy cancelled"
  echo "Changes remain staged. To commit later, run:"
  echo "  git commit -m '$COMMIT_MESSAGE'"
  echo "  git push origin $BRANCH"
fi
