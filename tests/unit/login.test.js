import Swal from 'sweetalert2';
import LoginController from '../../src/controllers/LoginController.js';

jest.mock('sweetalert2', () => ({
  fire: jest.fn().mockResolvedValue({ isConfirmed: true })
}));

jest.mock('../../src/config/api.js', () => ({
  BASE_URL: 'http://localhost:5000'
}));

describe('LoginController', () => {
  let controller;

  beforeAll(() => {
    global.fetch = jest.fn();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    window.history.replaceState({}, '', '/login');

    document.body.innerHTML = `
      <form id="formulario-login">
        <input id="email" type="email" required>
        <input id="senha" type="password" required>
        <button type="submit">Entrar</button>
      </form>
    `;

    controller = new LoginController();
    controller.init();
  });

  afterEach(() => {
    controller.destroy();
  });

  test('bloqueia e-mail incompleto sem chamar a API', async () => {
    document.getElementById('email').value = 'teste@invalido';
    document.getElementById('senha').value = 'Senha123';

    document.getElementById('formulario-login').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );
    await Promise.resolve();

    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
      title: 'E-mail inválido',
      icon: 'warning'
    }));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('autentica, salva o estado e navega ao dashboard', async () => {
    document.getElementById('email').value = 'teste@cerberus.com.br';
    document.getElementById('senha').value = 'Senha123';

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        nome: 'Pessoa Teste',
        email: 'teste@cerberus.com.br',
        db_connected: true,
        db_name: 'cerberus_db'
      })
    });

    document.getElementById('formulario-login').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );
    await new Promise(process.nextTick);

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/api/login',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          email: 'teste@cerberus.com.br',
          password: 'Senha123'
        })
      })
    );
    expect(sessionStorage.getItem('authenticated')).toBe('true');
    expect(sessionStorage.getItem('user_nome')).toBe('Pessoa Teste');
    expect(sessionStorage.getItem('db_name')).toBe('cerberus_db');
    expect(window.location.pathname).toBe('/dashboard');
  });

  test('mostra a mensagem retornada quando as credenciais falham', async () => {
    document.getElementById('email').value = 'teste@cerberus.com.br';
    document.getElementById('senha').value = 'SenhaErrada123';

    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: 'Credenciais inválidas.' })
    });

    document.getElementById('formulario-login').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );
    await new Promise(process.nextTick);

    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Não foi possível entrar',
      text: 'Credenciais inválidas.',
      icon: 'error'
    }));
    expect(sessionStorage.getItem('authenticated')).toBeNull();
  });

  test('diferencia indisponibilidade de erro de credencial', async () => {
    document.getElementById('email').value = 'teste@cerberus.com.br';
    document.getElementById('senha').value = 'Senha123';
    global.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    document.getElementById('formulario-login').dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );
    await new Promise(process.nextTick);

    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Servidor indisponível',
      icon: 'error'
    }));
  });
});
