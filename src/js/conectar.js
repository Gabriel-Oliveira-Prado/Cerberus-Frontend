// Aguarda todo o HTML da página carregar antes de rodar o script
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Captura o formulário pelo ID (certifique-se de que no HTML está: <form id="form-conectar-banco">)
    const loginForm = document.getElementById('form-conectar-banco');

    if (!loginForm) {
        console.error("Erro: Formulário com o ID 'form-conectar-banco' não foi encontrado no seu HTML.");
        return;
    }

    // 2. Escuta o momento em que o usuário clica no botão de enviar
    loginForm.addEventListener('submit', async (event) => {
        // Impede que a página recarregue e limpe os campos antes da hora
        event.preventDefault();

        // 3. Captura os valores que o usuário digitou (certifique-se dos IDs 'email' e 'password' no HTML)
        const db_hostValue = document.getElementById('db-host').value;
        const db_portValue = document.getElementById('db-port').value;
        const db_nameValue = document.getElementById('db-name').value;
        const db_userValue = document.getElementById('db-user').value;
        const db_passValue = document.getElementById('db-pass').value;

        // 4. Cria o objeto JavaScript com as informações estruturadas
        const dadosFormulario = {
            host: db_hostValue,
            port: db_portValue,
            dbname: db_nameValue,
            dbuser: db_userValue,
            dbpassword: db_passValue
        };

        try {
            // 5. Envia o objeto transformado em texto JSON para a rota do Flask
            const resposta = await fetch('http://127.0.0.1:5000/api/conectar', {
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

                window.location.href = '../../public/views/dashboard.html'; 
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