// Aguarda todo o HTML da página carregar antes de rodar o script
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Captura o formulário pelo ID
    const loginForm = document.getElementById('formulario-login');

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