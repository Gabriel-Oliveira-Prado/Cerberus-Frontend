import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './css/main.css';
import { Router } from './controllers/Router.js';
import { icones } from './js/utils.js';

document.addEventListener('DOMContentLoaded', () => {
  const setIcon = (id, svg) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = svg;
  };

  setIcon('icone-nav-dashboard', icones.dashboard);
  setIcon('icone-nav-backups', icones.backups);
  setIcon('icone-nav-servidores', icones.servidores);
  setIcon('icone-nav-config', icones.engrenagem);
  setIcon('icone-menu-toggle', icones.menu);

  const btnAlternar = document.getElementById('btn-alternar-barra');
  const barraLateral = document.querySelector('.cerberus-barra-lateral');
  const conteudoPrincipal = document.querySelector('.painel-conteudo-principal');

  if (btnAlternar && barraLateral && conteudoPrincipal) {
    const toggleMobileScroll = () => {
      if (window.innerWidth <= 768) {
        if (barraLateral.classList.contains('colapsada')) {
          document.body.classList.add('sidebar-mobile-open');
        } else {
          document.body.classList.remove('sidebar-mobile-open');
        }
      }
    };

    btnAlternar.addEventListener('click', () => {
      barraLateral.classList.toggle('colapsada');
      conteudoPrincipal.classList.toggle('expandido');
      toggleMobileScroll();
    });

    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && barraLateral.classList.contains('colapsada')) {
        if (!barraLateral.contains(e.target) && !btnAlternar.contains(e.target)) {
          barraLateral.classList.remove('colapsada');
          toggleMobileScroll();
        }
      }
    });
  }

  const router = new Router();
  router.init();
});
