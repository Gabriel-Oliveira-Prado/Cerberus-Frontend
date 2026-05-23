import Swal from 'sweetalert2';

export default class LoginController {
  // Inicializa o controlador e configura os eventos da página de login
  async init() {
    this.bindEvents();
  }

  // Associa os eventos aos elementos do DOM (formulário e botão de recuperar senha)
  bindEvents() {
    const formLogin = document.getElementById('formulario-login');
    const btnRecuperar = document.getElementById('btn-recuperar');

    if (formLogin) {
      formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Feedback visual de carregamento no botão
        const btn = formLogin.querySelector('button[type="submit"]');
        const conteudoOriginal = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Autenticando...';
        btn.disabled = true;

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('senha').value;

        // Validação de formato de e-mail usando Regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          Swal.fire({
            title: 'E-mail inválido!',
            text: 'Por favor, insira um e-mail em um formato válido.',
            icon: 'warning',
            confirmButtonColor: '#dc3545'
          });
          btn.innerHTML = conteudoOriginal;
          btn.disabled = false;
          return;
        }

        try {
          const baseUrl = `http://${window.location.hostname}:5000`;
          const response = await fetch(`${baseUrl}/api/login`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
          });

          const data = await response.json();

          if (response.ok) {
            sessionStorage.setItem('authenticated', 'true');
            window.location.href = '/dashboard';
          } else {
            Swal.fire({
              title: 'Erro!',
              text: data.message || 'Credenciais inválidas.',
              icon: 'error',
              confirmButtonColor: '#dc3545'
            });
          }
        } catch (error) {
          console.error('Erro no login:', error);
          Swal.fire({
            title: 'Erro de conexão!',
            text: 'Não foi possível conectar ao servidor.',
            icon: 'error',
            confirmButtonColor: '#dc3545'
          });
        } finally {
          btn.innerHTML = conteudoOriginal;
          btn.disabled = false;
        }
      });
    }

    // Evento de clique para o botão de recuperar senha com prompt via SweetAlert
    if (btnRecuperar) {
      btnRecuperar.addEventListener('click', () => {
        Swal.fire({
          title: 'Recuperação de Senha',
          text: 'Um link será enviado para o seu e-mail corporativo.',
          input: 'email',
          inputPlaceholder: 'usuario@cerberus.com.br',
          showCancelButton: true,
          confirmButtonColor: '#dc3545',
          cancelButtonColor: '#6c757d',
          confirmButtonText: 'Enviar',
          cancelButtonText: 'Cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            Swal.fire({
              title: 'Enviado!',
              text: 'Verifique sua caixa de entrada.',
              icon: 'success',
              confirmButtonColor: '#dc3545'
            });
          }
        });
      });
    }
  }
}
