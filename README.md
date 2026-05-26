# Cerberus Frontend

O **Cerberus** é uma plataforma de monitoramento, performance e auditoria de segurança de bancos de dados em tempo real. Este é o repositório do **Frontend**.

## 🛠 Tecnologias Usadas
- **HTML / CSS / JavaScript** puro e moderno.
- **Socket.IO-client** (Comunicação bidirecional Real-time).
- **Chart.js** (Renderização dos gráficos do Dashboard).
- **SweetAlert2** (Pop-ups e Notificações elegantes).
- **Vite** (Ferramenta de Build rápida e Servidor de Desenvolvimento).

## ⚠️ Pré-requisitos
Para o painel funcionar corretamente, você precisará do **Node.js** (versão 16 ou superior) e também do **Backend do Cerberus** rodando em paralelo na sua máquina.

## 🚀 Como Iniciar o Projeto

1. **Clone e inicie o Backend primeiro:**
   O frontend se comunica via WebSockets com a API do backend. Certifique-se de baixar e iniciar o repositório do backend primeiro:
   ```bash
   git clone https://github.com/Gabriel-Oliveira-Prado/Cerberus-Backend
   ```
   *(Siga as instruções no `README.md` do backend para iniciá-lo. Normalmente, ele rodará na porta `5000`)*.

2. **Clone este repositório (Frontend):**
   ```bash
   git clone https://github.com/Gabriel-Oliveira-Prado/Cerberus-Frontend
   cd Cerberus-Frontend
   ```

3. **Instale as dependências:**
   ```bash
   npm install
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   
5. **Acesse o sistema:**
   Abra o seu navegador no endereço exibido no terminal (geralmente será `http://localhost:5173`).

---

## 🌟 Funcionalidades
- **Dashboard em Tempo Real:** Visualize suas conexões ativas, requisições de I/O de disco (Leitura e Escrita), tempo de resposta (Latência) e QPM (Queries per minute), tudo em tempo real através de WebSockets.
- **Segurança (Auditoria):** Liste detalhadamente as sessões ociosas e ativas no banco de dados. Exporte logs de sessões.
- **Conexões Independentes:** Possibilidade de adicionar bancos MySQL ou PostgreSQL (inclusive serviços em nuvem como o Supabase).
