import Swal from 'sweetalert2';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('formulario-login');

    if (!loginForm) {
        console.error("Erro: Formulário com o ID 'formulario-login' não foi encontrado no seu HTML.");
        return;
    }

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const emailValue = document.getElementById('email').value;
        const passwordValue = document.getElementById('senha').value;

        // Validação de email (regex simples que falha com 'test@invalid')
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailValue)) {
            Swal.fire({
                icon: 'error',
                title: 'E-mail inválido!',
                text: 'Por favor, insira um e-mail com formato válido (ex: teste@dominio.com).'
            });
            return;
        }

        const dadosFormulario = {
            email: emailValue,
            password: passwordValue
        };

        try {
            const isLocalhost = 
                window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1' || 
                window.location.hostname.startsWith('192.168.') ||
                window.location.hostname.startsWith('10.') ||
                window.location.hostname.startsWith('172.');
            const baseUrl = isLocalhost 
                ? `http://${window.location.hostname}:5000`
                : 'https://cerberus-backend-eojx.onrender.com';
                
            const resposta = await fetch(`${baseUrl}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dadosFormulario)
            });

            const resultado = await resposta.json();

            if (resultado.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Sucesso',
                    text: resultado.message
                }).then(() => {
                    window.location.href = '../../public/views/conectar.html'; 
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Erro!',
                    text: resultado.message || 'Credenciais inválidas!'
                });
            }

        } catch (erro) {
            console.error("Erro na comunicação com o backend:", erro);
            Swal.fire({
                icon: 'error',
                title: 'Erro de conexão!',
                text: 'Não foi possível conectar ao servidor. O seu backend Flask está ligado?'
            });
        }
    });
});