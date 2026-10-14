import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../../docs/reports/phase-02');
fs.mkdirSync(OUT, { recursive: true });

const WEB = 'http://127.0.0.1:8081';
const errors = [];
const failed = [];

function check(name, cond, extra = '') {
  console.log((cond ? 'PASS ' : 'FAIL ') + name + (extra ? ' — ' + extra : ''));
  if (!cond) failed.push(name);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 800, height: 900 } });
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(WEB, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
check('home renders headline', await page.getByText('Build Your Donut. Your Taste. Your Donatic.').count() >= 1);
check('no horizontal overflow (800)', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
await page.screenshot({ path: path.join(OUT, 'home-800.png') });

// Go to builder
await page.getByText('Try the Donut Builder').first().click();
await page.waitForTimeout(2500);
await page.screenshot({ path: path.join(OUT, 'builder-initial-800.png') });
check('builder heading', await page.getByText('Donut Builder').count() >= 1);
check('catalog base visible', await page.getByText('Classic Ring').count() >= 1);
check('server price appears', await page.getByText(/IRR/).count() >= 1, 'live validate-price');
check('server price appears', await page.getByText(/IRR/).count() >= 1, 'live validate-price');
// QA2

// Select sauce + toppings, screenshot stages
await page.getByText('Chocolate', { exact: true }).first().click();
await page.waitForTimeout(1200);
await page.screenshot({ path: path.join(OUT, 'builder-sauce-800.png') });
await page.getByText('Sugar Pearls').first().click();
await page.getByText('Pistachio Crush').first().click();
await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(OUT, 'builder-toppings-800.png') });
const priceText = await page.getByText(/IRR/).first().textContent();
console.log('Priced total visible:', priceText);
check('itemized breakdown', await page.getByText('Sugar Pearls ·').count() >= 1);

// Add to cart, verify merge behavior
await page.getByText('Add to cart').first().click();
await page.waitForTimeout(800);
check('added confirmation', await page.getByText(/Added to your cart/).count() >= 1);
await page.getByText('Added ✓ — View cart').first().click();
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(OUT, 'cart-filled-800.png') });
check('cart line present', await page.getByText('Classic Ring').count() >= 1);
check('subtotal present', await page.getByText(/Subtotal:/).count() >= 1);
const sub1 = await page.getByText(/Subtotal:/).first().textContent();
console.log('Subtotal after 1 add:', sub1);

// Back to builder, add identical config -> should merge to qty 2
await page.getByText('Add another donut').first().click();
await page.waitForTimeout(1500);
await page.getByText('Add to cart').first().click();
await page.waitForTimeout(800);
await page.getByText('Added ✓ — View cart').first().click();
await page.waitForTimeout(800);
check('merged quantity 2', await page.getByLabel('Quantity 2').count() >= 1);
const sub2 = await page.getByText(/Subtotal:/).first().textContent();
console.log('Subtotal after merge:', sub2);
console.log('Subtotal after merge:', sub2);
// QA3

// Different config stays separate: change sauce to Vanilla, add
await page.getByText('Add another donut').first().click();
await page.waitForTimeout(1500);
await page.getByText('Vanilla', { exact: true }).first().click();
await page.waitForTimeout(1200);
await page.getByText('Add to cart').first().click();
await page.waitForTimeout(800);
await page.getByText('Added ✓ — View cart').first().click();
await page.waitForTimeout(800);
await page.screenshot({ path: path.join(OUT, 'cart-two-lines-800.png') });
const cartItems = await page.getByLabel(/Quantity \d/).count();
check('two distinct lines', cartItems === 2, `qty badges: ${cartItems}`);

// Quantity +/- and remove
await page.getByLabel('Increase quantity of Classic Ring').first().click();
await page.waitForTimeout(500);
check('increment works', await page.getByLabel('Quantity 3').count() >= 1);
await page.getByLabel('Decrease quantity of Classic Ring').first().click();
await page.waitForTimeout(500);
check('decrement works', await page.getByLabel('Quantity 2').count() >= 1);

// Mobile viewport
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(800);
check('no horizontal overflow (390)', await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
await page.screenshot({ path: path.join(OUT, 'cart-390.png') });

// RTL check on home
await page.setViewportSize({ width: 800, height: 900 });
await page.getByText('Back to storefront').first().click();
await page.waitForTimeout(800);
await page.getByText(/dir: ltr/).first().click();
await page.waitForTimeout(800);
check('RTL applied', await page.evaluate(() => document.documentElement.dir === 'rtl'));
await page.screenshot({ path: path.join(OUT, 'home-rtl-800.png') });
await page.getByText(/dir: rtl/).first().click();
await page.waitForTimeout(500);

// Empty cart state (fresh context)
const ctx2 = await browser.newContext({ viewport: { width: 800, height: 900 } });
const p2 = await ctx2.newPage();
p2.on('console', (m) => {
  if (m.type() === 'error') errors.push('[cart-empty] ' + m.text());
});
await p2.goto(WEB, { waitUntil: 'networkidle' });
await p2.waitForTimeout(2000);
await p2.getByText('Cart').first().click();
await p2.waitForTimeout(800);
check('empty cart state', await p2.getByText('Your cart is empty').count() >= 1);
await p2.screenshot({ path: path.join(OUT, 'cart-empty-800.png') });
await ctx2.close();

console.log('Console errors:', errors.length ? errors : 'none');
check('zero console errors', errors.length === 0, errors.join(' | ').slice(0, 500));
console.log(failed.length ? `RESULT: ${failed.length} FAILURES` : 'RESULT: ALL PASS');
await browser.close();
if (failed.length) process.exit(1);

