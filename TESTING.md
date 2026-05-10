# Testing Guide for PORSA

## Pre-Deployment Testing Checklist

### 1. Local Environment Setup

```bash
# Install dependencies
npm install

# Setup environment
cp .env.local.example .env.local
# Edit .env.local with your credentials

# Build
npm run build

# Start dev server
npm run dev
```

### 2. Basic Connectivity Tests

#### Test Health Endpoint
```bash
curl http://localhost:3000/api/health

# Expected response:
# {
#   "status": "healthy",
#   "checks": {
#     "kv": { "status": "ok" },
#     "environment": { "status": "ok" }
#   }
# }
```

#### Test Status Endpoint
```bash
curl http://localhost:3000/api/status

# Expected response:
# {
#   "overallStatus": "operational",
#   "services": { "scraper": { "status": "ok" } }
# }
```

### 3. Scraper System Tests

#### Test Stock Scraping (Full)
```bash
curl "http://localhost:3000/api/egx-stocks" \
  -H "Accept: application/json" | jq '.stocks | length'

# Should return array with 80-150 stocks
# Each stock should have: symbol, price, change, volume, etc.
```

#### Test Stock Scraping (Lite)
```bash
curl "http://localhost:3000/api/egx-stocks?lite=1" | jq '.stocks[0]'

# Should return lighter payload without history_90d
# Faster response time
```

#### Test Cache Functionality
```bash
# First call (cold cache)
time curl "http://localhost:3000/api/egx-stocks?lite=1" > /dev/null

# Second call (warm cache) - should be much faster
time curl "http://localhost:3000/api/egx-stocks?lite=1" > /dev/null

# Force fresh (bypass cache)
curl "http://localhost:3000/api/egx-stocks?fresh=1" > /dev/null
```

#### Verify Response Structure
```bash
curl "http://localhost:3000/api/egx-stocks?lite=1" | jq '.stocks[0]' | jq keys

# Expected keys:
# ["symbol", "name", "price", "change", "volume", "market_cap", 
#  "sector", "pe", "yahoo_status", "last_updated", etc.]
```

### 4. AI Agent Tests

#### Test Stock Research Agent
```bash
curl -X POST "http://localhost:3000/api/agents/research-stock" \
  -H "Content-Type: application/json" \
  -d '{"symbol":"EBANK","action":"research"}' \
  -w "\nStatus: %{http_code}\n"

# Expected: 200 with analysis
# Check response contains: success, message, executionTime
```

#### Test Agent with Timeout
```bash
# Test should complete within 60s
time curl -X POST "http://localhost:3000/api/agents/analyze-portfolio" \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user"}'
```

### 5. Error Handling Tests

#### Test Missing Required Parameter
```bash
curl "http://localhost:3000/api/agents/research-stock" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected: 400 error with message
```

#### Test Invalid Environment Variable
```bash
# Temporarily unset HF_TOKEN
unset HF_TOKEN

# Try to run agent
curl -X POST "http://localhost:3000/api/agents/research-stock" \
  -H "Content-Type: application/json" \
  -d '{"symbol":"TEST"}'

# Should fail gracefully with error message
```

#### Test Fallback Behavior
```bash
# Kill internet connection or block API
# Try scraper
curl "http://localhost:3000/api/egx-stocks"

# Should return cached data if available
# Or error message with explanation
```

### 6. Performance Tests

#### Response Time Measurement

```bash
# Cold cache
time curl -s "http://localhost:3000/api/egx-stocks?lite=1" > /dev/null

# Warm cache
time curl -s "http://localhost:3000/api/egx-stocks?lite=1" > /dev/null

# Expected:
# Cold: 5-15 seconds
# Warm: 0.1-0.5 seconds
```

#### Concurrent Request Testing

```bash
# Test 10 concurrent requests
for i in {1..10}; do
  curl -s "http://localhost:3000/api/egx-stocks?lite=1" > /dev/null &
done
wait

# Should handle all requests without errors
```

#### Memory Usage
```bash
# Monitor while running tests
node --max-old-space-size=512 $(npm bin)/next dev

# Then run load tests and monitor heap usage
```

### 7. Frontend Component Tests

#### Test Stock Details Modal

