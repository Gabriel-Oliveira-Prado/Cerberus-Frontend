import Swal from 'sweetalert2';
import { BASE_URL } from '../config/api.js';

export default class ConectarController {
  async init() {
    this.form = document.getElementById('form-conectar-banco');
    this.button = document.getElementById('btn-conectar');
    this.engineSelect = document.getElementById('db-engine');

    this.form?.addEventListener('submit', this.handleConnect);
    this.engineSelect?.addEventListener('change', this.handleEngineChange);
  }

  handleEngineChange = (event) => {
    const port = document.getElementById('db-port');
    if (port) port.value = event.target.value === 'mysql' ? '3306' : '5432';
  };

  handleConnect = async (event) => {
    event.preventDefault();
    if (!this.form?.reportValidity()) return;

    const port = Number(document.getElementById('db-port').value);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      await Swal.fire({
        title: 'Porta inválida',
        text: 'Informe um número entre 1 e 65535.',
        icon: 'warning',
        confirmButtonColor: '#dc3545'
      });
      return;
    }

    const payload = {
      engine: this.engineSelect.value,
      host: document.getElementById('db-host').value.trim(),
      port,
      dbname: document.getElementById('db-name').value.trim(),
      dbuser: document.getElementById('db-user').value.trim(),
      dbpassword: document.getElementById('db-pass').value
    };

    const originalText = this.button.textContent;
    this.button.disabled = true;
    this.button.textContent = 'Testando conexão';

    try {
      const response = await fetch(`${BASE_URL}/api/conectar`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'O banco recusou a conexão.');
      }

      sessionStorage.setItem('db_connected', 'true');
      sessionStorage.setItem('db_name', payload.dbname);
      window.history.pushState({}, '', '/dashboard');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (error) {
      await Swal.fire({
        title: error instanceof TypeError ? 'Servidor indisponível' : 'Conexão não estabelecida',
        text: error instanceof TypeError
          ? 'Não foi possível acessar a API do Cerberus.'
          : error.message,
        icon: 'error',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      this.button.disabled = false;
      this.button.textContent = originalText;
    }
  };

  destroy() {
    this.form?.removeEventListener('submit', this.handleConnect);
    this.engineSelect?.removeEventListener('change', this.handleEngineChange);
  }
}

