import { Router } from './Router.js';
import Swal from 'sweetalert2';

export default class ConectarController {
  // Inicializa o controlador e configura referências do DOM e eventos
  async init() {
    this.form = document.getElementById('form-conectar-banco');
    this.btn = document.getElementById('btn-conectar');

    if (this.form) {
      this.form.addEventListener('submit', this.handleConnect.bind(this));
    }
  }

  // Processa a submissão do formulário de conexão com o banco de dados
  async handleConnect(e) {
    e.preventDefault();

    // Feedback visual de carregamento
    this.btn.disabled = true;
    this.btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Conectando...';

    // Coleta os dados informados no formulário
    const host = document.getElementById('db-host').value;
    const dbname = document.getElementById('db-name').value;
    const port = document.getElementById('db-port').value;
    const dbuser = document.getElementById('db-user').value;
    const dbpassword = document.getElementById('db-pass').value;

    const dadosFormulario = {
            host: db_hostValue,
            port: db_portValue,
            dbname: db_nameValue,
            dbuser: db_userValue,
            dbpassword: db_passValue
        };

    try {
      // Faz requisição à API para testar/estabelecer a conexão
      const response = await fetch('http://127.0.0.1:5000/api/conectar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dadosFormulario })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Salva estado de conexão no sessionStorage
        sessionStorage.setItem('db_connected', 'true');
        sessionStorage.setItem('db_name', dbname);

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

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Captura o formulário pelo ID
    const AlterForm = document.getElementById('form-alterar-senha');

    if (!loginForm) {
        console.error("Erro: Formulário com o ID 'formulario-login' não foi encontrado no seu HTML.");
        return;
    }

    // 2. Escuta o momento em que o usuário clica no botão de enviar
    loginForm.addEventListener('submit', async (event) => {
        // Impede que a página recarregue e limpe os campos antes da hora
        event.preventDefault();

        // 3. Captura os valores que o usuário digitou (certifique-se dos IDs 'email' e 'password' no HTML)
        const emailValue = document.getElementById('email').value;
        const passwordValue = document.getElementById('senha').value;

        // 4. Cria o objeto JavaScript com as informações estruturadas
        const dadosFormulario = {
            email: emailValue,
            password: passwordValue
        };

        try {
            // 5. Envia o objeto transformado em texto JSON para a rota do Flask
            const resposta = await fetch('http://127.0.0.1:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json' // Avisa ao Flask que o corpo é um JSON
                },
                body: JSON.stringify(dadosFormulario) // Transforma o objeto JS em string JSON
            });

            // Converte a resposta enviada pelo Python de volta para um objeto JS
            const resultado = await resposta.json();

            // 6. Trata o retorno com base no status que definimos no backend
            if (resultado.success) {
                alert("Sucesso: " + resultado.message);

                window.location.href = '../../public/views/conectar.html'; 
            } else {
                // Exibe a mensagem de erro vinda do Python ("Credenciais inválidas!")
                alert("Erro: " + resultado.message);
            }

        } catch (erro) {
            console.error("Erro na comunicação com o backend:", erro);
            alert("Não foi possível conectar ao servidor. O seu backend Flask está ligado?");
        }
    });
});
