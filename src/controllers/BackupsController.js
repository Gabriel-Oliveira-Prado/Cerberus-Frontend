import Swal from 'sweetalert2';
import { io } from 'socket.io-client';
import { BASE_URL } from '../config/api.js';

export default class BackupsController {
  async init() {
    this.backups = [];
    this.bindEvents();
    this.connectSocket();
    this.renderIntegrityStatus();
    await this.loadBackups();
  }

  bindEvents() {
    document.getElementById('btn-verificar')?.addEventListener('click', this.runVerification);
    document.getElementById('menu-exportar-csv')?.addEventListener('click', this.exportCsv);
    document.getElementById('menu-novo-backup')?.addEventListener('click', this.triggerBackup);
    document.getElementById('menu-limpar-log')?.addEventListener('click', this.clearActivity);
    document.getElementById('menu-copiar-log')?.addEventListener('click', this.copyActivity);
    document.getElementById('menu-exportar-log')?.addEventListener('click', this.exportActivity);
  }

  async loadBackups() {
    const tbody = document.getElementById('backups-table-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" class="loading-state"><span class="loading-indicator" aria-hidden="true"></span>Buscando backups</td></tr>';

    try {
      const response = await fetch(`${BASE_URL}/api/backups`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'A lista de backups não pôde ser consultada.');
      }

      this.backups = Array.isArray(data.backups) ? data.backups : [];
      this.renderBackups();
    } catch (error) {
      console.error('Falha ao buscar backups:', error);
      tbody.innerHTML = '<tr><td colspan="5" class="error-state">Não foi possível carregar os backups.</td></tr>';
    }
  }

  renderBackups() {
    const tbody = document.getElementById('backups-table-body');
    if (!tbody) return;
    tbody.replaceChildren();

    if (!this.backups.length) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.colSpan = 5;
      cell.className = 'empty-state';
      cell.textContent = 'Nenhum backup foi criado para esta instalação.';
      row.appendChild(cell);
      tbody.appendChild(row);
      return;
    }

