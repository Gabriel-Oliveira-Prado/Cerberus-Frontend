# Cerberus Frontend

Interface web do Cerberus para conectar, visualizar e administrar bancos PostgreSQL e MySQL. O painel transforma métricas, estrutura, sessões, permissões e backups em fluxos operacionais conectados à API, sem demonstrações cenográficas.

Este repositório contém somente a interface. A API está no repositório `Cerberus-Backend`.

## Funcionalidades

- autenticação e cadastro integrados ao backend;
- conexão e desconexão de PostgreSQL e MySQL;
- dashboard com métricas reais do banco conectado;
- acompanhamento de sessões, papéis e permissões;
- listagem, criação, download e exclusão de backups;
- verificação de integridade do esquema;
- mapa relacional interativo com tabelas, views e conexões;
- catálogo pesquisável de colunas, chaves e índices;
- perfil com nome, e-mail e foto exibidos na navegação;
- preferências de tema, densidade e descrições da sidebar;
- breadcrumbs com contexto da página e do banco ativo;
- confirmações SweetAlert2 para saída e desconexão;
- layout responsivo e páginas de termos e privacidade.

## Tecnologias

- JavaScript com módulos ES;
- Vite;
- Bootstrap e Bootstrap Icons;
- Chart.js;
- Cytoscape.js;
- Socket.IO Client;
- SweetAlert2;
- Jest com JSDOM;
- Playwright para testes de navegador.

## Requisitos

- Node.js `^20.19.0` ou `>=22.12.0`;
- npm;
- Cerberus Backend disponível para os fluxos autenticados.

Python 3.10 ou superior também é necessário quando frontend e backend forem iniciados juntos pelo script `npm run dev`.

## Instalação

```bash
npm install
```

## Configuração da API

Em desenvolvimento, a interface detecta endereços locais e usa a porta `5000` para acessar o backend. Para apontar para uma API publicada, crie um arquivo `.env.local`:

```env
VITE_API_URL=https://sua-api.example.com
```

A origem do frontend também deve estar autorizada em `FRONTEND_ORIGINS` no backend.

## Execução

Para iniciar somente a interface:

```bash
npm run dev:frontend
```

Para iniciar frontend e backend juntos, mantenha os repositórios como diretórios irmãos com os nomes `Cerberus-Frontend` e `Cerberus-Backend`:

```bash
npm run dev
```

Por padrão, a interface fica em `http://localhost:5173` e a API em `http://localhost:5000`.

## Scripts

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Inicia frontend e backend em paralelo. |
| `npm run dev:frontend` | Inicia somente o Vite. |
| `npm run dev:backend` | Inicia a API no repositório irmão. |
| `npm run build` | Gera o pacote de produção em `dist/`. |
| `npm run preview` | Abre localmente o build produzido. |
| `npm run test:unit` | Executa os testes unitários com Jest. |
| `npm run test:e2e` | Executa os testes de navegador com Playwright. |
| `npm test` | Executa testes unitários e E2E. |

## Telas principais

| Rota | Conteúdo |
| --- | --- |
| `/login` e `/cadastro` | Acesso e criação de conta. |
| `/conectar` | Configuração e teste da conexão externa. |
| `/dashboard` | Métricas e informações operacionais. |
| `/estrutura` | Mapa relacional e catálogo do esquema. |
| `/seguranca` | Sessões, papéis, permissões e integridade. |
| `/backups` | Operações disponíveis para backups. |
| `/configuracoes` | Perfil, foto, senha e preferências da interface. |

## Estrutura do projeto

```text
public/
  views/          fragmentos HTML carregados pelo roteador
  favicon.*       identidade da aplicação no navegador
src/
  config/         resolução do endereço da API
  controllers/    comportamento e integração de cada tela
  css/            variáveis, layout e componentes visuais
  utils/          confirmações e funções compartilhadas
  main.js         inicialização da aplicação
tests/
  e2e/            cenários Playwright
  unit/           testes Jest
```

O roteador carrega as telas sob demanda. O Cytoscape.js também é importado somente na visualização de estrutura, reduzindo o custo inicial das outras páginas.

## Testes

Instale o navegador usado pelo Playwright uma vez:

```bash
npx playwright install chromium
```

Execute toda a validação:

```bash
npm test
npm run build
```

A suíte cobre login, estados de autenticação, identidade da conta, foto de perfil, preferências, responsividade, páginas legais, menus de tabela, dashboard, mapa estrutural e confirmações de saída e desconexão.

## Build e publicação

```bash
npm run build
```

O conteúdo de `dist/` pode ser publicado como site estático. O arquivo `vercel.json` redireciona as rotas da SPA para `index.html`. Antes da publicação, configure `VITE_API_URL` e autorize a origem final no CORS do backend.

Favicons, ícones instaláveis e metadados sociais usam a identidade visual disponível em `public/logo-nova-cerberus.png`.

## Licença

Distribuído sob a licença MIT. Consulte o arquivo `LICENSE`.
