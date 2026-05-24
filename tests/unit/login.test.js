import Swal from 'sweetalert2';
import LoginController from '../../src/controllers/LoginController.js';

// Mock sweetalert2
jest.mock('sweetalert2', () => ({
  fire: jest.fn().mockImplementation(() => Promise.resolve({ isConfirmed: true }))
}));

// Mock the API config to avoid import.meta syntax issues
jest.mock('../../src/config/api.js', () => ({
  BASE_URL: 'http://localhost:5000'
}));

describe('LoginController Unit Tests', () => {
  let controller;
  beforeAll(() => {
    // Mock global fetch
    global.fetch = jest.fn();
  });

  beforeEach(() => {
    // Reset mocks and DOM
    jest.clearAllMocks();
    sessionStorage.clear();
    
    Object.defineProperty(window.location, 'href', {
      value: 'http://localhost/',
      writable: true,
      configurable: true
    });
    
    document.body.innerHTML = `
      <form id="formulario-login">
        <input id="email" type="email" />
        <input id="senha" type="password" />
        <button type="submit">Entrar</button>
      </form>
      <button id="btn-recuperar">Recuperar Senha</button>
    `;

    controller = new LoginController();
    controller.init();
  });

  test('should show warning when email format is invalid', async () => {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('senha');
    const form = document.getElementById('formulario-login');

    emailInput.value = 'invalidemail';
    passwordInput.value = '123456';

    const submitEvent = new window.Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(submitEvent);

    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
      title: 'E-mail inválido!',
      icon: 'warning'
    }));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('should call login API and redirect when login succeeds', async () => {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('senha');
    const form = document.getElementById('formulario-login');

    emailInput.value = 'test@cerberus.com.br';
    passwordInput.value = 'correctpassword';

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Success' })
    });

    const submitEvent = new window.Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(submitEvent);

    // Wait for the async event handler execution to finish
    await new Promise(process.nextTick);

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/login', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'test@cerberus.com.br', password: 'correctpassword' })
    }));
    expect(sessionStorage.getItem('authenticated')).toBe('true');
    expect(window.location.href).toBe('/dashboard');
  });

  test('should show error modal when login fails', async () => {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('senha');
    const form = document.getElementById('formulario-login');

    emailInput.value = 'test@cerberus.com.br';
    passwordInput.value = 'wrongpassword';

    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: 'Credenciais inválidas.' })
    });

    const submitEvent = new window.Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(submitEvent);

    await new Promise(process.nextTick);

    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Erro!',
      text: 'Credenciais inválidas.',
      icon: 'error'
    }));
    expect(sessionStorage.getItem('authenticated')).toBeNull();
  });

  test('should show connection error modal when fetch fails', async () => {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('senha');
    const form = document.getElementById('formulario-login');

    emailInput.value = 'test@cerberus.com.br';
    passwordInput.value = 'password';

    global.fetch.mockRejectedValueOnce(new Error('Network Error'));

    const submitEvent = new window.Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(submitEvent);

    await new Promise(process.nextTick);

    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Erro de conexão!',
      icon: 'error'
    }));
  });

  test('should show recovery Swal prompt when recovery button is clicked', async () => {
    const btnRecuperar = document.getElementById('btn-recuperar');
    btnRecuperar.click();

    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Recuperação de Senha',
      input: 'email'
    }));

    await new Promise(process.nextTick);
    
    expect(Swal.fire).toHaveBeenLastCalledWith(expect.objectContaining({
      title: 'Enviado!',
      icon: 'success'
    }));
  });
});
