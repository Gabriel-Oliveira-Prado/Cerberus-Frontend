import { test, expect } from '@playwright/test';

const authenticatedUser = {
  nome: 'Operador Cerberus',
  email: 'operador@example.com',
  avatar_url: null,
  avatar_version: null,
  db_connected: true,
  db_name: 'operacional'
};

async function mockAuthenticatedSession(page) {
  await page.route('**/api/verify', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(authenticatedUser)
    });
  });
}

test.describe('Superfícies operacionais', () => {
  test('abre as páginas legais sem depender do backend', async ({ page }) => {
    await page.goto('/termos');
    await expect(page.getByRole('heading', { name: 'Termos de uso' })).toBeVisible();
    await expect(page.getByText('Uso autorizado')).toBeVisible();

    await page.getByRole('link', { name: 'Voltar ao Cerberus' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('renderiza o dashboard sem ações cenográficas ou invasivas', async ({ page }) => {
    await mockAuthenticatedSession(page);
    await page.goto('/dashboard');

    await expect(page.getByRole('heading', { name: 'Visão geral' })).toBeVisible();
    await expect(page.locator('.metric-item')).toHaveCount(4);
    await expect(page.getByText('Operador Cerberus', { exact: true })).toBeVisible();
    await expect(page.getByText('operador@example.com', { exact: true })).toBeVisible();
    await expect(page.locator('#badge-sistema-online')).toHaveCount(0);
    await expect(page.locator('.cerberus-nav-indice')).toHaveCount(0);
    await expect(page.getByText('Workspace', { exact: true })).toHaveCount(0);
    await expect(page.locator('.cerberus-nav-item .cerberus-nav-icone')).toHaveCount(5);
    await expect(page.locator('.cerberus-conta-botao .bi-gear')).toBeVisible();
    await expect(page.locator('.cerberus-conta-painel > .cerberus-rotulo-secao')).toHaveCount(0);
    await expect(page.locator('#breadcrumb-database')).toHaveText('operacional');
    await expect(page.locator('#breadcrumb-current')).toHaveText('Visão geral');

    await page.getByRole('button', { name: 'Abrir ações da visão geral' }).click();
    await expect(page.getByRole('button', { name: 'Exportar consultas' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Atualizar dados' })).toBeVisible();
    await expect(page.getByText('Teste de Estresse')).toHaveCount(0);
  });

  test('ações das tabelas abrem acima sem aumentar a linha', async ({ page }) => {
    await mockAuthenticatedSession(page);
    await page.route('**/api/backups', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          backups: [{
            date: '25/08/2026 09:30',
            filename: 'operacional.sql',
            size: '24 KB',
            retention: '30 dias'
          }]
        })
      });
    });

    await page.goto('/backups');
    const row = page.locator('#backups-table-body tr');
    const trigger = row.getByRole('button', { name: 'Abrir ações do backup operacional.sql' });
    const menu = row.locator('.table-action-menu .dropdown-menu');
    await expect(trigger).toBeVisible();
    const rowHeightBefore = await row.evaluate((element) => element.getBoundingClientRect().height);

    await trigger.click();
    await expect(menu).toBeVisible();
    const triggerBox = await trigger.boundingBox();
    const menuBox = await menu.boundingBox();
    const rowHeightAfter = await row.evaluate((element) => element.getBoundingClientRect().height);

    expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(triggerBox.y + 2);
    expect(rowHeightAfter).toBe(rowHeightBefore);
  });

  test('estrutura apresenta catálogo real recebido da API', async ({ page }) => {
    await mockAuthenticatedSession(page);
    await page.route('**/api/schema', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          dbname: 'operacional',
          tables: [
            {
              name: 'clientes',
              kind: 'table',
              columns: [
                { name: 'id', type: 'integer', pk: true, nullable: false },
                { name: 'nome', type: 'varchar(100)', pk: false, nullable: false }
              ],
              indexes: [{ name: 'clientes_email_key', columns: ['email'], unique: true }]
            },
            {
              name: 'pedidos',
              kind: 'table',
              columns: [
                { name: 'id', type: 'integer', pk: true, nullable: false },
                { name: 'cliente_id', type: 'integer', pk: false, nullable: false }
              ],
              indexes: []
            }
          ],
          relationships: [
            {
              from_table: 'pedidos',
              from_col: 'cliente_id',
              to_table: 'clientes',
              to_col: 'id'
            }
          ]
        })
      });
    });

    await page.goto('/estrutura');
    await expect(page.locator('.schema-summary-item').filter({ hasText: 'Objetos' })).toContainText('2');
    await expect(page.locator('#schema-graph')).toBeVisible();
    await expect(page.locator('.schema-object-inspector h4')).toHaveText('clientes');

    await page.getByRole('button', { name: 'Catálogo' }).click();
    await expect(page.getByText('pedidos.cliente_id')).toBeVisible();

    await page.getByRole('button', { name: 'Abrir ações da estrutura' }).click();
    await expect(page.getByRole('button', { name: 'Baixar JSON' })).toBeVisible();
  });

  test('perfil carrega identidade e envia uma foto válida', async ({ page }) => {
    await mockAuthenticatedSession(page);
    await page.route('**/api/user/update', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Perfil atualizado',
          nome: 'Operador Atualizado',
          email: authenticatedUser.email,
          avatar_url: null,
          avatar_version: null
        })
      });
    });
    await page.route('**/api/user/avatar*', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'image/png',
          body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          avatar_url: '/api/user/avatar',
          avatar_version: 'avatar-test.png'
        })
      });
    });

    await page.goto('/configuracoes');
    await expect(page.locator('.cerberus-conta-botao')).toHaveClass(/ativo/);
    await expect(page.locator('#breadcrumb-current')).toHaveText('Configurações');
    await expect(page.locator('.settings-account-toolbar .action-menu-button')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Desconectar banco' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible();
    await expect(page.locator('#input-nome-exibicao')).toHaveValue('Operador Cerberus');
    await expect(page.locator('#input-email-conta')).toHaveValue('operador@example.com');

    await page.locator('#input-nome-exibicao').fill('Operador Atualizado');
    await page.locator('#input-foto-perfil').setInputFiles({
      name: 'avatar.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')
    });

    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(page.locator('.swal2-title')).toHaveText('Perfil atualizado');
    await expect(page.getByText('Operador Atualizado', { exact: true })).toBeVisible();
  });

  test('preferências da interface são aplicadas e persistem no navegador', async ({ page }) => {
    await mockAuthenticatedSession(page);
    await page.goto('/configuracoes');
    await page.getByRole('tab', { name: 'Interface' }).click();

    await page.locator('#modo-compacto').check();
    await page.locator('#mostrar-descricoes-sidebar').uncheck();
    await expect(page.locator('body')).toHaveClass(/density-compact/);
    await expect(page.locator('body')).toHaveClass(/sidebar-descriptions-hidden/);

    await page.reload();
    await expect(page.locator('body')).toHaveClass(/density-compact/);
    await expect(page.locator('body')).toHaveClass(/sidebar-descriptions-hidden/);
  });

  test('pede confirmação antes de desconectar o banco', async ({ page }) => {
    let disconnectRequests = 0;
    await mockAuthenticatedSession(page);
    await page.route('**/api/database/disconnect', async (route) => {
      disconnectRequests += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    await page.goto('/configuracoes');
    const disconnectButton = page.getByRole('button', { name: 'Desconectar banco' });
    await expect(disconnectButton).toBeEnabled();

    await disconnectButton.click();
    await expect(page.locator('.swal2-title')).toHaveText('Desconectar o banco?');
    await expect(page.locator('.swal2-html-container')).toContainText('Os dados do banco não serão apagados.');
    await page.getByRole('button', { name: 'Cancelar' }).click();
    expect(disconnectRequests).toBe(0);
    await expect(page).toHaveURL(/\/configuracoes$/);

    await disconnectButton.click();
    await page.getByRole('button', { name: 'Desconectar' }).click();
    await expect.poll(() => disconnectRequests).toBe(1);
    await expect(page).toHaveURL(/\/conectar$/);
  });

  test('pede confirmação antes de sair pelas configurações', async ({ page }) => {
    let logoutRequests = 0;
    await mockAuthenticatedSession(page);
    await page.route('**/api/logout', async (route) => {
      logoutRequests += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    await page.goto('/configuracoes');
    const logoutButton = page.getByRole('button', { name: 'Sair', exact: true }).last();

    await logoutButton.click();
    await expect(page.locator('.swal2-title')).toHaveText('Sair da conta?');
    await page.getByRole('button', { name: 'Cancelar' }).click();
    expect(logoutRequests).toBe(0);
    await expect(page).toHaveURL(/\/configuracoes$/);

    await logoutButton.click();
    await page.locator('.swal2-confirm').click();
    await expect.poll(() => logoutRequests).toBe(1);
    await expect(page).toHaveURL(/\/login$/);
  });

  test('pede a mesma confirmação antes de sair pela sidebar', async ({ page }) => {
    let logoutRequests = 0;
    await mockAuthenticatedSession(page);
    await page.route('**/api/logout', async (route) => {
      logoutRequests += 1;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      });
    });

    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Abrir ações da conta' }).click();
    await page.locator('#btn-sidebar-logout').click();
    await expect(page.locator('.swal2-title')).toHaveText('Sair da conta?');
    await page.getByRole('button', { name: 'Cancelar' }).click();
    expect(logoutRequests).toBe(0);
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
