# 🚀 Deployment Guide - Vercel KV Database

This guide will help you deploy the Porsa application with Vercel KV (Redis) database.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **Vercel CLI** (optional): `npm i -g vercel`

## 🔧 Step 1: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. **Connect Repository**:

   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Select the repository and click "Deploy"

2. **Configure Project**:
   - Framework Preset: `Next.js`
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

### Option B: Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts to configure your project
```

## 🗄️ Step 2: Set Up Vercel KV Database

### Create KV Database

1. **Access Vercel Dashboard**:

   - Go to your project dashboard
   - Click on "Storage" tab
   - Click "Create Database"

2. **Select KV Database**:

   - Choose "KV" (Redis)
   - Select your preferred region
   - Click "Create"

3. **Configure Environment Variables**:
   - Vercel will automatically add the required environment variables
   - The variables will be:
     - `KV_URL`
     - `KV_REST_API_URL`
     - `KV_REST_API_TOKEN`
     - `KV_REST_API_READ_ONLY_TOKEN`

## 🔄 Step 3: Redeploy Application

After setting up the KV database:

1. **Trigger Redeploy**:

   - Go to your project dashboard
   - Click "Deployments"
   - Click "Redeploy" on your latest deployment

2. **Verify Environment Variables**:
   - Go to "Settings" → "Environment Variables"
   - Ensure all KV variables are present

## 🧪 Step 4: Test the Application

1. **Visit Your App**:

   - Go to your deployed URL (e.g., `https://your-app.vercel.app`)
   - Test user registration and login
   - Add stocks to portfolio
   - Update user profile

2. **Verify Data Persistence**:
   - Create a test account
   - Add some stocks
   - Logout and login again
   - Verify data is preserved

## 🔍 Step 5: Monitor and Debug

### View Logs

1. **Vercel Dashboard**:

   - Go to "Functions" tab
   - Click on any function to view logs

2. **Real-time Logs**:
   ```bash
   vercel logs --follow
   ```

### Database Monitoring

1. **KV Dashboard**:

   - Go to "Storage" → "KV"
   - View database metrics and usage

2. **Check Data**:
   - Use Vercel KV dashboard to inspect stored data
   - Verify user accounts, portfolios, and profiles

## 🛠️ Development Setup

### Local Development

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Set Environment Variables**:
   Create `.env.local`:

   ```env
   KV_URL=your_kv_url
   KV_REST_API_URL=your_kv_rest_api_url
   KV_REST_API_TOKEN=your_kv_rest_api_token
   KV_REST_API_READ_ONLY_TOKEN=your_kv_read_only_token
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

### Testing Locally

1. **Test API Routes**:

   ```bash
   # Test registration
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{phone":"010000000001","password":"password","name":"Test User"}'

   # Test login
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"phone":"010000000001","password":"password"}'
   ```

## 🔒 Security Considerations

### Production Security

1. **Password Hashing**: In production, implement proper password hashing (bcrypt)
2. **Input Validation**: Add comprehensive input validation
3. **Rate Limiting**: Implement API rate limiting
4. **CORS**: Configure proper CORS settings
5. **HTTPS**: Ensure all traffic uses HTTPS

### Environment Variables

- Never commit sensitive environment variables to Git
- Use Vercel's environment variable management
- Rotate tokens regularly

## 📊 Performance Optimization

### KV Database Optimization

1. **Connection Pooling**: KV client handles connection pooling automatically
2. **Caching**: Implement client-side caching for frequently accessed data
3. **Batch Operations**: Use batch operations for multiple data operations
4. **Indexing**: KV automatically handles indexing

### Application Optimization

1. **API Response Caching**: Implement caching headers
2. **Error Handling**: Comprehensive error handling and logging
3. **Monitoring**: Set up monitoring and alerting

## 🚨 Troubleshooting

### Common Issues

1. **KV Connection Errors**:

   - Verify environment variables are set correctly
   - Check KV database is active and accessible
   - Ensure proper permissions

2. **API Errors**:

   - Check function logs in Vercel dashboard
   - Verify API routes are deployed correctly
   - Test endpoints individually

3. **Data Not Persisting**:
   - Verify KV database is properly connected
   - Check API responses for errors
   - Ensure proper error handling

### Debug Commands

```bash
# Check deployment status
vercel ls

# View function logs
vercel logs

# Test API endpoints
curl -X GET https://your-app.vercel.app/api/health

# Check environment variables
vercel env ls
```

## 📈 Scaling Considerations

### KV Database Scaling

- Vercel KV automatically scales with your application
- Monitor usage in Vercel dashboard
- Consider upgrading plan if needed

### Application Scaling

- Vercel automatically scales your application
- Monitor function execution times
- Optimize code for better performance

## 🎉 Success!

Your Porsa application is now deployed with a production-ready NoSQL database!

**Next Steps**:

1. Set up monitoring and alerting
2. Implement proper security measures
3. Add comprehensive testing
4. Set up CI/CD pipeline
5. Monitor performance and optimize

---

For support, check the [Vercel Documentation](https://vercel.com/docs) or [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv).
