import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Global setup for E2E tests
 * Creates a test user and performs authentication
 */
async function globalSetup() {
  const baseURL = 'http://localhost:3000';
  const authFilePath = path.join(process.cwd(), 'auth.json');
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Test user credentials
    const testUser = {
      phone: '201001234567',
      password: 'TestPass123!',
      name: 'Test User',
      email: 'test@porsa.local'
    };

    console.log('🔐 Setting up test user authentication...');
    console.log('📧 Using test user:', testUser.email);

    // First, navigate to the app to establish connection
    await page.goto(baseURL);

    // Try to register the test user
    console.log('📝 Attempting to register test user...');
    const registerResp = await page.evaluate(async (user) => {
      try {
        console.log('Sending register request with:', user);
        const res = await fetch('http://localhost:3000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user)
        });
        const data = await res.json();
        console.log('Register response:', res.status, data);
        return { 
          success: res.ok, 
          status: res.status, 
          data: data 
        };
      } catch (e: any) {
        console.error('Register error:', e.message);
        return { 
          success: false, 
          error: e.message 
        };
      }
    }, testUser);
    
    console.log('Registration result:', registerResp);

    // Try to login
    console.log('🔑 Attempting to login...');
    const loginResp = await page.evaluate(async (user) => {
      try {
        console.log('Sending login request with phone:', user.phone);
        const res = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: user.phone,
            password: user.password
          })
        });
        const data = await res.json();
        console.log('Login response:', res.status, data);
        return { 
          success: res.ok, 
          status: res.status, 
          data: data 
        };
      } catch (e: any) {
        console.error('Login error:', e.message);
        return { 
          success: false, 
          error: e.message 
        };
      }
    }, testUser);

    console.log('Login result:', loginResp);

    if (loginResp.success && loginResp.data?.user) {
      console.log('✅ Test user authenticated');
      
      // Set localStorage with user data
      await page.evaluate((userData) => {
        const userObj = {
          id: userData.data.user.id,
          name: userData.data.user.name,
          phone: userData.data.user.phone,
          email: userData.data.user.email
        };
        console.log('Saving to localStorage:', userObj);
        localStorage.setItem('porsaCurrentUser', JSON.stringify(userObj));
      }, loginResp);

      // Save browser storage state (cookies, localStorage, etc)
      await context.storageState({ path: authFilePath });
      console.log('✅ Auth state saved to', authFilePath);
      
      // Verify file exists
      if (fs.existsSync(authFilePath)) {
        const content = fs.readFileSync(authFilePath, 'utf-8');
        const parsed = JSON.parse(content);
        console.log('✅ Auth file verified, contains', Object.keys(parsed).length, 'keys');
      } else {
        console.log('⚠️ Auth file was not created');
      }
    } else {
      console.log('⚠️ Login failed:', loginResp.data?.error || loginResp.error);
      console.log('💡 Tip: Check if test user was created during registration');
      
      // Even if login failed, save the state so tests can retry
      await context.storageState({ path: authFilePath });
      console.log('📝 Saved empty auth state for tests to handle');
    }
  } catch (error) {
    console.error('❌ Setup error:', error);
  } finally {
    await context.close();
    await browser.close();
  }
}

export default globalSetup;
