import { Router } from './Router.js';
import Swal from 'sweetalert2';

export default class ConectarController {
  async init() {
    this.form = document.getElementById('form-conectar-banco');
    this.btn = document.getElementById('btn-conectar');

    if (this.form) {
      this.form.addEventListener('submit', this.handleConnect.bind(this));
    }
  }

  async handleConnect(e) {
    e.preventDefault();

    this.btn.disabled = true;
    this.btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Conectando...';

    const host = document.getElementById('db-host').value;
    const name = document.getElementById('db-name').value;
    const port = document.getElementById('db-port').value;
    const user = document.getElementById('db-user').value;
    const pass = document.getElementById('db-pass').value;

    try {
      const response = await fetch('http://localhost:3000/api/db/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, database: name, port, user, password: pass })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Salva estado de conexão no sessionStorage
        sessionStorage.setItem('db_connected', 'true');
        sessionStorage.setItem('db_name', name);

        // Redireciona para o dashboard
        const router = new Router();
        router.navigate('/dashboard');
      } else {
        throw new Error(data.error || 'Falha de autenticação ou host não encontrado.');
      }
    } catch (error) {
      Swal.fire({
        title: 'Falha na Conexão',
        text: error.message || 'Falha ao conectar no banco de dados',
        icon: 'error',
        confirmButtonColor: '#dc3545'
      });
      this.btn.disabled = false;
      this.btn.innerHTML = 'Testar e Conectar';
    }
  }
}
