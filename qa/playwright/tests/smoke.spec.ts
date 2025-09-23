import { test } from '@playwright/test';

test('loads baseURL and captures screenshot', async ({ page, baseURL }) => {
  const target = baseURL!;
  await page.goto(target, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000); // give UI a moment to settle
  await page.screenshot({ path: `../playwright/artifacts/smoke_screenshot.png`, fullPage: true }).catch(() => {});
});
