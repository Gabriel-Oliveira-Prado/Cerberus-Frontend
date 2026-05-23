document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Captura o formulário pelo ID (certifique-se de usar <form id="formulario-cadastro"> no seu HTML)
    const formulario_cadastro = document.getElementById('formulario-cadastro');

    if (!formulario_cadastro) {
        console.error("Erro: Formulário com o ID 'formulario-cadastro' não foi encontrado no seu HTML.");
        return;
    }

    // 2. Escuta o momento em que o usuário clica no botão de enviar/cadastrar
    formulario_cadastro.addEventListener('submit', async (event) => {
        // Impede que a página recarregue
        event.preventDefault();

        // 3. Captura os valores que o usuário digitou (verifique os IDs no seu HTML)
        const nomeValue = document.getElementById('nome').value;
        const emailValue = document.getElementById('email').value;
        const passwordValue = document.getElementById('senha').value;

        // 4. Cria o objeto JavaScript estruturado com os nomes esperados pelo Flask
        const dadosFormulario = {
            nome: nomeValue,
            email: emailValue,
            password: passwordValue
        };

        try {
            // 5. Envia o JSON para a rota de registro que você já tem no Flask
            const resposta = await fetch(`http://${window.location.hostname}:5000/api/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dadosFormulario)
            });

            const resultado = await resposta.json();

            // 6. Trata o retorno com base nas respostas do Flask
            if (resultado.success) {
                alert("Sucesso: " + resultado.message);
                
                // Redireciona o usuário de volta para a página de login
                window.location.href = '../../public/views/login.html'; 
            } else {
                // Exibe mensagens como "Email já registrado!" vindas do backend
                alert("Erro: " + resultado.message);
            }

        } catch (erro) {
            console.error("Erro na comunicação com o backend:", erro);
            alert("Não foi possível conectar ao servidor. O seu backend Flask está ligado?");
        }
    });
});