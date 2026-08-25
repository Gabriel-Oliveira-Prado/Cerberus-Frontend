import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.min.css';
import './css/main.css';
import { Router } from './controllers/Router.js';

document.addEventListener('DOMContentLoaded', () => {
  const getCookie = (name) => {
    const prefix = `${name}=`;
    const cookie = document.cookie
      .split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith(prefix));
    return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
  };
  document.body.classList.toggle('density-compact', getCookie('modo-compacto') === 'true');
  document.body.classList.toggle('sidebar-descriptions-hidden', getCookie('mostrar-descricoes-sidebar') === 'false');

  const button = document.getElementById('btn-alternar-barra');
  const sidebar = document.getElementById('barra-lateral');

  const closeSidebar = () => {
    if (!sidebar || !button) return;
    sidebar.classList.remove('aberta');
    document.body.classList.remove('sidebar-mobile-open');
    button.setAttribute('aria-expanded', 'false');
  };

  button?.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = sidebar.classList.toggle('aberta');
    document.body.classList.toggle('sidebar-mobile-open', isOpen);
    button.setAttribute('aria-expanded', String(isOpen));
  });

  document.addEventListener('click', (event) => {
    if (
      window.innerWidth <= 900 &&
      sidebar?.classList.contains('aberta') &&
      !sidebar.contains(event.target)
    ) {
      closeSidebar();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) closeSidebar();
  });

  const router = new Router();
  router.init();
});
