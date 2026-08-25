import Swal from 'sweetalert2';
import { BASE_URL } from '../config/api.js';
import { confirmDatabaseDisconnect, confirmLogout } from '../utils/confirmations.js';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const AVATAR_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

export default class ConfiguracoesController {
  async init() {
    this.profileForm = document.getElementById('tab-perfil');
    this.passwordForm = document.getElementById('tab-senha');
    this.themeSwitch = document.getElementById('modo-escuro');
    this.compactSwitch = document.getElementById('modo-compacto');
    this.sidebarDescriptionsSwitch = document.getElementById('mostrar-descricoes-sidebar');
    this.avatarInput = document.getElementById('input-foto-perfil');
    this.removeAvatarButton = document.getElementById('btn-remover-foto');
    this.disconnectButton = document.getElementById('btn-desconectar-banco');
    this.logoutButton = document.getElementById('btn-sair-conta');

    this.bindTabs();
    this.bindEvents();
    this.initializeInterfacePreferences();
    await this.loadProfile();
  }

  async loadProfile() {
    const cachedProfile = {
      nome: sessionStorage.getItem('user_nome') || '',
      email: sessionStorage.getItem('user_email') || '',
      avatar_url: sessionStorage.getItem('user_avatar_url'),
      avatar_version: sessionStorage.getItem('user_avatar_version')
    };
    this.fillProfile(cachedProfile);

    try {
      const response = await fetch(`${BASE_URL}/api/verify`, { credentials: 'include' });
      if (!response.ok) throw new Error('Não foi possível consultar a conta.');
      const profile = await response.json();
      this.fillProfile(profile);
      this.notifyProfileUpdated(profile);
    } catch (error) {
      console.error('Não foi possível atualizar os dados do perfil:', error);
    }
  }

  fillProfile(profile) {
    const nameInput = document.getElementById('input-nome-exibicao');
    const emailInput = document.getElementById('input-email-conta');
    if (nameInput && profile.nome) nameInput.value = profile.nome;
    if (emailInput && profile.email) emailInput.value = profile.email;
    if (this.disconnectButton && typeof profile.db_connected === 'boolean') {
      this.disconnectButton.disabled = !profile.db_connected;
    }
    this.renderAvatar(profile);
  }

  renderAvatar(profile, localUrl = null) {
    const image = document.getElementById('profile-photo-image');
    const initials = document.getElementById('profile-photo-initials');
    if (!image || !initials) return;

    const name = profile.nome || document.getElementById('input-nome-exibicao')?.value || '';
    const words = name.trim().split(/\s+/).filter(Boolean);
    initials.textContent = (words.length > 1
      ? `${words[0][0]}${words.at(-1)[0]}`
      : words[0]?.slice(0, 2) || '--').toUpperCase();

    image.onload = () => {
      image.hidden = false;
      initials.hidden = true;
    };
    image.onerror = () => {
      image.hidden = true;
      initials.hidden = false;
      image.removeAttribute('src');
    };

    if (localUrl) {
      image.src = localUrl;
    } else if (profile.avatar_url) {
      const version = profile.avatar_version
        ? `?v=${encodeURIComponent(profile.avatar_version)}`
        : '';
      image.src = `${BASE_URL}${profile.avatar_url}${version}`;
    } else {
      image.hidden = true;
      initials.hidden = false;
      image.removeAttribute('src');
    }

    if (this.removeAvatarButton) {
      this.removeAvatarButton.disabled = !profile.avatar_url && !localUrl;
    }
  }

  notifyProfileUpdated(profile) {
    document.dispatchEvent(new CustomEvent('cerberus:profile-updated', {
      detail: profile
    }));
  }

  bindTabs() {
    this.tabButtons = [...document.querySelectorAll('.btn-tab-config')];
    this.tabPanes = [...document.querySelectorAll('.tab-pane-config')];
    this.tabButtons.forEach((button) => button.addEventListener('click', this.handleTabClick));
  }

  handleTabClick = (event) => {
    const selected = event.currentTarget;
    const targetId = selected.dataset.target;
    this.tabButtons.forEach((button) => {
      const isActive = button === selected;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-selected', String(isActive));
    });
    this.tabPanes.forEach((pane) => {
      pane.classList.toggle('d-none', `#${pane.id}` !== targetId);
    });
  };

