import Swal from 'sweetalert2';
import { BASE_URL } from '../config/api.js';

export default class LoginController {
  async init() {
    this.form = document.getElementById('formulario-login');
    this.form?.addEventListener('submit', this.handleSubmit);
  }

  handleSubmit = async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('senha').value;

    if (!email || !password) {
      this.form?.reportValidity();
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      await Swal.fire({
        title: 'E-mail inválido',
        text: 'Informe um endereço de e-mail completo.',
        icon: 'warning',
        confirmButtonColor: '#dc3545'
      });
      return;
    }

    if (!this.form?.reportValidity()) return;

    const button = this.form.querySelector('button[type="submit"]');
    const originalText = button.textContent;

    button.disabled = true;
    button.textContent = 'Autenticando';

    try {
      const response = await fetch(`${BASE_URL}/api/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Credenciais inválidas.');
      }

      sessionStorage.setItem('authenticated', 'true');
      if (data.nome && data.email) {
        sessionStorage.setItem('user_nome', data.nome);
        sessionStorage.setItem('user_email', data.email);
        document.dispatchEvent(new CustomEvent('cerberus:profile-updated', {
          detail: data
        }));
      }

      if (data.db_connected) {
        sessionStorage.setItem('db_connected', 'true');
        sessionStorage.setItem('db_name', data.db_name || '');
      } else {
        sessionStorage.removeItem('db_connected');
        sessionStorage.removeItem('db_name');
      }

      window.history.pushState({}, '', data.db_connected ? '/dashboard' : '/conectar');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (error) {
      const isNetworkError = error instanceof TypeError;
      await Swal.fire({
        title: isNetworkError ? 'Servidor indisponível' : 'Não foi possível entrar',
        text: isNetworkError ? 'Verifique se o backend do Cerberus está em execução.' : error.message,
        icon: 'error',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  };

  destroy() {
    this.form?.removeEventListener('submit', this.handleSubmit);
  }
}
