import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../../docs/reports/phase-02');

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 800, height: 900 }, reducedMotion: 'reduce' });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(String(e)));
await page.goto('http://127.0.0.1:8081', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await page.getByText('Try the Donut Builder').first().click();
await page.waitForTimeout(2500);
const ok = (await page.getByText(/IRR/).count()) >= 1;
console.log('reduced-motion price visible:', ok);
await page.screenshot({ path: path.join(OUT, 'builder-reduced-motion-800.png') });
console.log('pageerrors:', errs.length ? errs : 'none');
await browser.close();
if (!ok) process.exit(1);