```bash
# Load application
open http://localhost:3000

# 1. Click on any stock
# 2. Modal should open with:
#    - Stock name and symbol
#    - Price information
#    - Chart data loading
#    - Technical indicators

# 3. Change timeframes (1D, 1W, 1M, 1Y)
# 4. Click "Generate Analysis"
# 5. Wait for AI analysis
# 6. Check error handling (close modal and reopen)
```

#### Test Error Boundary

```bash
# Open browser console
# Intentionally trigger an error in component
# Component should catch and show error UI
# Should not crash entire app
```

### 8. Vercel Deployment Tests

#### Pre-Deployment Build Test
```bash
npm run build

# Should complete without errors
# Check build output size
```

#### Deploy to Vercel
```bash
vercel

# Follow prompts
# Wait for deployment to complete
```

#### Post-Deployment Verification

```bash
# Get deployment URL from vercel output
PROD_URL="https://your-project-abc123.vercel.app"

# Test health
curl $PROD_URL/api/health

# Test stocks
curl "$PROD_URL/api/egx-stocks?lite=1"

# Test agent
curl -X POST "$PROD_URL/api/agents/research-stock" \
  -H "Content-Type: application/json" \
  -d '{"symbol":"EBANK"}'

# Check logs
vercel logs
```

## Automated Testing

### Create test script

```bash
#!/bin/bash
# test-suite.sh

BASE_URL="${1:-http://localhost:3000}"
RESULTS=0

echo "🧪 Testing PORSA System"
echo "Base URL: $BASE_URL"

# Test 1: Health Check
echo "✓ Testing health endpoint..."
HEALTH=$(curl -s "$BASE_URL/api/health")
if echo $HEALTH | grep -q '"status":"healthy"'; then
  echo "  ✅ Health check passed"
else
  echo "  ❌ Health check failed"
  RESULTS=$((RESULTS+1))
fi

# Test 2: Stocks
echo "✓ Testing stocks endpoint..."
STOCKS=$(curl -s "$BASE_URL/api/egx-stocks?lite=1")
if echo $STOCKS | grep -q '"success":true'; then
  COUNT=$(echo $STOCKS | jq '.count')
  echo "  ✅ Stocks loaded: $COUNT"
else
  echo "  ❌ Stocks failed"
  RESULTS=$((RESULTS+1))
fi

# Test 3: Status
echo "✓ Testing status endpoint..."
STATUS=$(curl -s "$BASE_URL/api/status")
if echo $STATUS | grep -q '"overallStatus"'; then
  echo "  ✅ Status check passed"
else
  echo "  ❌ Status check failed"
  RESULTS=$((RESULTS+1))
fi

echo ""
echo "Tests completed with $RESULTS failures"
exit $RESULTS
```

Run tests:
```bash
chmod +x test-suite.sh
./test-suite.sh http://localhost:3000  # Local
./test-suite.sh https://your-domain.vercel.app  # Production
```

## Monitoring in Production

### Daily Health Checks

```bash
# Setup cron job to check health every hour
0 * * * * curl -f https://your-domain.vercel.app/api/health || notify_admin
```

### Performance Baselines

Track these metrics:

- API response times (target: <1s for cached, <10s for fresh)
- Error rates (target: <0.1%)
- Cache hit rate (target: >80%)
- Uptime (target: >99.5%)

### Log Monitoring

```bash
# Watch logs for errors
vercel logs --follow

# Search for specific errors
vercel logs | grep ERROR
```

## Troubleshooting Tests

### If health check fails

```bash
# Check KV connection
curl http://localhost:3000/api/health | jq '.checks.kv'

# Verify environment
echo $KV_REST_API_URL
echo $KV_REST_API_TOKEN
```

### If scraper fails

```bash
# Check with verbose logging
LOG_LEVEL=DEBUG npm run dev

# Tail logs
tail -f /tmp/porsa.log
```

### If agents fail

```bash
# Verify HF_TOKEN
echo $HF_TOKEN

# Test API directly
curl https://api.huggingface.co/api/models \
  -H "Authorization: Bearer $HF_TOKEN"
```

## Test Coverage Goals

- Endpoint availability: 100%
- Error handling: 100%
- Cache functionality: 100%
- Timeout behavior: 100%
- Fallback mechanisms: 100%
