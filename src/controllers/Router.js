import DashboardController from './DashboardController.js';
import BackupsController from './BackupsController.js';
import ServidoresController from './ServidoresController.js';
import ConfiguracoesController from './ConfiguracoesController.js';
import LoginController from './LoginController.js';
import ConectarController from './ConectarController.js';
import CadastroController from './CadastroController.js';
import EstruturaController from './EstruturaController.js';
import { BASE_URL } from '../config/api.js';
export class Router {
  constructor() {
    // Referências aos elementos principais da interface
    this.appContent = document.getElementById('app-content');
    this.tituloPagina = document.getElementById('titulo-pagina');
    this.navItems = document.querySelectorAll('.cerberus-nav-item');
    this.configButton = document.querySelector('.cerberus-conta-botao');

    // Intercepta cliques em links com atributo data-route para navegação SPA
    document.querySelectorAll('[data-route]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const path = new URL(link.href).pathname;
        this.navigate(path);

        const barraLateral = document.querySelector('.cerberus-barra-lateral');
        if (window.innerWidth <= 768 && barraLateral) {
          barraLateral.classList.remove('colapsada');
          document.body.classList.remove('sidebar-mobile-open');
        }
      });
    });

    // Lida com a navegação pelo histórico do navegador (botões voltar/avançar)
    window.addEventListener('popstate', () => {
      this.route(window.location.pathname);
    });
  }

  // Inicializa o roteador definindo a rota inicial
  async init() {
    await this.checkAuthStatus();

    const path = window.location.pathname === '/' || window.location.pathname === '/index.html'
      ? '/dashboard'
      : window.location.pathname;

    if (window.location.pathname !== path) {
      window.history.replaceState({}, '', path);
    }

    this.route(path);
  }

  // Verifica o status de autenticação via backend
  async checkAuthStatus() {
    try {
      const response = await fetch(`${BASE_URL}/api/verify`, {
        method: 'GET',
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        sessionStorage.setItem('authenticated', 'true');
        if (data.db_connected) {
          sessionStorage.setItem('db_connected', 'true');
          sessionStorage.setItem('db_name', data.db_name || '');
        } else {
          sessionStorage.removeItem('db_connected');
          sessionStorage.removeItem('db_name');
        }
        
        // Atualiza a interface da barra lateral (nome, email e avatar)
        const nomeEl = document.getElementById('cerberus-usuario-nome');
        const emailEl = document.getElementById('cerberus-usuario-email');
        const avatarEl = document.getElementById('cerberus-usuario-avatar');
        
        if (nomeEl && emailEl && avatarEl && data.nome && data.email) {
          // Adiciona o valor completo como title para mostrar ao passar o mouse
          nomeEl.title = data.nome;
          emailEl.title = data.email;

          // Limite de caracteres em JS para garantir
          const maxLength = 20;
          const nomeCurto = data.nome.length > maxLength ? data.nome.substring(0, maxLength) + '...' : data.nome;
          const emailCurto = data.email.length > maxLength ? data.email.substring(0, maxLength) + '...' : data.email;

          nomeEl.textContent = nomeCurto;
          emailEl.textContent = emailCurto;
          
          // Gera iniciais do nome (ex: "Gabriel Augusto" -> "GA")
          const palavras = data.nome.trim().split(' ').filter(p => p.length > 0);
          let iniciais = palavras[0][0];
          if (palavras.length > 1) {
            iniciais += palavras[palavras.length - 1][0];
          }
          avatarEl.textContent = iniciais.toUpperCase();
        }
      } else {
        sessionStorage.removeItem('authenticated');
        sessionStorage.removeItem('db_connected');
        sessionStorage.removeItem('db_name');
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      sessionStorage.removeItem('authenticated');
      sessionStorage.removeItem('db_connected');
      sessionStorage.removeItem('db_name');
    }
  }

  // Adiciona a rota ao histórico e invoca o controlador de rotas
  navigate(path) {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    this.route(path);
  }

  // Atualiza a interface da barra de navegação para refletir a aba ativa
  updateActiveNav(path) {
    this.navItems.forEach(item => item.classList.remove('ativo'));
    if (this.configButton) this.configButton.style.backgroundColor = 'rgba(255,255,255,0.1)';

    const match = Array.from(this.navItems).find(item => item.getAttribute('href') === path);
    if (match) {
      match.classList.add('ativo');
    } else if (path === '/configuracoes' && this.configButton) {
      this.configButton.style.backgroundColor = '#dc3545';
    }
  }

  // Busca e retorna o conteúdo HTML de uma view específica
  async fetchView(viewName) {
    try {
      const response = await fetch(`/views/${viewName}.html`);
      if (!response.ok) throw new Error('View não encontrada');
      return await response.text();
    } catch (e) {
      return '<h2>Erro ao carregar a página</h2>';
    }
  }

  // Lida com o roteamento, gerenciamento de estados (auth/db) e renderização das views
  async route(path) {
    const isAuthenticated = sessionStorage.getItem('authenticated') === 'true';
    const isConnected = sessionStorage.getItem('db_connected') === 'true';

    // Controle de acesso para rotas protegidas e configuração do banco
    if (!isAuthenticated && path !== '/login' && path !== '/cadastro') {
      window.history.replaceState({}, '', '/login');
      path = '/login';
    } else if (isAuthenticated && !isConnected && path !== '/login' && path !== '/cadastro' && path !== '/conectar' && path !== '/configuracoes') {
      window.history.replaceState({}, '', '/conectar');
      path = '/conectar';
    }

    const protegidas = document.querySelectorAll('.nav-protegida');
    const navConectar = document.getElementById('nav-conectar');

    if (isConnected) {
      protegidas.forEach(el => el.classList.remove('d-none'));
      if (navConectar) navConectar.classList.add('d-none');
    } else {
      protegidas.forEach(el => el.classList.add('d-none'));
      if (navConectar) navConectar.classList.remove('d-none');
    }

    // Controla a exibição do badge de Sistema Online (apenas quando conectado e fora de conectar/configurações/auth)
    const badge = document.getElementById('badge-sistema-online');
    if (badge) {
      if (isConnected && path !== '/conectar' && path !== '/configuracoes' && path !== '/login' && path !== '/cadastro') {
        badge.classList.remove('d-none');
      } else {
        badge.classList.add('d-none');
      }
    }


    this.updateActiveNav(path);

    // Configura layout específico para páginas de login/cadastro ou exibe skeleton de carregamento
    if (path === '/login' || path === '/cadastro') {
      document.body.classList.add('is-login-route');
    } else {
      document.body.classList.remove('is-login-route');
      this.appContent.innerHTML = '<div class="esqueleto-carregando" style="height: 500px; width: 100%; border-radius: 8px;"></div>';
    }

    let html = '';
    let controller = null;

    switch (path) {
      case '/login':
        document.title = 'Cerberus - Login';
        html = await this.fetchView('login');
        this.appContent.innerHTML = html;
        controller = new LoginController();
        break;
      case '/cadastro':
        document.title = 'Cerberus - Cadastro';
        html = await this.fetchView('cadastro');
        this.appContent.innerHTML = html;
        controller = new CadastroController();
        break;
      case '/dashboard':
      case '/':
        document.title = 'Cerberus - Dashboard';
        if (this.tituloPagina) this.tituloPagina.textContent = 'Métricas do Banco';
        html = await this.fetchView('dashboard');
        this.appContent.innerHTML = html;
        controller = new DashboardController();
        break;
      case '/backups':
        document.title = 'Cerberus - Backups';
        if (this.tituloPagina) this.tituloPagina.textContent = 'Backups';
        html = await this.fetchView('backups');
        this.appContent.innerHTML = html;
        controller = new BackupsController();
        break;
      case '/servidores':
        document.title = 'Cerberus - Monitoramento';
        if (this.tituloPagina) this.tituloPagina.textContent = 'Infraestrutura do Banco';
        html = await this.fetchView('servidores');
        this.appContent.innerHTML = html;
        controller = new ServidoresController();
        break;
      case '/conectar':
        document.title = 'Cerberus - Conectar Banco';
        if (this.tituloPagina) this.tituloPagina.textContent = 'Conectar Banco';
        html = await this.fetchView('conectar');
        this.appContent.innerHTML = html;
        controller = new ConectarController();
        break;
      case '/configuracoes':
        document.title = 'Cerberus - Configurações';
        if (this.tituloPagina) this.tituloPagina.textContent = 'Configurações';
        html = await this.fetchView('configuracoes');
        this.appContent.innerHTML = html;
        controller = new ConfiguracoesController();
        break;
      case '/estrutura':
        document.title = 'Cerberus - Estrutura do Banco';
        if (this.tituloPagina) this.tituloPagina.textContent = 'Estrutura Física';
        html = await this.fetchView('estrutura');
        this.appContent.innerHTML = html;
        controller = new EstruturaController();
        break;
      default:
        if (this.tituloPagina) this.tituloPagina.textContent = 'Não Encontrado';
        this.appContent.innerHTML = '<h2>Página não encontrada</h2>';
    }

    if (this.currentController && typeof this.currentController.destroy === 'function') {
      try {
        this.currentController.destroy();
      } catch (err) {
        console.error('Error destroying controller:', err);
      }
    }

    this.currentController = controller;

    if (controller) {
      await controller.init();
    }
  }
}
