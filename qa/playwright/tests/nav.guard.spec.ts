import { test } from '@playwright/test';

test('try to navigate common pages if present (guarded)', async ({ page, baseURL }) => {
  const target = baseURL!;
  await page.goto(target, { waitUntil: 'domcontentloaded' });

  // Works for either the app (5173) or Swagger UI.
  const candidates = ['Dashboard','Pets','Owners','Vets','Appointments','Invoices','Health','Calendar','Docs','Swagger'];
  for (const text of candidates) {
    const loc = page.getByText(text, { exact: false });
    try {
      const count = await loc.count();
      if (count > 0) {
        await loc.first().click().catch(() => {});
        await page.waitForTimeout(250);
      }
    } catch { /* ignore */ }
  }

  // Always capture an artifact
  await page.screenshot({ path: `../playwright/artifacts/nav_guard.png`, fullPage: true }).catch(() => {});
});
