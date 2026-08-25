import { test, expect } from '@playwright/test';

test.describe('Fluxo de login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Acessar conta' })).toBeVisible();
  });

  test('carrega a identidade, o formulário e os links legais', async ({ page }) => {
    await expect(page).toHaveTitle(/Cerberus \| Login/);
    await expect(page.getByRole('heading', { name: 'Acessar conta' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Símbolo do Cerberus' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Termos de uso' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Privacidade' })).toBeVisible();
  });

  test('valida e-mail incompleto antes de chamar o servidor', async ({ page }) => {
    await page.fill('#email', 'teste@invalido');
    await page.fill('#senha', 'Senha123');
    await page.click('button[type="submit"]');

    const title = page.locator('.swal2-title');
    await expect(title).toBeVisible();
    await expect(title).toHaveText('E-mail inválido');
  });

  test('mantém o layout utilizável em viewport móvel', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('heading', { name: 'Acessar conta' })).toBeVisible();
    await expect(page.locator('#email')).toBeInViewport();
    await expect(page.locator('button[type="submit"]')).toBeInViewport();
  });

  test('mantém a cor da marca enquanto autentica', async ({ page }) => {
    let releaseLogin;
    const loginGate = new Promise((resolve) => {
      releaseLogin = resolve;
    });
    await page.route('**/api/login', async (route) => {
      await loginGate;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          nome: 'Operador Cerberus',
          email: 'operador@example.com',
          db_connected: false
        })
      });
    });

    await page.fill('#email', 'operador@example.com');
    await page.fill('#senha', 'Senha123');
    const button = page.locator('button[type="submit"]');
    await button.click();

    try {
      await expect(button).toBeDisabled();
      await expect(button).toHaveText('Autenticando');
      await expect(button).toHaveCSS('background-color', 'rgb(220, 53, 69)');
    } finally {
      releaseLogin();
    }
  });
});
