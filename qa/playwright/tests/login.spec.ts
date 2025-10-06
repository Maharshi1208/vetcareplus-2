import { test, expect } from '@playwright/test';

const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:5173';

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${FRONTEND}/login`, { waitUntil: 'domcontentloaded' });
  });

  // 1. Valid login (already exists)
  test('valid login navigates to dashboard', async ({ page }) => {
    await page.locator('input[name="email"]').fill('yashtest@gmail.com');
    await page.locator('input[name="password"]').fill('123456');
    await page.getByRole('button', { name: /login|sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/i);
  });

  // 2. Email format validation (invalid format)
  test('email format validation', async ({ page }) => {
    await page.locator('input[name="email"]').fill('invalid-email');
    await page.locator('input[name="password"]').fill('123456');
    await page.getByRole('button', { name: /login|sign in/i }).click();
    const emailError = await page.locator('text=Enter a valid email');
    await expect(emailError).toBeVisible();
    await expect(page).toHaveURL(/\/login/i);
  });

  // 3. Required field validation
  test('required field validation', async ({ page }) => {
    await page.getByRole('button', { name: /login|sign in/i }).click();
    const emailRequiredError = await page.locator('text=Enter a valid email');
    const passwordRequiredError = await page.locator('text=Password must be at least 6 characters');
    await expect(emailRequiredError).toBeVisible();
    await expect(passwordRequiredError).toBeVisible();
  });

  // 4. Successful logout redirects to login page
  test('logout returns to login (smoke)', async ({ page }) => {
    await page.locator('input[name="email"]').fill('yashtest@gmail.com');
    await page.locator('input[name="password"]').fill('123456');
    await page.getByRole('button', { name: /login|sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/i);

    const logout = page.getByRole('button', { name: /logout/i }).or(page.getByRole('link', { name: /logout/i }));
    await logout.first().click();

    await expect(page).toHaveURL(/\/login/i);
  });

  // 5. Email field required validation (if empty)
  test('email required validation', async ({ page }) => {
    await page.locator('input[name="password"]').fill('123456');
    await page.getByRole('button', { name: /login|sign in/i }).click();
    const emailRequiredError = await page.locator('text=Enter a valid email');
    await expect(emailRequiredError).toBeVisible();
  });

  // 6. Password field required validation (if empty)
  test('password required validation', async ({ page }) => {
    await page.locator('input[name="email"]').fill('yashtest@gmail.com');
    await page.getByRole('button', { name: /login|sign in/i }).click();
    const passwordRequiredError = await page.locator('text=Password must be at least 6 characters');
    await expect(passwordRequiredError).toBeVisible();
  });

  // 7. Password less than 6 characters validation
  test('password less than 6 characters', async ({ page }) => {
    await page.locator('input[name="email"]').fill('yashtest@gmail.com');
    await page.locator('input[name="password"]').fill('123'); // Password too short
    await page.getByRole('button', { name: /login|sign in/i }).click();
    const passwordError = await page.locator('text=Password must be at least 6 characters');
    await expect(passwordError).toBeVisible();
    await expect(page).toHaveURL(/\/login/i);
  });

  // 8. Successful login with proper credentials
  test('login with correct credentials', async ({ page }) => {
    await page.locator('input[name="email"]').fill('yashtest@gmail.com');
    await page.locator('input[name="password"]').fill('123456');
    await page.getByRole('button', { name: /login|sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/i); // Should land on dashboard
  });
});
