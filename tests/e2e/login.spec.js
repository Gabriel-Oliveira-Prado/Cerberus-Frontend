import { test, expect } from '@playwright/test';

test.describe('Login E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the login page
    await page.goto('/login');
  });

  test('should load the page and show correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Cerberus - Login/);
  });

  test('should validate email format and show sweetalert warning', async ({ page }) => {
    // Fill in credentials with invalid email format (passes HTML5, fails regex)
    await page.fill('#email', 'test@invalid');
    await page.fill('#senha', '123456');

    // Click submit button
    await page.click('button[type="submit"]');

    // SweetAlert2 modal title should say "E-mail inválido!"
    const swalTitle = page.locator('.swal2-title');
    await expect(swalTitle).toBeVisible();
    await expect(swalTitle).toHaveText('E-mail inválido!');

    // Close Swal
    await page.click('.swal2-confirm');
    await expect(swalTitle).not.toBeVisible();
  });

  test('should show credentials error or connection error when submitting wrong details', async ({ page }) => {
    // Fill in valid email format but wrong credentials
    await page.fill('#email', 'test@cerberus.com.br');
    await page.fill('#senha', 'wrong_password_here');

    // Click submit button
    await page.click('button[type="submit"]');

    // Wait for SweetAlert2 modal to pop up (either "Erro!" or "Erro de conexão!")
    const swalTitle = page.locator('.swal2-title');
    await expect(swalTitle).toBeVisible();
    const titleText = await swalTitle.textContent();
    
    // It should be one of these errors
    expect(['Erro!', 'Erro de conexão!']).toContain(titleText);
  });
});
