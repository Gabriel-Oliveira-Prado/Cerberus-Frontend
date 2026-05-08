import Swal from 'sweetalert2';
import { icones } from '../js/utils.js';

export default class ConfiguracoesController {
  async init() {
    this.injectIcons();
    this.bindEvents();
    this.bindTabs();
  }

  injectIcons() {
    document.querySelectorAll('.icone-engrenagem').forEach(el => el.innerHTML = icones.engrenagem);
    document.querySelectorAll('.icone-perfil').forEach(el => el.innerHTML = icones.perfil);
    document.querySelectorAll('.icone-sino').forEach(el => el.innerHTML = icones.sino);
    document.querySelectorAll('.icone-sair').forEach(el => el.innerHTML = icones.sair);
  }

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

    const btnSair = document.getElementById('btn-sair-sistema');
    if (btnSair) {
      btnSair.addEventListener('click', () => {
        Swal.fire({
          title: 'Sair do Sistema?',
          text: 'Você precisará fazer login novamente.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#dc3545',
          cancelButtonColor: '#6c757d',
          confirmButtonText: 'Sim, sair!',
          cancelButtonText: 'Cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            window.location.href = '/login.html';
          }
        });
      });
    }
  }
}
