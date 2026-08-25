import DashboardController from './DashboardController.js';
import BackupsController from './BackupsController.js';
import SegurancaController from './SegurancaController.js';
import ConfiguracoesController from './ConfiguracoesController.js';
import LoginController from './LoginController.js';
import ConectarController from './ConectarController.js';
import CadastroController from './CadastroController.js';
import EstruturaController from './EstruturaController.js';
import { BASE_URL } from '../config/api.js';
import { confirmLogout } from '../utils/confirmations.js';

const PUBLIC_ROUTES = new Set(['/termos', '/privacidade']);
const AUTH_ROUTES = new Set(['/login', '/cadastro']);

export class Router {
  constructor() {
    this.appContent = document.getElementById('app-content');
    this.tituloPagina = document.getElementById('titulo-pagina');
    this.navItems = document.querySelectorAll('.cerberus-nav-item');
    this.configButton = document.querySelector('.cerberus-conta-botao');
    this.breadcrumbDatabase = document.getElementById('breadcrumb-database');
    this.breadcrumbCurrent = document.getElementById('breadcrumb-current');
    this.sidebarLogoutButton = document.getElementById('btn-sidebar-logout');
    this.sidebarLogoutButton?.addEventListener('click', this.logout);
    document.addEventListener('cerberus:profile-updated', this.handleProfileUpdated);

    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[data-route]');
      if (!link || link.target === '_blank') return;

      const url = new URL(link.href, window.location.origin);
      if (url.origin !== window.location.origin) return;

      event.preventDefault();
      this.navigate(url.pathname);

      const sidebar = document.getElementById('barra-lateral');
      sidebar?.classList.remove('aberta');
      document.body.classList.remove('sidebar-mobile-open');
      document.getElementById('btn-alternar-barra')?.setAttribute('aria-expanded', 'false');
    });

    window.addEventListener('popstate', () => {
      this.route(window.location.pathname);
    });
  }

  async init() {
    const requestedPath = window.location.pathname === '/' || window.location.pathname === '/index.html'
      ? '/dashboard'
      : window.location.pathname;

    if (!PUBLIC_ROUTES.has(requestedPath) && !AUTH_ROUTES.has(requestedPath)) {
      await this.checkAuthStatus();
    }

    if (window.location.pathname !== requestedPath) {
      window.history.replaceState({}, '', requestedPath);
    }

    await this.route(requestedPath);
  }

  handleProfileUpdated = (event) => {
    this.cacheAndRenderProfile(event.detail || {});
  };

  cacheAndRenderProfile(profile) {
    if (profile.nome) sessionStorage.setItem('user_nome', profile.nome);
    if (profile.email) sessionStorage.setItem('user_email', profile.email);
    if (profile.avatar_url) sessionStorage.setItem('user_avatar_url', profile.avatar_url);
    else sessionStorage.removeItem('user_avatar_url');
    if (profile.avatar_version) sessionStorage.setItem('user_avatar_version', profile.avatar_version);
    else sessionStorage.removeItem('user_avatar_version');
    this.renderProfile(profile.nome, profile.email, profile.avatar_url, profile.avatar_version);
  }

  renderProfile(nome, email, avatarUrl = null, avatarVersion = null) {
    if (!nome || !email) return;

    const nomeEl = document.getElementById('cerberus-usuario-nome');
    const emailEl = document.getElementById('cerberus-usuario-email');
    const avatarImage = document.getElementById('cerberus-usuario-foto');
    const avatarInitials = document.getElementById('cerberus-usuario-iniciais');
    if (!nomeEl || !emailEl || !avatarImage || !avatarInitials) return;

    nomeEl.title = nome;
    emailEl.title = email;
    nomeEl.textContent = nome;
    emailEl.textContent = email;

    const words = nome.trim().split(/\s+/).filter(Boolean);
    const initials = words.length > 1
      ? `${words[0][0]}${words.at(-1)[0]}`
      : words[0]?.slice(0, 2) || '--';
    avatarInitials.textContent = initials.toUpperCase();

    avatarImage.onload = () => {
      avatarImage.hidden = false;
      avatarInitials.hidden = true;
    };
    avatarImage.onerror = () => {
      avatarImage.hidden = true;
      avatarInitials.hidden = false;
      avatarImage.removeAttribute('src');
    };

    if (avatarUrl) {
      const version = avatarVersion ? `?v=${encodeURIComponent(avatarVersion)}` : '';
      avatarImage.src = `${BASE_URL}${avatarUrl}${version}`;
    } else {
      avatarImage.hidden = true;
      avatarInitials.hidden = false;
      avatarImage.removeAttribute('src');
    }
  }

  clearSessionState() {
    [
      'authenticated',
      'db_connected',
      'db_name',
      'user_nome',
      'user_email',
      'user_avatar_url',
      'user_avatar_version'
    ].forEach((key) => sessionStorage.removeItem(key));
  }

  async checkAuthStatus() {
    const cachedName = sessionStorage.getItem('user_nome');
    const cachedEmail = sessionStorage.getItem('user_email');
    if (cachedName && cachedEmail) {
      this.renderProfile(
        cachedName,
        cachedEmail,
        sessionStorage.getItem('user_avatar_url'),
        sessionStorage.getItem('user_avatar_version')
      );
    }

    try {
      const response = await fetch(`${BASE_URL}/api/verify`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        this.clearSessionState();
        return;
      }

      const data = await response.json();
      sessionStorage.setItem('authenticated', 'true');

      if (data.db_connected) {
        sessionStorage.setItem('db_connected', 'true');
        sessionStorage.setItem('db_name', data.db_name || '');
      } else {
        sessionStorage.removeItem('db_connected');
        sessionStorage.removeItem('db_name');
      }

      if (data.nome && data.email) this.cacheAndRenderProfile(data);
    } catch (error) {
      console.error('Não foi possível verificar a sessão:', error);
      this.clearSessionState();
    }
  }

  navigate(path) {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    return this.route(path);
  }

  updateActiveNav(path) {
    this.navItems.forEach((item) => {
      const isActive = item.getAttribute('href') === path;
      item.classList.toggle('ativo', isActive);
      if (isActive) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });

    const isConfig = path === '/configuracoes';
    this.configButton?.classList.toggle('ativo', isConfig);
    if (isConfig) this.configButton?.setAttribute('aria-current', 'page');
    else this.configButton?.removeAttribute('aria-current');
  }

  async fetchView(viewName) {
    const response = await fetch(`/views/${viewName}.html`);
    if (!response.ok) throw new Error(`A tela ${viewName} não foi encontrada.`);
    return response.text();
  }

  updateLayout(path) {
    document.body.classList.toggle('is-auth-route', AUTH_ROUTES.has(path));
    document.body.classList.toggle('is-public-route', PUBLIC_ROUTES.has(path));
  }

  updateNavigationVisibility(isConnected) {
    document.querySelectorAll('.nav-protegida').forEach((element) => {
      element.classList.toggle('d-none', !isConnected);
    });
    document.getElementById('nav-conectar')?.classList.toggle('d-none', isConnected);
  }

  updateBreadcrumb(path, label) {
    if (this.breadcrumbCurrent) this.breadcrumbCurrent.textContent = label || 'Painel';
    if (!this.breadcrumbDatabase) return;

    const databaseName = sessionStorage.getItem('db_name');
    const showDatabase = Boolean(databaseName) && path !== '/conectar';
    this.breadcrumbDatabase.hidden = !showDatabase;
    this.breadcrumbDatabase.textContent = showDatabase ? databaseName : '';
  }

  async route(requestedPath) {
    const loader = document.getElementById('global-loader');
    loader?.classList.remove('hidden');

    if (this.currentController?.destroy) {
      try {
        this.currentController.destroy();
      } catch (error) {
        console.error('Falha ao encerrar a tela anterior:', error);
      }
    }
    this.currentController = null;

    const isAuthenticated = sessionStorage.getItem('authenticated') === 'true';
    const isConnected = sessionStorage.getItem('db_connected') === 'true';
    let path = requestedPath;

    if (!PUBLIC_ROUTES.has(path)) {
      if (!isAuthenticated && !AUTH_ROUTES.has(path)) {
        path = '/login';
      } else if (
        isAuthenticated &&
        !isConnected &&
        !AUTH_ROUTES.has(path) &&
        path !== '/conectar' &&
        path !== '/configuracoes'
      ) {
        path = '/conectar';
      }
    }

    if (path !== requestedPath) {
      window.history.replaceState({}, '', path);
    }

    this.updateLayout(path);
    this.updateNavigationVisibility(isConnected);
    this.updateActiveNav(path);
    this.appContent.replaceChildren();

    const routes = {
      '/login': ['Cerberus | Login', null, 'login', LoginController],
      '/cadastro': ['Cerberus | Cadastro', null, 'cadastro', CadastroController],
      '/dashboard': ['Cerberus | Visão geral', 'Visão geral', 'dashboard', DashboardController],
      '/backups': ['Cerberus | Backups', 'Backups', 'backups', BackupsController],
      '/seguranca': ['Cerberus | Segurança', 'Segurança', 'seguranca', SegurancaController],
      '/conectar': ['Cerberus | Conectar banco', 'Conectar banco', 'conectar', ConectarController],
      '/configuracoes': ['Cerberus | Configurações', 'Configurações', 'configuracoes', ConfiguracoesController],
      '/estrutura': ['Cerberus | Estrutura', 'Estrutura', 'estrutura', EstruturaController],
      '/termos': ['Cerberus | Termos de uso', null, 'termos', null],
      '/privacidade': ['Cerberus | Privacidade', null, 'privacidade', null]
    };

    const routeConfig = routes[path];
    if (!routeConfig) {
      document.title = 'Cerberus | Página não encontrada';
      if (this.tituloPagina) this.tituloPagina.textContent = 'Página não encontrada';
      this.updateBreadcrumb(path, 'Página não encontrada');
      this.appContent.innerHTML = '<div class="error-state">A página solicitada não existe.</div>';
      loader?.classList.add('hidden');
      return;
    }

    const [title, heading, viewName, Controller] = routeConfig;
    document.title = title;
    if (heading && this.tituloPagina) this.tituloPagina.textContent = heading;
    if (heading) this.updateBreadcrumb(path, heading);

    try {
      this.appContent.innerHTML = await this.fetchView(viewName);
      if (Controller) {
        this.currentController = new Controller();
        await this.currentController.init();
      }
      window.scrollTo({ top: 0, behavior: 'auto' });
    } catch (error) {
      console.error('Falha ao abrir a tela:', error);
      this.appContent.innerHTML = '<div class="error-state">Não foi possível abrir esta tela. Tente novamente.</div>';
    } finally {
      loader?.classList.add('hidden');
    }
  }

  logout = async () => {
    if (!await confirmLogout()) return;

    try {
      await fetch(`${BASE_URL}/api/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('O backend não confirmou o logout:', error);
    }
    this.clearSessionState();
    this.navigate('/login');
  };
}