  setCookie(name, value, days) {
    const expiry = new Date(Date.now() + days * 86400000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expiry}; path=/; SameSite=Lax`;
  }

  getCookie(name) {
    const prefix = `${name}=`;
    const cookie = document.cookie
      .split(';')
      .map((item) => item.trim())
      .find((item) => item.startsWith(prefix));
    return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
  }

  bindEvents() {
    if (this.themeSwitch) {
      this.themeSwitch.checked = this.getCookie('modo-escuro') === 'true';
      this.themeSwitch.addEventListener('change', this.handleThemeChange);
    }
    this.compactSwitch?.addEventListener('change', this.handleCompactModeChange);
    this.sidebarDescriptionsSwitch?.addEventListener('change', this.handleSidebarDescriptionsChange);
    this.profileForm?.addEventListener('submit', this.saveProfile);
    this.passwordForm?.addEventListener('submit', this.savePassword);
    this.avatarInput?.addEventListener('change', this.handleAvatarSelection);
    this.removeAvatarButton?.addEventListener('click', this.removeAvatar);
    this.disconnectButton?.addEventListener('click', this.disconnectDatabase);
    this.logoutButton?.addEventListener('click', this.logout);
  }

  handleThemeChange = (event) => {
    const useDarkTheme = event.target.checked;
    this.setCookie('modo-escuro', String(useDarkTheme), 365);
    document.documentElement.setAttribute('data-bs-theme', useDarkTheme ? 'dark' : 'light');
  };

  initializeInterfacePreferences() {
    const compactMode = this.getCookie('modo-compacto') === 'true';
    const showDescriptions = this.getCookie('mostrar-descricoes-sidebar') !== 'false';
    if (this.compactSwitch) this.compactSwitch.checked = compactMode;
    if (this.sidebarDescriptionsSwitch) this.sidebarDescriptionsSwitch.checked = showDescriptions;
    document.body.classList.toggle('density-compact', compactMode);
    document.body.classList.toggle('sidebar-descriptions-hidden', !showDescriptions);
  }

  handleCompactModeChange = (event) => {
    const isCompact = event.target.checked;
    this.setCookie('modo-compacto', String(isCompact), 365);
    document.body.classList.toggle('density-compact', isCompact);
  };

  handleSidebarDescriptionsChange = (event) => {
    const showDescriptions = event.target.checked;
    this.setCookie('mostrar-descricoes-sidebar', String(showDescriptions), 365);
    document.body.classList.toggle('sidebar-descriptions-hidden', !showDescriptions);
  };

  handleAvatarSelection = async () => {
    const file = this.avatarInput?.files?.[0];
    if (!file) return;

    if (!AVATAR_TYPES.has(file.type) || file.size > MAX_AVATAR_BYTES) {
      this.avatarInput.value = '';
      await Swal.fire({
        title: 'Imagem não aceita',
        text: 'Use PNG, JPEG ou WebP com no máximo 2 MB.',
        icon: 'warning',
        confirmButtonColor: '#dc3545'
      });
      return;
    }

    if (this.avatarPreviewUrl) URL.revokeObjectURL(this.avatarPreviewUrl);
    this.avatarPreviewUrl = URL.createObjectURL(file);
    this.pendingAvatar = file;
    this.renderAvatar({ nome: document.getElementById('input-nome-exibicao')?.value }, this.avatarPreviewUrl);
  };

  uploadAvatar = async () => {
    if (!this.pendingAvatar) return {};
    const formData = new FormData();
    formData.append('avatar', this.pendingAvatar);
    const response = await fetch(`${BASE_URL}/api/user/avatar`, {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'A foto não foi atualizada.');
    this.pendingAvatar = null;
    this.avatarInput.value = '';
    return data;
  };

  saveProfile = async (event) => {
    event.preventDefault();
    if (!this.profileForm.reportValidity()) return;

    const name = document.getElementById('input-nome-exibicao').value.trim();
    const email = document.getElementById('input-email-conta').value;
    const button = document.getElementById('btn-salvar-perfil');
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Salvando';

    try {
      const response = await fetch(`${BASE_URL}/api/user/update`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: name })
      });
      const profile = await response.json();
      if (!response.ok) throw new Error(profile.message || 'O perfil não foi atualizado.');

      const avatarResult = await this.uploadAvatar();
      const updatedProfile = { ...profile, ...avatarResult, nome: profile.nome || name, email };
      this.fillProfile(updatedProfile);
      this.notifyProfileUpdated(updatedProfile);

      await Swal.fire({
        title: 'Perfil atualizado',
        text: 'Nome e foto já estão disponíveis na navegação.',
        icon: 'success',
        confirmButtonColor: '#dc3545',
        timer: 1600,
        showConfirmButton: false
      });
    } catch (error) {
      await Swal.fire({
        title: 'Perfil não atualizado',
        text: error instanceof TypeError ? 'O servidor está indisponível.' : error.message,
        icon: 'error',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  };

  removeAvatar = async () => {
    const confirmation = await Swal.fire({
      title: 'Remover a foto?',
      text: 'As iniciais do nome voltarão a ser exibidas.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Remover',
      cancelButtonText: 'Cancelar'
    });
    if (!confirmation.isConfirmed) return;

    try {
      const response = await fetch(`${BASE_URL}/api/user/avatar`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Não foi possível concluir a operação.');

      this.pendingAvatar = null;
      this.avatarInput.value = '';
      if (this.avatarPreviewUrl) URL.revokeObjectURL(this.avatarPreviewUrl);
      this.avatarPreviewUrl = null;
      const profile = {
        nome: document.getElementById('input-nome-exibicao').value,
        email: document.getElementById('input-email-conta').value,
        ...data
      };
      this.renderAvatar(profile);
      this.notifyProfileUpdated(profile);
    } catch (error) {
      await Swal.fire({
        title: 'Foto não removida',
        text: error instanceof TypeError ? 'O servidor está indisponível.' : error.message,
        icon: 'error',
        confirmButtonColor: '#dc3545'
      });
    }
  };

  savePassword = async (event) => {
    event.preventDefault();
    if (!this.passwordForm.reportValidity()) return;

    const currentPassword = document.getElementById('senha-atual').value;
    const newPassword = document.getElementById('nova-senha').value;
    const confirmation = document.getElementById('confirmar-nova-senha').value;

    if (newPassword !== confirmation) {
      await Swal.fire({
        title: 'Senhas diferentes',
        text: 'A confirmação precisa ser igual à nova senha.',
        icon: 'warning',
        confirmButtonColor: '#dc3545'
      });
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword)) {
      await Swal.fire({
        title: 'Senha fora do padrão',
        text: 'Use ao menos 8 caracteres, com letra maiúscula, minúscula e número.',
        icon: 'warning',
        confirmButtonColor: '#dc3545'
      });
      return;
    }

    const button = document.getElementById('btn-salvar-senha');
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Alterando';
    try {
      const response = await fetch(`${BASE_URL}/api/user/update-password`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha_atual: currentPassword, nova_senha: newPassword })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'A senha não foi alterada.');
      this.passwordForm.reset();
      await Swal.fire({
        title: 'Senha alterada',
        text: 'A nova senha já pode ser usada no próximo acesso.',
        icon: 'success',
        confirmButtonColor: '#dc3545'
      });
    } catch (error) {
      await Swal.fire({
        title: 'Senha não alterada',
        text: error instanceof TypeError ? 'O servidor está indisponível.' : error.message,
        icon: 'error',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  };

  disconnectDatabase = async () => {
    if (!await confirmDatabaseDisconnect()) return;

    this.disconnectButton.disabled = true;
    try {
      const response = await fetch(`${BASE_URL}/api/database/disconnect`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'O banco não foi desconectado.');
      sessionStorage.removeItem('db_connected');
      sessionStorage.removeItem('db_name');
      window.history.pushState({}, '', '/conectar');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (error) {
      await Swal.fire({
        title: 'Banco não desconectado',
        text: error instanceof TypeError ? 'O servidor está indisponível.' : error.message,
        icon: 'error',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      this.disconnectButton.disabled = false;
    }
  };

  logout = async () => {
    if (!await confirmLogout()) return;

    try {
      await fetch(`${BASE_URL}/api/logout`, { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.error('O backend não confirmou o logout:', error);
    }
    sessionStorage.clear();
    window.history.pushState({}, '', '/login');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  destroy() {
    this.tabButtons?.forEach((button) => button.removeEventListener('click', this.handleTabClick));
    this.themeSwitch?.removeEventListener('change', this.handleThemeChange);
    this.compactSwitch?.removeEventListener('change', this.handleCompactModeChange);
    this.sidebarDescriptionsSwitch?.removeEventListener('change', this.handleSidebarDescriptionsChange);
    this.profileForm?.removeEventListener('submit', this.saveProfile);
    this.passwordForm?.removeEventListener('submit', this.savePassword);
    this.avatarInput?.removeEventListener('change', this.handleAvatarSelection);
    this.removeAvatarButton?.removeEventListener('click', this.removeAvatar);
    this.disconnectButton?.removeEventListener('click', this.disconnectDatabase);
    this.logoutButton?.removeEventListener('click', this.logout);
    if (this.avatarPreviewUrl) URL.revokeObjectURL(this.avatarPreviewUrl);
  }
}
