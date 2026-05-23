import Swal from 'sweetalert2';
import { icones } from '../js/utils.js';

export default class ConfiguracoesController {
  // Inicializa as configurações, ícones e navegação em abas
  async init() {
    this.injectIcons();
    this.bindEvents();
    this.bindTabs();
    await this.carregarDadosPerfil();
  }

  // Busca o nome real do usuário para preencher o input
  async carregarDadosPerfil() {
    try {
      const baseUrl = `http://${window.location.hostname}:5000`;
      const response = await fetch(`${baseUrl}/api/verify`, {
        method: 'GET',
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        const inputNome = document.getElementById('input-nome-exibicao');
        if (inputNome && data.nome) {
          inputNome.value = data.nome;
        }
      }
    } catch (e) {
      console.error("Erro ao carregar dados do perfil", e);
    }
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
      btnSalvar.addEventListener('click', async () => {
        const novoNome = document.getElementById('input-nome-exibicao')?.value;
        
        // Verifica se o painel Perfil está visível para só salvar ele por enquanto (ou salva sempre)
        if (!novoNome) return;

        const conteudoOriginal = btnSalvar.innerHTML;
        btnSalvar.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';
        btnSalvar.disabled = true;

        try {
          const baseUrl = `http://${window.location.hostname}:5000`;
          const response = await fetch(`${baseUrl}/api/user/update`, {
            method: 'PUT',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome: novoNome })
          });

          const data = await response.json();

          if (response.ok) {
            Swal.fire({
              title: 'Sucesso!',
              text: 'Perfil atualizado com sucesso. Recarregando dados...',
              icon: 'success',
              confirmButtonColor: '#dc3545',
              timer: 2000,
              showConfirmButton: false
            }).then(() => {
              // Recarrega a página inteira ou apenas dispara checkAuthStatus
              window.location.reload();
            });
          } else {
            Swal.fire('Erro!', data.message || 'Erro ao atualizar perfil', 'error');
          }
        } catch (e) {
          Swal.fire('Erro de conexão!', 'Não foi possível salvar', 'error');
        } finally {
          btnSalvar.innerHTML = conteudoOriginal;
          btnSalvar.disabled = false;
        }
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
