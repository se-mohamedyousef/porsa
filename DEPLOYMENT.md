# PORSA Deployment Guide

## Pre-Deployment Checklist

### Environment Variables (Required)

Set these in Vercel project settings or `.env.local` for local development:

```bash
# Upstash Redis (KV Store)
KV_REST_API_URL=https://... (from Vercel KV dashboard)
KV_REST_API_TOKEN=... (from Vercel KV dashboard)

# HuggingFace AI
HF_TOKEN=hf_... (get from huggingface.co/settings/tokens)

# Email Service (Resend)
RESEND_API_KEY=re_... (get from resend.com)
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Application
NEXT_PUBLIC_URL=https://your-domain.vercel.app
NODE_ENV=production
LOG_LEVEL=INFO

# Optional: Monitoring
MONITORING_WEBHOOK_URL=https://... (for error tracking)
```

## Deployment Steps

### 1. Prepare Repository

```bash
# Install dependencies
npm install

# Verify build
npm run build

# Test locally
npm run dev
```

### 2. Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add KV_REST_API_URL
vercel env add KV_REST_API_TOKEN
vercel env add HF_TOKEN
vercel env add RESEND_API_KEY
vercel env add RESEND_FROM_EMAIL
vercel env add NEXT_PUBLIC_URL
```

#### Option B: Using GitHub Integration

1. Push code to GitHub
2. Connect Vercel to GitHub repo
3. Vercel will auto-deploy on push
4. Set environment variables in Vercel project settings

### 3. Verify Deployment

After deployment, verify all systems are working:

```bash
# Health check
curl https://your-domain.vercel.app/api/health

# Check status
curl https://your-domain.vercel.app/api/status

# Fetch stocks
curl "https://your-domain.vercel.app/api/egx-stocks?lite=1"
```

## System Architecture

### Components

1. **Scraper System** (`lib/scraper/`)
   - Enhanced with caching (15 min TTL)
   - Circuit breaker for API failures
   - Retry logic with exponential backoff
   - Graceful fallbacks

2. **AI Agents** (`lib/agents/`)
   - LLM circuit breaker
   - Tool execution with timeout
   - Comprehensive error handling
   - Request caching

3. **Stock Details** (`app/components/`)
   - Enhanced error boundaries
   - Loading states
   - Timeout handling
   - Fallback data

4. **API Routes** (`app/api/`)
   - Health check endpoint
   - Status monitoring
   - Proper error handling
   - Logging integration

## Monitoring & Debugging

### Health Checks

Health check endpoint automatically verifies:
- Redis/KV connectivity
- Environment variables
- System uptime

```bash
curl https://your-domain.vercel.app/api/health
```

### Logs

Logs are structured and categorized:

```
[TIMESTAMP] LOG_LEVEL SERVICE [CONTEXT]: message data
```

Access logs in Vercel Dashboard > Deployments > Logs

### Circuit Breaker Status

View circuit breaker states:
```bash
curl "https://your-domain.vercel.app/api/status?verbose=true"
```

## Scaling & Performance

### Timeouts

- Scraper: 120 seconds (full data with enrichment)
- Agents: 60 seconds (AI analysis)
- API endpoints: 30 seconds (standard)
- Health check: 30 seconds

### Memory Allocation

- Main API: 1GB (scraper, enrichment)
- Agents: 512MB
- Health: 256MB

### Caching Strategy

- EGX Stocks: 15 minutes (full data with history)
- EGX Stocks Lite: 5 minutes (no history)
- Agent responses: 5 minutes (per user/intent)

## Troubleshooting

### Common Issues

1. **"HF_TOKEN not configured"**
   - Verify HF_TOKEN is set in Vercel environment
   - Regenerate token if needed
   - Redeploy after setting

2. **"KV API Error"**
   - Check KV_REST_API_URL and KV_REST_API_TOKEN
   - Verify Vercel KV instance exists
   - Check Upstash dashboard

3. **Scraper timeout (> 120s)**
   - Check network/API response times
   - May need to skip enrichment or use lite mode
   - Check circuit breaker status

4. **High memory usage**
   - Check for memory leaks in agents
   - Review large data caching
   - Use lite mode for stocks endpoint

### Debug Mode

Enable verbose logging:

```bash
# Set environment variable
LOG_LEVEL=DEBUG

# Redeploy and check logs
```

## Maintenance

### Regular Tasks

1. **Monitor circuit breakers** - Check status weekly
2. **Review error logs** - Analyze failures and patterns
3. **Update dependencies** - Run `npm outdated` monthly
4. **Test failover** - Verify cache fallback mechanisms

### Backup & Recovery

- All data is cached in Vercel KV (Redis)
- Scraper can re-fetch data on demand
- No critical data loss risk

## Performance Tips

1. Use `?lite=1` parameter for frontend to reduce payload
2. Enable browser caching with far-future headers
3. Use CDN for static assets (Vercel default)
4. Monitor API response times in dashboard

## Security Considerations

1. **Secrets Management**
   - Use Vercel environment variables (encrypted)
   - Never commit secrets to git
   - Rotate tokens periodically

2. **API Security**
   - All endpoints require HTTPS (Vercel default)
   - Rate limiting via Vercel (configurable)
   - CORS properly configured

3. **Data Protection**
   - KV data is encrypted at rest
   - Use read-only tokens where possible
   - Audit access logs regularly

## Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Upstash Docs**: https://upstash.com/docs
- **HuggingFace**: https://huggingface.co/docs

## Rollback Procedure

If issues occur after deployment:

```bash
# View deployment history
vercel list

# Rollback to previous
vercel rollback

# Or use Vercel Dashboard > Deployments
```

## Post-Deployment Validation

```bash
# 1. Check health
curl https://your-domain.vercel.app/api/health

# 2. Test scraper
curl "https://your-domain.vercel.app/api/egx-stocks?lite=1" | head -c 500

# 3. Test agents
curl -X POST https://your-domain.vercel.app/api/agents/research-stock \
  -H "Content-Type: application/json" \
  -d '{"symbol":"EBANK"}'

# 4. Monitor logs
vercel logs

# 5. Check metrics
# Via Vercel Dashboard > Analytics
```