    this.backups.forEach((backup) => {
      const row = document.createElement('tr');
      row.append(
        this.createCell(backup.date, 'Data e hora'),
        this.createCell(backup.filename, 'Arquivo', 'fw-semibold'),
        this.createCell(backup.size, 'Tamanho'),
        this.createCell(backup.retention, 'Retenção')
      );

      const actions = document.createElement('td');
      actions.dataset.label = 'Ações';
      actions.className = 'text-end';

      actions.appendChild(this.createActionMenu([
        {
          label: 'Baixar arquivo',
          onClick: () => this.downloadBackup(backup.filename)
        },
        {
          label: 'Excluir backup',
          danger: true,
          onClick: () => this.deleteBackup(backup.filename)
        }
      ], `Abrir ações do backup ${backup.filename}`));
      row.appendChild(actions);
      tbody.appendChild(row);
    });
  }

  createCell(value, label, className = '') {
    const cell = document.createElement('td');
    cell.dataset.label = label;
    cell.className = className;
    cell.textContent = value ?? '';
    return cell;
  }

  createActionMenu(items, accessibleLabel) {
    const wrapper = document.createElement('div');
    wrapper.className = 'dropup d-inline-block table-action-menu';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'action-menu-button';
    trigger.dataset.bsToggle = 'dropdown';
    trigger.dataset.bsBoundary = 'viewport';
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-label', accessibleLabel);
    const icon = document.createElement('i');
    icon.className = 'bi bi-three-dots-vertical';
    icon.setAttribute('aria-hidden', 'true');
    trigger.appendChild(icon);

    const menu = document.createElement('ul');
    menu.className = 'dropdown-menu dropdown-menu-end';
    items.forEach((item) => {
      const listItem = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `dropdown-item${item.danger ? ' text-danger' : ''}`;
      button.textContent = item.label;
      button.addEventListener('click', item.onClick);
      listItem.appendChild(button);
      menu.appendChild(listItem);
    });

    wrapper.append(trigger, menu);
    return wrapper;
  }

  async downloadBackup(filename) {
    try {
      const response = await fetch(
        `${BASE_URL}/api/backups/download?filename=${encodeURIComponent(filename)}`,
        { credentials: 'include' }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'O arquivo não pôde ser baixado.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      await Swal.fire({
        title: 'Download não concluído',
        text: error instanceof TypeError ? 'O servidor está indisponível.' : error.message,
        icon: 'error',
        confirmButtonColor: '#dc3545'
      });
    }
  }

  async deleteBackup(filename) {
    const result = await Swal.fire({
      title: 'Excluir este backup?',
      text: `O arquivo ${filename} será removido permanentemente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Excluir',
      cancelButtonText: 'Cancelar'
    });
    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`${BASE_URL}/api/backups/excluir`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'O backup não foi excluído.');
      }

      this.addActivity('Sucesso', `Backup ${filename} excluído.`);
      await this.loadBackups();
    } catch (error) {
      await Swal.fire({
        title: 'Backup não excluído',
        text: error instanceof TypeError ? 'O servidor está indisponível.' : error.message,
        icon: 'error',
        confirmButtonColor: '#dc3545'
      });
    }
  }

  renderIntegrityStatus() {
    const tbody = document.getElementById('integrity-tbody');
    if (!tbody) return;
    tbody.replaceChildren();

    const row = document.createElement('tr');
    row.appendChild(this.createCell(sessionStorage.getItem('db_name') || 'Banco conectado', 'Alvo', 'fw-semibold'));

    const statusCell = document.createElement('td');
    statusCell.dataset.label = 'Status';
    const status = document.createElement('span');
    status.id = 'integrity-badge';
    status.className = 'integrity-result';
    status.textContent = 'Não verificado';
    statusCell.appendChild(status);

    const lastCheck = this.createCell('Ainda não executada', 'Última checagem');
    lastCheck.id = 'integrity-last-check';

    const signature = this.createCell('Não calculada', 'Assinatura do esquema');
    signature.id = 'integrity-checksum';

    const action = document.createElement('td');
    action.dataset.label = 'Ação';
    action.className = 'text-end';
    action.appendChild(this.createActionMenu([
      { label: 'Ver detalhes', onClick: this.inspectIntegrity },
      { label: 'Executar novamente', onClick: this.runVerification }
    ], 'Abrir ações da verificação de integridade'));

    row.append(statusCell, lastCheck, signature, action);
    tbody.appendChild(row);
  }

  runVerification = async () => {
    const button = document.getElementById('btn-verificar');
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = 'Verificando';

    try {
      const response = await fetch(`${BASE_URL}/api/verificar`, {
        credentials: 'include'
      });
      const data = await response.json();

      this.lastIntegrityResult = {
        ok: response.ok && data.success,
        status: response.ok && data.success ? 'Íntegro' : 'Falha',
        checksum: data.checksum,
        tables_count: data.tables_count,
        db_size: data.db_size,
        message: data.message
      };
      this.updateIntegrityRow(this.lastIntegrityResult);
      this.addActivity(
        this.lastIntegrityResult.ok ? 'Sucesso' : 'Erro',
        data.message || 'A verificação terminou sem mensagem.'
      );

      await Swal.fire({
        title: this.lastIntegrityResult.ok ? 'Verificação concluída' : 'Verificação com falha',
        text: data.message || 'O servidor não informou detalhes.',
        icon: this.lastIntegrityResult.ok ? 'success' : 'warning',
        confirmButtonColor: '#dc3545'
      });
    } catch (error) {
      await Swal.fire({
        title: 'Verificação não concluída',
        text: 'O servidor está indisponível.',
        icon: 'error',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  };

  updateIntegrityRow(result) {
    const badge = document.getElementById('integrity-badge');
    const lastCheck = document.getElementById('integrity-last-check');
    const checksum = document.getElementById('integrity-checksum');

    if (badge) {
      badge.textContent = result.status;
      badge.className = `integrity-result ${result.ok ? 'is-success' : 'is-danger'}`;
    }
    if (lastCheck) lastCheck.textContent = new Date().toLocaleString('pt-BR');
    if (checksum) checksum.textContent = result.checksum || 'Não calculada';
  }

  inspectIntegrity = async () => {
    const result = this.lastIntegrityResult;
    const text = result
      ? [
          `Status: ${result.status}`,
          `Assinatura do esquema: ${result.checksum || 'não calculada'}`,
          `Tabelas: ${result.tables_count ?? 'não informado'}`,
          `Tamanho: ${result.db_size || 'não informado'}`
        ].join('\n')
      : 'Execute a verificação para consultar os detalhes.';

    await Swal.fire({
      title: 'Detalhes da integridade',
      text,
      icon: 'info',
      confirmButtonColor: '#dc3545'
    });
  };

  exportCsv = async () => {
    if (!this.backups.length) {
      await Swal.fire({
        title: 'Lista vazia',
        text: 'Não há backups para exportar.',
        icon: 'info',
        confirmButtonColor: '#dc3545'
      });
      return;
    }

    const rows = ['Data e hora;Arquivo;Tamanho;Retenção'];
    this.backups.forEach((backup) => {
      rows.push([
        backup.date,
        backup.filename,
        backup.size,
        backup.retention
      ].map(this.csvValue).join(';'));
    });
    this.downloadText(rows.join('\n'), `cerberus-backups-${Date.now()}.csv`, 'text/csv;charset=utf-8');
  };

  csvValue(value) {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
  }

  triggerBackup = async () => {
    if (!this.socket?.connected) {
      await Swal.fire({
        title: 'Canal de backup indisponível',
        text: 'Aguarde alguns instantes e tente novamente.',
        icon: 'warning',
        confirmButtonColor: '#dc3545'
      });
      return;
    }

    const confirmation = await Swal.fire({
      title: 'Criar backup agora?',
      text: 'O Cerberus lerá a estrutura e os dados do banco conectado para gerar um arquivo local.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Criar backup',
      cancelButtonText: 'Cancelar'
    });
    if (!confirmation.isConfirmed) return;

    Swal.fire({
      title: 'Criando backup',
      html: '<p id="backup-progress-text">Preparando operação</p><progress id="backup-progress" value="0" max="100" class="w-100"></progress>',
      allowOutsideClick: false,
      showConfirmButton: false
    });
    this.socket.emit('trigger_backup', {});
  };

  connectSocket() {
    this.socket = io(BASE_URL, {
      withCredentials: true,
      transports: ['polling']
    });

    this.socket.on('backup_progress', (data) => {
      const progress = Number(data.progress) || 0;
      const progressElement = document.getElementById('backup-progress');
      const textElement = document.getElementById('backup-progress-text');
      if (progressElement) progressElement.value = progress;
      if (textElement) textElement.textContent = data.status || `${progress}%`;

      if (data.status) this.addActivity(progress === 0 && /erro/i.test(data.status) ? 'Erro' : 'Info', data.status);
      if (progress === 0 && /erro/i.test(data.status || '')) {
        Swal.fire({
          title: 'Backup não concluído',
          text: data.status,
          icon: 'error',
          confirmButtonColor: '#dc3545'
        });
      }
    });

    this.socket.on('backup_completed', async (data) => {
      this.addActivity('Sucesso', `Backup ${data.filename} criado com ${data.size}.`);
      await Swal.fire({
        title: 'Backup concluído',
        text: `O arquivo ${data.filename} está disponível para download.`,
        icon: 'success',
        confirmButtonColor: '#dc3545'
      });
      await this.loadBackups();
    });

    this.socket.on('connect_error', () => {
      this.addActivity('Erro', 'Não foi possível conectar ao canal de backups.');
    });
  }

  addActivity(level, message) {
    const container = document.getElementById('backups-log-container');
    if (!container) return;

    if (container.querySelector('.empty-state')) container.replaceChildren();

    const item = document.createElement('div');
    item.className = 'activity-item';

    const tag = document.createElement('span');
    tag.className = 'activity-level';
    tag.dataset.level = level.toLowerCase();
    tag.textContent = level;

    const text = document.createElement('span');
    text.className = 'activity-message';
    text.textContent = message;

    const time = document.createElement('time');
    time.className = 'activity-time';
    time.textContent = new Date().toLocaleTimeString('pt-BR');

    item.append(tag, text, time);
    container.prepend(item);
  }

  clearActivity = () => {
    const container = document.getElementById('backups-log-container');
    if (container) container.innerHTML = '<div class="empty-state">Nenhuma atividade registrada nesta sessão.</div>';
  };

  copyActivity = async () => {
    const container = document.getElementById('backups-log-container');
    const text = container?.innerText.trim();
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      await Swal.fire({
        title: 'Atividade copiada',
        icon: 'success',
        timer: 1200,
        showConfirmButton: false
      });
    } catch (error) {
      await Swal.fire({
        title: 'Não foi possível copiar',
        text: 'O navegador bloqueou o acesso à área de transferência.',
        icon: 'error',
        confirmButtonColor: '#dc3545'
      });
    }
  };

  exportActivity = () => {
    const content = document.getElementById('backups-log-container')?.innerText.trim();
    if (!content) return;
    this.downloadText(content, `cerberus-atividade-backups-${Date.now()}.txt`, 'text/plain;charset=utf-8');
  };

  downloadText(content, filename, type) {
    const blob = new Blob(['\ufeff', content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  destroy() {
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
  }
}
