import Swal from 'sweetalert2';
import { BASE_URL } from '../config/api.js';

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

        // Sanitização básica contra XSS client-side
        const escapeHTML = (str) => str.replace(/[&<>'"]/g, 
          tag => ({
              '&': '&amp;',
              '<': '&lt;',
              '>': '&gt;',
              "'": '&#39;',
              '"': '&quot;'
          }[tag]));

        const nome = escapeHTML(document.getElementById('nome').value.trim());
        const email = escapeHTML(document.getElementById('email').value.trim());
        const senha = document.getElementById('senha').value;
        const confirmarSenha = document.getElementById('confirmar-senha').value;

        // Verificação de limites
        if (nome.length > 100 || email.length > 150) {
          Swal.fire({
            title: 'Erro!',
            text: 'Os campos excedem o tamanho máximo permitido.',
            icon: 'error',
            confirmButtonColor: '#dc3545'
          });
          return;
        }

        // Validação de formato de e-mail
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          Swal.fire({
            title: 'E-mail inválido!',
            text: 'Por favor, insira um e-mail em um formato válido.',
            icon: 'warning',
            confirmButtonColor: '#dc3545'
          });
          return;
        }

        // Validação estrita de força de senha
        const senhaForteRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
        if (!senhaForteRegex.test(senha)) {
          Swal.fire({
            title: 'Senha Fraca',
            text: 'A senha deve ter no mínimo 8 caracteres, contendo pelo menos uma letra maiúscula, uma minúscula e um número.',
            icon: 'warning',
            confirmButtonColor: '#dc3545'
          });
          return;
        }

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
          const response = await fetch(`${BASE_URL}/api/register`, {
            method: 'POST',
            credentials: 'include',
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
