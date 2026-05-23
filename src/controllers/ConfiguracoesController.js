import Swal from 'sweetalert2';
import { icones } from '../js/utils.js';
import { BASE_URL } from '../config/api.js';

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
      const response = await fetch(`${BASE_URL}/api/verify`, {
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

  setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "; expires=" + date.toUTCString();
    document.cookie = name + "=" + (value || "")  + expires + "; path=/; SameSite=Lax";
  }

  getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i=0;i < ca.length;i++) {
      let c = ca[i];
      while (c.charAt(0)==' ') c = c.substring(1,c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
  }

  // Associa os eventos aos botões principais de "Salvar" e "Sair do Sistema"
  bindEvents() {
    // Configura e lê a preferência do Modo Escuro a partir dos Cookies
    const switchEscuro = document.getElementById('modo-escuro');
    if (switchEscuro) {
      switchEscuro.checked = this.getCookie('modo-escuro') === 'true';
      switchEscuro.addEventListener('change', (e) => {
        const isDark = e.target.checked;
        this.setCookie('modo-escuro', isDark ? 'true' : 'false', 365);
        document.documentElement.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
      });
    }

    const btnSalvar = document.getElementById('btn-salvar-config');
    if (btnSalvar) {
      btnSalvar.addEventListener('click', async () => {
        const isPerfilActive = !document.getElementById('tab-perfil').classList.contains('d-none');
        const isSenhaActive = !document.getElementById('tab-senha').classList.contains('d-none');

        if (isPerfilActive) {
          const novoNome = document.getElementById('input-nome-exibicao')?.value;
          if (!novoNome) return;

          const conteudoOriginal = btnSalvar.innerHTML;
          btnSalvar.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';
          btnSalvar.disabled = true;

          try {
            const response = await fetch(`${BASE_URL}/api/user/update`, {
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
        } else if (isSenhaActive) {
          const senhaAtual = document.getElementById('senha-atual')?.value;
          const novaSenha = document.getElementById('nova-senha')?.value;
          const confirmarNovaSenha = document.getElementById('confirmar-nova-senha')?.value;

          if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
            Swal.fire({
              title: 'Erro!',
              text: 'Preencha todos os campos de senha.',
              icon: 'warning',
              confirmButtonColor: '#dc3545'
            });
            return;
          }

          if (novaSenha !== confirmarNovaSenha) {
            Swal.fire({
              title: 'Erro!',
              text: 'A nova senha e a confirmação não coincidem.',
              icon: 'warning',
              confirmButtonColor: '#dc3545'
            });
            return;
          }

          // Validação de senha forte (mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número)
          const regexSenha = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;
          if (!regexSenha.test(novaSenha)) {
            Swal.fire({
              title: 'Erro!',
              text: 'A nova senha deve ter no mínimo 8 caracteres, incluindo pelo menos uma letra maiúscula, uma minúscula e um número.',
              icon: 'warning',
              confirmButtonColor: '#dc3545'
            });
            return;
          }

          const conteudoOriginal = btnSalvar.innerHTML;
          btnSalvar.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';
          btnSalvar.disabled = true;

          try {
            const response = await fetch(`${BASE_URL}/api/user/update-password`, {
              method: 'PUT',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ senha_atual: senhaAtual, nova_senha: novaSenha })
            });

            const data = await response.json();

            if (response.ok) {
              Swal.fire({
                title: 'Sucesso!',
                text: 'Senha alterada com sucesso!',
                icon: 'success',
                confirmButtonColor: '#dc3545'
              }).then(() => {
                document.getElementById('senha-atual').value = '';
                document.getElementById('nova-senha').value = '';
                document.getElementById('confirmar-nova-senha').value = '';
              });
            } else {
              Swal.fire('Erro!', data.message || 'Erro ao alterar a senha.', 'error');
            }
          } catch (e) {
            Swal.fire('Erro de conexão!', 'Não foi possível salvar', 'error');
          } finally {
            btnSalvar.innerHTML = conteudoOriginal;
            btnSalvar.disabled = false;
          }
        } else {
          Swal.fire({
            title: 'Sucesso!',
            text: 'Configurações salvas com sucesso!',
            icon: 'success',
            confirmButtonColor: '#dc3545',
            timer: 1500,
            showConfirmButton: false
          });
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
        }).then(async (result) => {
          if (result.isConfirmed) {
            // Chama a API de logout no backend para apagar os Cookies JWT de forma segura
            try {
              await fetch(`${BASE_URL}/api/logout`, {
                method: 'POST',
                credentials: 'include'
              });
            } catch (e) {
              console.error('Erro ao deslogar no backend', e);
            }
            
            // Limpa o armazenamento local do navegador
            sessionStorage.removeItem('authenticated');
            sessionStorage.removeItem('db_connected');
            window.location.href = '/login';
          }
        });
      });
    }
  }
}