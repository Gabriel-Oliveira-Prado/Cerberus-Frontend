import Swal from 'sweetalert2';

export default class LoginController {
  async init() {
    this.bindEvents();
  }

  bindEvents() {
    const formLogin = document.getElementById('formulario-login');
    const btnRecuperar = document.getElementById('btn-recuperar');

    if (formLogin) {
      formLogin.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const btn = formLogin.querySelector('button[type="submit"]');
        const conteudoOriginal = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Autenticando...';
        btn.disabled = true;

        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      });
    }

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
