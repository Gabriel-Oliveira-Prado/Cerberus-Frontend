import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/estilos.css';
import Swal from 'sweetalert2';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formulario-login');
  const btnRecuperar = document.getElementById('btn-recuperar');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const senha = document.getElementById('senha').value;

      if(email && senha) {
        Swal.fire({
          title: 'Autenticando...',
          text: 'Verificando credenciais no banco de dados',
          icon: 'info',
          timer: 1000,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        }).then(() => {
          // Redireciona para o dashboard
          window.location.href = '/index.html';
        });
      }
    });
  }

  if (btnRecuperar) {
    btnRecuperar.addEventListener('click', () => {
      Swal.fire({
        title: 'Recuperar Senha',
        input: 'email',
        inputLabel: 'Endereço de e-mail',
        inputPlaceholder: 'Digite seu e-mail',
        showCancelButton: true,
        confirmButtonText: 'Enviar Link',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc3545'
      }).then((result) => {
        if (result.isConfirmed) {
          Swal.fire('Enviado!', 'Um link de recuperação foi enviado para ' + result.value, 'success');
        }
      });
    });
  }
});
