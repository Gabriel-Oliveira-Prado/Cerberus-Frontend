import Swal from 'sweetalert2';

export default class CadastroController {
  // Inicializa o controlador e configura os eventos da página
  async init() {
    this.bindEvents();
  }

  // Configura a escuta de eventos, especificamente o envio do formulário de cadastro
  bindEvents() {
    const formCadastro = document.getElementById('formulario-cadastro');

    if (formCadastro) {
      formCadastro.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        const confirmarSenha = document.getElementById('confirmar-senha').value;

        // Validação simples: verifica se as senhas informadas são iguais
        if (senha !== confirmarSenha) {
          Swal.fire({
            title: 'Erro!',
            text: 'As senhas não coincidem.',
            icon: 'error',
            confirmButtonColor: '#dc3545'
          });
          return;
        }

        // Altera o estado do botão para indicar carregamento (feedback visual)
        const btn = formCadastro.querySelector('button[type="submit"]');
        const conteudoOriginal = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Cadastrando...';
        btn.disabled = true;

        try {
          const response = await fetch('http://127.0.0.1:5000/api/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome, email, password: senha })
          });

          const data = await response.json();

          if (response.ok) {
            Swal.fire({
              title: 'Sucesso!',
              text: 'Conta criada com sucesso! Faça login para continuar.',
              icon: 'success',
              confirmButtonColor: '#dc3545'
            }).then(() => {
              window.location.href = '/login';
            });
          } else {
            Swal.fire({
              title: 'Erro!',
              text: data.message || 'Não foi possível realizar o cadastro.',
              icon: 'error',
              confirmButtonColor: '#dc3545'
            });
          }
        } catch (error) {
          console.error('Erro no cadastro:', error);
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
  }
}
