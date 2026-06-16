const { chromium } = require('@playwright/test');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  
  let contextOptions = {};
  if (fs.existsSync('auth.json')) {
    contextOptions.storageState = 'auth.json';
  }
  
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  
  await page.goto('http://localhost:3000/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  // Extract DOM structure
  const domInfo = await page.evaluate(() => {
    const body = document.body;
    return {
      allText: body.innerText.substring(0, 1000),
      buttons: Array.from(document.querySelectorAll('button')).map(b => ({
        text: b.innerText.substring(0, 30),
        classes: b.className
      })),
      headers: Array.from(document.querySelectorAll('h1, h2, h3, h4')).map(h => ({
        text: h.innerText.substring(0, 50),
        classes: h.className,
        tag: h.tagName
      })),
      sections: Array.from(document.querySelectorAll('[class*="rounded"]')).slice(0, 5).map(d => ({
        text: d.innerText.substring(0, 100),
        classes: d.className
      })),
      allDivs: Array.from(document.querySelectorAll('div')).slice(0, 10).map(d => ({
        text: d.innerText.substring(0, 50),
        classes: d.className
      }))
    };
  });
  
  console.log('=== HEADERS/TITLES ===');
  domInfo.headers.forEach(h => console.log(`${h.tag}: ${h.text}`));
  
  console.log('\n=== BUTTONS ===');
  domInfo.buttons.forEach(b => console.log(`${b.text}`));
  
  console.log('\n=== BODY TEXT (first 500 chars) ===');
  console.log(domInfo.allText);
  
  await browser.close();
})();
