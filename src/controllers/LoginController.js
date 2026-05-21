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
      formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Feedback visual de carregamento no botão
        const btn = formLogin.querySelector('button[type="submit"]');
        const conteudoOriginal = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Autenticando...';
        btn.disabled = true;

        // Simulação de autenticação assíncrona
        setTimeout(() => {
          sessionStorage.setItem('authenticated', 'true');
          window.location.href = '/dashboard';
        }, 1500);
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
