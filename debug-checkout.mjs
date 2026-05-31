import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const logs = [];
const errors = [];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext();
const page = await ctx.newPage();

// Capture ALL console messages
page.on('console', msg => {
  const text = `[${msg.type()}] ${msg.text()}`;
  logs.push(text);
  if (msg.type() === 'error') console.error('CONSOLE ERROR:', text);
  else console.log('console:', text);
});

// Capture uncaught page errors
page.on('pageerror', err => {
  const entry = `PAGEERROR: ${err.message}\nSTACK:\n${err.stack}`;
  errors.push(entry);
  console.error(entry);
});

// ── 1. Seed the cart directly via localStorage ─────────────────────────────
await page.goto(BASE);
await page.evaluate(() => {
  const pizzas = [
    {
      id: 1,
      name: 'Test Pizza',
      type: 'pizza',
      dough: 'thin',
      sauce: 'ketchup',
      cheese: 'mozzarella',
      meats: [],
      vegetables: [],
      quantity: 1,
      emoji: '🍕',
    },
  ];
  localStorage.setItem('bz_pizzas', JSON.stringify(pizzas));
  // Pre-fill bz_last_delivery so saved-address card appears (tests both branches)
  localStorage.removeItem('bz_last_delivery');
  console.log('[test] cart seeded');
});

await page.reload();
await page.waitForTimeout(800);

// ── 2. Navigate to /checkout ────────────────────────────────────────────────
console.log('\n=== navigating to /checkout ===');
await page.goto(`${BASE}/checkout`);
await page.waitForTimeout(1500);

const h2Text = await page.textContent('h2').catch(() => 'not found');
console.log('Page h2:', h2Text);

// Check if the error boundary already fired
const bodyText = await page.textContent('body').catch(() => '');
if (bodyText.includes('schiefgelaufen')) {
  console.error('ERROR BOUNDARY ON LOAD:', bodyText.slice(0, 200));
  await browser.close();
  process.exit(1);
}

// ── 3. Fill delivery form ───────────────────────────────────────────────────
console.log('\n=== filling delivery form ===');

// If saved-address card is shown, click "Neue Adresse eingeben"
const newAddrBtn = page.locator('button:has-text("Neue Adresse eingeben")');
const savedCardBtn = page.locator('button:has-text("Gespeicherte Adresse verwenden")');
if (await savedCardBtn.isVisible().catch(() => false)) {
  console.log('saved-address card visible — clicking "Neue Adresse eingeben"');
  await newAddrBtn.click();
  await page.waitForTimeout(500);
}

// Fill delivery fields
const fields = [
  ['input[name="fullName"]',    'Max Mustermann'],
  ['input[name="street"]',      'Teststraße'],
  ['input[name="houseNumber"]', '42'],
  ['input[name="postalCode"]',  '10115'],
  ['input[name="city"]',        'Berlin'],
  ['input[name="phone"]',       '+49 151 99999999'],
  ['input[name="email"]',       'test@example.com'],
];

for (const [sel, val] of fields) {
  const el = page.locator(sel).first();
  if (await el.isVisible().catch(() => false)) {
    await el.fill(val);
    console.log(`filled ${sel} → ${val}`);
  } else {
    console.log(`SKIP (not visible): ${sel}`);
  }
}

// Submit delivery step
const nextBtn = page.locator('button:has-text("Weiter zur Zahlung"), button[type="submit"]').first();
await nextBtn.click();
console.log('clicked next');
await page.waitForTimeout(1000);

const h2After = await page.textContent('h2').catch(() => 'not found');
console.log('After delivery next, h2:', h2After);

// Handle StepAccount if present (guest flow)
const accountH2 = await page.locator('h2:has-text("Konto")').isVisible().catch(() => false);
if (accountH2) {
  console.log('StepAccount visible — skipping');
  const skipBtn = page.locator('button:has-text("Ohne Konto")');
  await skipBtn.click();
  await page.waitForTimeout(500);
}

// ── 4. Payment step ─────────────────────────────────────────────────────────
console.log('\n=== payment step ===');
const payH2 = await page.textContent('h2').catch(() => '');
console.log('Payment h2:', payH2);

// Select PayPal
const paypalBtn = page.locator('button:has-text("PayPal")');
if (await paypalBtn.isVisible().catch(() => false)) {
  await paypalBtn.click();
  console.log('selected PayPal');
} else {
  // try first payment card
  const firstCard = page.locator('.co-pay-card').first();
  await firstCard.click();
  console.log('selected first payment card');
}

await page.waitForTimeout(300);

// Click submit order — capture timestamp
console.log('\n=== submitting order (watching for crash) ===');
const submitBtn = page.locator('button:has-text("Jetzt bestellen")');
await submitBtn.click();
console.log('[test] submit clicked at', new Date().toISOString());

// Wait up to 15 s watching for either success or error boundary
let result = 'unknown';
for (let i = 0; i < 30; i++) {
  await page.waitForTimeout(500);
  const body = await page.textContent('body').catch(() => '');
  if (body.includes('schiefgelaufen')) {
    result = 'ERROR_BOUNDARY';
    break;
  }
  if (body.includes('Bestellung aufgegeben')) {
    result = 'SUCCESS';
    break;
  }
  if (body.includes('Order received') || body.includes('Track My Order')) {
    result = 'TRACKING';
    break;
  }
}

console.log('\n=== RESULT:', result, '===');

if (result === 'ERROR_BOUNDARY') {
  // Grab the rendered page text for clues
  const errBody = await page.textContent('body').catch(() => '');
  console.error('Error boundary body:', errBody.slice(0, 400));
}

// Print all captured [checkout] logs
console.log('\n=== [checkout] console logs ===');
logs.filter(l => l.includes('[checkout]')).forEach(l => console.log(l));

console.log('\n=== all errors ===');
errors.forEach(e => console.error(e));

console.log('\n=== all console messages ===');
logs.forEach(l => console.log(l));

await browser.close();
process.exit(result === 'SUCCESS' || result === 'TRACKING' ? 0 : 1);
