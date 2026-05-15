import DashboardController from './DashboardController.js';
import BackupsController from './BackupsController.js';
import ServidoresController from './ServidoresController.js';
import ConfiguracoesController from './ConfiguracoesController.js';
import LoginController from './LoginController.js';
import ConectarController from './ConectarController.js';
export class Router {
  constructor() {
    this.appContent = document.getElementById('app-content');
    this.tituloPagina = document.getElementById('titulo-pagina');
    this.navItems = document.querySelectorAll('.cerberus-nav-item');
    this.configButton = document.querySelector('.cerberus-conta-botao');
    
    document.querySelectorAll('[data-route]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const path = new URL(link.href).pathname;
        this.navigate(path);
        
        const barraLateral = document.querySelector('.cerberus-barra-lateral');
        if (window.innerWidth <= 768 && barraLateral) {
          barraLateral.classList.remove('colapsada');
        }
      });
    });

    window.addEventListener('popstate', () => {
      this.route(window.location.pathname);
    });
  }

  init() {
    const path = window.location.pathname === '/' || window.location.pathname === '/index.html' 
      ? '/dashboard' 
      : window.location.pathname;
      
    if (window.location.pathname !== path) {
      window.history.replaceState({}, '', path);
    }
    
    this.route(path);
  }

  navigate(path) {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    this.route(path);
  }

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

  async fetchView(viewName) {
    try {
      const response = await fetch(`/views/${viewName}.html`);
      if (!response.ok) throw new Error('View não encontrada');
      return await response.text();
    } catch (e) {
      return '<h2>Erro ao carregar a página</h2>';
    }
  }

  async route(path) {
    const isAuthenticated = sessionStorage.getItem('authenticated') === 'true';
    const isConnected = sessionStorage.getItem('db_connected') === 'true';
    
    if (!isAuthenticated && path !== '/login') {
      window.history.replaceState({}, '', '/login');
      path = '/login';
    } else if (isAuthenticated && !isConnected && path !== '/login' && path !== '/conectar') {
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

    this.updateActiveNav(path);
    
    if (path === '/login') {
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
      case '/dashboard':
      case '/':
        document.title = 'Cerberus - Dashboard';
        if(this.tituloPagina) this.tituloPagina.textContent = 'Métricas do Banco';
        html = await this.fetchView('dashboard');
        this.appContent.innerHTML = html;
        controller = new DashboardController();
        break;
      case '/backups':
        document.title = 'Cerberus - Backups';
        if(this.tituloPagina) this.tituloPagina.textContent = 'Backups';
        html = await this.fetchView('backups');
        this.appContent.innerHTML = html;
        controller = new BackupsController();
        break;
      case '/servidores':
        document.title = 'Cerberus - Monitoramento';
        if(this.tituloPagina) this.tituloPagina.textContent = 'Infraestrutura do Banco';
        html = await this.fetchView('servidores');
        this.appContent.innerHTML = html;
        controller = new ServidoresController();
        break;
      case '/conectar':
        document.title = 'Cerberus - Conectar Banco';
        if(this.tituloPagina) this.tituloPagina.textContent = 'Conectar Banco';
        html = await this.fetchView('conectar');
        this.appContent.innerHTML = html;
        controller = new ConectarController();
        break;
      case '/configuracoes':
        document.title = 'Cerberus - Configurações';
        if(this.tituloPagina) this.tituloPagina.textContent = 'Configurações';
        html = await this.fetchView('configuracoes');
        this.appContent.innerHTML = html;
        controller = new ConfiguracoesController();
        break;
      default:
        if(this.tituloPagina) this.tituloPagina.textContent = 'Não Encontrado';
        this.appContent.innerHTML = '<h2>Página não encontrada</h2>';
    }

    if (controller) {
      await controller.init();
    }
  }
}
