import Swal from 'sweetalert2';
import { BASE_URL } from '../config/api.js';

export default class CadastroController {
  async init() {
    this.form = document.getElementById('formulario-cadastro');
    this.form?.addEventListener('submit', this.handleSubmit);
  }

  handleSubmit = async (event) => {
    event.preventDefault();
    if (!this.form?.reportValidity()) return;

    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmar-senha').value;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      await Swal.fire({
        title: 'E-mail inválido',
        text: 'Informe um endereço de e-mail completo.',
        icon: 'warning',
        confirmButtonColor: '#dc3545'
      });
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(senha)) {
      await Swal.fire({
        title: 'Senha fora do padrão',
        text: 'Use ao menos 8 caracteres, com letra maiúscula, minúscula e número.',
        icon: 'warning',
        confirmButtonColor: '#dc3545'
      });
      return;
    }

    if (senha !== confirmarSenha) {
      await Swal.fire({
        title: 'Senhas diferentes',
        text: 'A confirmação precisa ser igual à nova senha.',
        icon: 'warning',
        confirmButtonColor: '#dc3545'
      });
      return;
    }

    const button = this.form.querySelector('button[type="submit"]');
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Criando conta';

    try {
      const response = await fetch(`${BASE_URL}/api/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, password: senha })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Não foi possível criar a conta.');
      }

      await Swal.fire({
        title: 'Conta criada',
        text: 'Entre com as credenciais cadastradas.',
        icon: 'success',
        confirmButtonColor: '#dc3545'
      });
      window.history.pushState({}, '', '/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (error) {
      const isNetworkError = error instanceof TypeError;
      await Swal.fire({
        title: isNetworkError ? 'Servidor indisponível' : 'Cadastro não concluído',
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
