# Forgot Password Setup Guide

## 🎉 What's New

The application now includes:
- ✅ Email-based password reset functionality
- ✅ Secure password hashing with bcryptjs
- ✅ Email field added to registration
- ✅ Professional email templates with Resend

## 🚀 Setup Instructions

### 1. Install Dependencies (Already Done)
```bash
npm install resend bcryptjs
```

### 2. Get a Resend API Key

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account (3,000 emails/month free)
3. Go to API Keys section
4. Create a new API key
5. Copy the API key

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Copy the example file
cp .env.local.example .env.local
```

Edit `.env.local` and add your Resend API key:

```env
RESEND_API_KEY=re_your_actual_api_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev
NEXT_PUBLIC_URL=http://localhost:3000
```

**Note:** For development, you can use `onboarding@resend.dev` as the sender email. For production, you'll need to verify your own domain.

### 4. Run the Application

```bash
npm run dev
```

## 📧 How It Works

### Registration Flow
1. User provides: Name, Email, Phone, Password
2. Password is hashed with bcrypt (10 salt rounds)
3. User data stored in Vercel KV with hashed password

### Login Flow
1. User provides: Phone, Password
2. Password compared using bcrypt.compare()
3. Session created on successful login

### Forgot Password Flow
1. User clicks "Forgot Password?" on login page
2. Enters their email address
3. System generates a secure reset token (32 bytes, cryptographically random)
4. Token is hashed and stored in KV with 1-hour expiry
5. Email sent with reset link containing the unhashed token
6. User clicks link and is taken to reset password page
7. User enters new password
8. Password is hashed and updated in database
9. Reset token is deleted (one-time use)
10. User redirected to login

## 🔒 Security Features

- ✅ **Password Hashing**: bcrypt with 10 salt rounds
- ✅ **Secure Tokens**: crypto.randomBytes(32) for reset tokens
- ✅ **Token Hashing**: Tokens hashed before storage in database
- ✅ **Time-Limited**: Reset tokens expire after 1 hour
- ✅ **One-Time Use**: Tokens deleted after successful reset
- ✅ **Email Validation**: Proper email format validation
- ✅ **No Email Enumeration**: Doesn't reveal if email exists

## 🎨 UI Features

- ✅ Email field added to registration form
- ✅ "Forgot Password?" link on login page
- ✅ Dedicated reset password form
- ✅ Success/error messages with styling
- ✅ Loading states for all async operations
- ✅ Auto-redirect after successful password reset

## 📁 New Files Created

```
app/
  api/
    auth/
      forgot-password/
        route.js          ← Sends reset email
      reset-password/
        route.js          ← Validates token & updates password
  components/
    ResetPasswordForm.jsx ← Reset password UI

lib/
  kv.js                   ← Added getUserByEmail function

.env.local.example        ← Environment variables template
```

## 🧪 Testing Locally

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Register a new account:**
   - Go to http://localhost:3000
   - Click "Don't have an account? Sign up"
   - Fill in all fields including email
   - Submit

3. **Test forgot password:**
   - Click "Forgot Password?" on login page
   - Enter your email
   - Check your email for the reset link
   - Click the link in the email
   - Enter a new password
   - Submit and verify redirect to login

## 🔧 Troubleshooting

### Email not sending?
- Check your `RESEND_API_KEY` in `.env.local`
- Make sure you're using a valid API key from resend.com
- Check the terminal/console for error messages

### Reset link not working?
- Check that `NEXT_PUBLIC_URL` is set correctly in `.env.local`
- Ensure the token hasn't expired (1 hour limit)
- Token can only be used once

### Login failing after registration?
- This is expected if you have old users with plain-text passwords
- Old users need to use the forgot password flow to reset their password
- Or clear the KV database to start fresh

## 🚀 Production Deployment

### Vercel Environment Variables

Add these to your Vercel project settings:

1. `RESEND_API_KEY` - Your Resend API key
2. `RESEND_FROM_EMAIL` - Your verified sender email
3. `NEXT_PUBLIC_URL` - Your production URL (e.g., https://yourdomain.com)

### Custom Email Domain (Optional)

For production, set up a custom domain in Resend:

1. Add your domain in Resend dashboard
2. Add DNS records (SPF, DKIM, etc.)
3. Verify domain
4. Update `RESEND_FROM_EMAIL` to `noreply@yourdomain.com`

## 📊 Free Tier Limits

**Resend Free Tier:**
- 3,000 emails/month
- 100 emails/day
- All features included

For a typical app:
- ~10-50 password resets/month = Well within free tier
- Even with 10,000 users, likely to stay free

## 🔐 Migration Notes

### Existing Users
Current users in the database have plain-text passwords and no email field. You have two options:

**Option A: Force Password Reset (Recommended)**
- Existing users must use "Forgot Password" flow
- This will create a new hashed password
- Requires adding email to their account first

**Option B: Clear Database**
```bash
# In your KV dashboard or via CLI
# Delete all user:* keys to start fresh
```

**Option C: Gradual Migration**
- Add logic to detect plain-text passwords on login
- Hash them on-the-fly during successful login
- Update user record with hashed password

## 📝 Next Steps (Optional Enhancements)

- [ ] Add rate limiting (max 5 reset requests per email/hour)
- [ ] Send confirmation email after password change
- [ ] Add password strength indicator
- [ ] Implement 2FA (two-factor authentication)
- [ ] Add SMS-based reset as alternative
- [ ] Invalidate all sessions on password change
- [ ] Add account recovery via security questions

## 🆘 Support

For issues or questions:
- Check the terminal console for error messages
- Verify all environment variables are set correctly
- Ensure Resend API key is valid and active
- Check Vercel KV is properly configured

---

**Note:** This is a development setup. For production, ensure all security best practices are followed, including proper domain verification, rate limiting, and monitoring.
