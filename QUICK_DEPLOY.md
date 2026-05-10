# 🚀 Quick Start: Deploy PORSA to Vercel

## ⏱️ 5-Minute Deployment

### Step 1: Prepare Your Credentials (2 min)

Get these 6 credentials:

1. **Vercel KV** (Redis database)
   - Go to https://vercel.com/dashboard
   - Click "Storage" → "KV Database"
   - Create a new database (or use existing)
   - Copy **REST API URL** and **REST API TOKEN**

2. **HuggingFace API Token**
   - Go to https://huggingface.co/settings/tokens
   - Click "Create New Token"
   - Name: "PORSA" 
   - Permission: "Read"
   - Copy the token

3. **Resend Email API**
   - Go to https://resend.com
   - Click "API Keys"
   - Copy the **API Key**
   - Note your **From Email** (e.g., noreply@domain.com)

### Step 2: Clone & Setup (1 min)

```bash
# If you haven't already, clone the repo
git clone <your-repo-url>
cd porsa

# Install dependencies
npm install

# Build locally to verify
npm run build
```

### Step 3: Deploy to Vercel (1 min)

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy
vercel

# Follow prompts:
# - Link to existing project or create new
# - Select Next.js preset
# - Let it build
```

### Step 4: Set Environment Variables (1 min)

In the Vercel CLI after deployment, or via Vercel Dashboard:

```bash
vercel env add KV_REST_API_URL
# Paste: https://your-project.kv.vercel.sh

vercel env add KV_REST_API_TOKEN
# Paste: your_token_here

vercel env add HF_TOKEN
# Paste: hf_xxxx

vercel env add RESEND_API_KEY
# Paste: re_xxxx

vercel env add RESEND_FROM_EMAIL
# Paste: noreply@yourdomain.com

vercel env add NEXT_PUBLIC_URL
# Paste: https://your-project.vercel.app
```

Then redeploy:
```bash
vercel --prod
```

### Step 5: Verify Deployment (1 min)

```bash
# Get your deployment URL
# Visit: https://your-project.vercel.app

# Test health endpoint
curl https://your-project.vercel.app/api/health

# Test stocks endpoint
curl "https://your-project.vercel.app/api/egx-stocks?lite=1" | head -c 500
```

✅ **Done!** Your system is live.

---

## 🔍 What to Check

### 1. Health Check
```bash
curl https://your-domain.vercel.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "checks": {
    "kv": { "status": "ok" },
    "environment": { "status": "ok" }
  }
}
```

### 2. Get Stocks
```bash
curl "https://your-domain.vercel.app/api/egx-stocks?lite=1"
```

Should return a list of stocks with prices.

### 3. Check Logs
```bash
vercel logs
```

Should show requests coming in.

---

## ⚠️ Troubleshooting

### "KV_REST_API_URL not found"
```bash
# Pull environment from Vercel
vercel env pull

# Then try again
vercel --prod
```

### "HF_TOKEN not configured"
- Make sure token starts with `hf_`
- Check for trailing spaces
- Verify it's set in Vercel dashboard

### "RESEND_API_KEY error"
- Token should start with `re_`
- Verify email is valid
- Check Resend dashboard for account

### Build fails
```bash
# Clean and rebuild
rm -rf .next
npm run build
vercel --prod
```

---

## 📚 Documentation

For more details, see:
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Full deployment guide
- **[TESTING.md](TESTING.md)** - How to test everything
- **[ENHANCEMENTS.md](ENHANCEMENTS.md)** - What was improved
- **[.env.local.example](.env.local.example)** - Environment variables

---

## 🎯 Next Steps

1. ✅ Deploy using steps above
2. 📊 Monitor using health endpoint
3. 📈 Share your live site!
4. 🔧 Customize as needed

---

## 💡 Tips

- **Cache warm-up**: First request takes 10-15s, subsequent are instant
- **Monitor performance**: Check `/api/status` endpoint regularly
- **Review logs**: Use `vercel logs --follow` to watch live traffic
- **Update dependencies**: `npm outdated` and `npm update` monthly

---

## 🆘 Still Having Issues?

1. Check `vercel logs`
2. Review **[DEPLOYMENT.md](DEPLOYMENT.md)** troubleshooting section
3. Verify all env vars are set
4. Ensure Vercel KV is active
5. Test locally with `npm run dev`

---

**🎉 Your production system is ready!**
