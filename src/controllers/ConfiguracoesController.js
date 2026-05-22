import Swal from 'sweetalert2';
import { icones } from '../js/utils.js';

export default class ConfiguracoesController {
  // Inicializa as configurações, ícones e navegação em abas
  async init() {
    this.injectIcons();
    this.bindEvents();
    this.bindTabs();
  }

  // Substitui os placeholders pelos ícones SVG
  injectIcons() {
    document.querySelectorAll('.icone-engrenagem').forEach(el => el.innerHTML = icones.engrenagem);
    document.querySelectorAll('.icone-perfil').forEach(el => el.innerHTML = icones.perfil);
    document.querySelectorAll('.icone-sino').forEach(el => el.innerHTML = icones.sino);
    document.querySelectorAll('.icone-sair').forEach(el => el.innerHTML = icones.sair);
  }

  // Configura o comportamento das abas na página de configurações
  bindTabs() {
    const btns = document.querySelectorAll('.btn-tab-config');
    const panes = document.querySelectorAll('.tab-pane-config');

    btns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        btns.forEach(b => {
          b.classList.remove('active', 'bg-danger');
          b.classList.add('text-muted');
          const icon = b.querySelector('span:first-child');
          if (icon) icon.classList.remove('text-white');
        });

        const targetBtn = e.currentTarget;
        targetBtn.classList.add('active', 'bg-danger');
        targetBtn.classList.remove('text-muted');
        const icon = targetBtn.querySelector('span:first-child');
        if (icon) icon.classList.add('text-white');

        const targetId = targetBtn.getAttribute('data-target');
        panes.forEach(p => p.classList.add('d-none'));
        document.querySelector(targetId).classList.remove('d-none');
      });
    });
  }

  // Associa os eventos aos botões principais de "Salvar" e "Sair do Sistema"
  bindEvents() {
    const btnSalvar = document.getElementById('btn-salvar-config');
    if (btnSalvar) {
      btnSalvar.addEventListener('click', () => {
        Swal.fire({
          title: 'Sucesso!',
          text: 'As configurações foram salvas.',
          icon: 'success',
          confirmButtonColor: '#dc3545',
          timer: 2000,
          showConfirmButton: false
        });
      });
    }

    const btnDesconectar = document.getElementById('btn-desconectar-banco');
    if (btnDesconectar) {
      btnDesconectar.addEventListener('click', () => {
        Swal.fire({
          title: 'Desconectar do Banco?',
          text: 'Você precisará informar as credenciais do banco novamente.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#ffc107',
          cancelButtonColor: '#6c757d',
          confirmButtonText: 'Sim, desconectar!',
          cancelButtonText: 'Cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            sessionStorage.removeItem('db_connected');
            window.location.href = '/conectar';
          }
        });
      });
    }

    const btnSairConta = document.getElementById('btn-sair-conta');
    if (btnSairConta) {
      btnSairConta.addEventListener('click', () => {
        Swal.fire({
          title: 'Sair da Conta?',
          text: 'Você será desconectado da plataforma Cerberus.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#dc3545',
          cancelButtonColor: '#6c757d',
          confirmButtonText: 'Sim, sair!',
          cancelButtonText: 'Cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            sessionStorage.removeItem('authenticated');
            sessionStorage.removeItem('db_connected');
            window.location.href = '/login';
          }
        });
      });
    }
  }
}
