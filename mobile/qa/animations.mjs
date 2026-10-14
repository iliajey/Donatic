import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../../docs/reports/phase-02');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 800, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto('http://127.0.0.1:8081', { waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await page.getByText('Try the Donut Builder').first().click();
await page.waitForTimeout(2500);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(400);

async function tapChip(name) {
  const chip = page.getByText(name, { exact: true }).first();
  await chip.dispatchEvent('click');
}

await tapChip('Chocolate');
await page.waitForTimeout(180);
await page.screenshot({ path: path.join(OUT, 'builder-pour-mid-800.png') });
await page.waitForTimeout(1400);
await page.screenshot({ path: path.join(OUT, 'builder-pour-settled-800.png') });

await tapChip('Gold Dust');
await page.waitForTimeout(120);
await page.screenshot({ path: path.join(OUT, 'builder-drop-mid-800.png') });
await tapChip('Coconut Flakes');
await page.waitForTimeout(1800);
await page.screenshot({ path: path.join(OUT, 'builder-full-800.png') });
console.log('pageerrors:', errors.length ? errors : 'none');
await browser.close();
console.log('animation frames captured');
