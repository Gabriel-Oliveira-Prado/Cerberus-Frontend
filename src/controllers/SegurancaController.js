import Swal from 'sweetalert2';
import { io } from 'socket.io-client';
import { BASE_URL } from '../config/api.js';

export default class SegurancaController {
  async init() {
    this.sessions = [];
    this.roles = [];
    this.bindEvents();
    this.connectSocket();
  }

  bindEvents() {
    document.getElementById('btn-refresh-sessions')?.addEventListener('click', this.reconnect);
    document.getElementById('btn-kill-idle')?.addEventListener('click', this.killIdleConnections);
    document.getElementById('btn-export-sessions')?.addEventListener('click', this.exportSessions);
    document.getElementById('btn-export-roles')?.addEventListener('click', this.exportRoles);
  }

  connectSocket() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }

    this.socket = io(BASE_URL, {
      withCredentials: true,
      transports: ['polling']
    });

    this.socket.on('connect', () => {
      const button = document.getElementById('btn-refresh-sessions');
      if (button) {
        button.disabled = false;
        button.textContent = 'Atualizar sessões';
      }
    });

    this.socket.on('connect_error', () => {
      this.renderSocketError();
    });

    this.socket.on('security_update', (data) => {
      this.sessions = Array.isArray(data.sessions) ? data.sessions : [];
      this.roles = Array.isArray(data.roles) ? data.roles : [];
      this.updateSummary(data);
      this.renderSessions(this.sessions);
      this.renderRoles(this.roles);
    });
  }

  updateSummary(data) {
    this.setText('sec-roles-text', data.roles_count ?? this.roles.length);
    this.setText('sec-sessions-text', data.real_active ?? 0);
    this.setText('sec-idle-text', data.real_idle ?? 0);

    const sessionDescription = document.getElementById('sec-sessions-desc');
    if (sessionDescription) {
      sessionDescription.textContent = `Limite: ${data.max_connections ?? 'não informado'}`;
    }

    const idleInTransaction = Number(data.real_idle_in_tx) || 0;
    const idleDescription = document.getElementById('sec-idle-desc');
    if (idleDescription) {
      idleDescription.textContent = idleInTransaction > 0
        ? `${idleInTransaction} em transação`
        : 'Conexões sem atividade';
    }
  }

  setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = String(value);
  }

  renderSessions(sessions) {
    const tbody = document.getElementById('sec-sessions-body');
    if (!tbody) return;
    tbody.replaceChildren();

    if (!sessions.length) {
      this.appendEmptyRow(tbody, 7, 'Nenhuma sessão foi informada pelo banco.');
      return;
    }

    sessions.forEach((session) => {
      const row = document.createElement('tr');
      row.append(
        this.createCell(session.pid, 'PID'),
        this.createCell(session.usename || session.user, 'Usuário', 'fw-semibold'),
        this.createCell(session.client_addr || 'Local', 'IP de origem'),
        this.createCell(session.application_name || 'Não informada', 'Aplicação'),
        this.createCell(this.translateState(session.state), 'Status'),
        this.createCell(session.backend_start || 'Não informado', 'Início'),
        this.createCell(session.query || 'Nenhuma consulta em execução', 'Consulta atual')
      );
      tbody.appendChild(row);
    });
  }

  renderRoles(roles) {
    const tbody = document.getElementById('sec-roles-body');
    if (!tbody) return;
    tbody.replaceChildren();

    if (!roles.length) {
      this.appendEmptyRow(tbody, 6, 'Nenhum usuário foi informado pelo banco.');
      return;
    }

    roles.forEach((role) => {
      const row = document.createElement('tr');
      row.append(
        this.createCell(role.rolname, 'Usuário', 'fw-semibold'),
        this.createCell(this.permissionText(role.rolsuper), 'Superusuário', 'text-center'),
        this.createCell(this.permissionText(role.rolcreatedb), 'Criar banco', 'text-center'),
        this.createCell(this.permissionText(role.rolcreaterole), 'Criar função', 'text-center'),
        this.createCell(this.permissionText(role.rolcanlogin), 'Login', 'text-center'),
        this.createCell(role.rolconnlimit === -1 ? 'Sem limite' : role.rolconnlimit, 'Limite de conexões', 'text-center')
      );
      tbody.appendChild(row);
    });
  }

  permissionText(allowed) {
    return allowed ? 'Permitido' : 'Não permitido';
  }

  translateState(state) {
    const normalized = String(state || '').toLowerCase();
    const labels = {
      active: 'Ativa',
      idle: 'Ociosa',
      'idle in transaction': 'Ociosa em transação',
      sleep: 'Ociosa'
    };
    return labels[normalized] || state || 'Não informado';
  }

  createCell(value, label, className = '') {
    const cell = document.createElement('td');
    cell.dataset.label = label;
    cell.className = className;
    cell.textContent = value ?? '';
    return cell;
  }

  appendEmptyRow(tbody, colspan, message) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = colspan;
    cell.className = 'empty-state';
    cell.textContent = message;
    row.appendChild(cell);
    tbody.appendChild(row);
  }

  renderSocketError() {
    const sessionsBody = document.getElementById('sec-sessions-body');
    const rolesBody = document.getElementById('sec-roles-body');
    if (sessionsBody) {
      sessionsBody.replaceChildren();
      this.appendEmptyRow(sessionsBody, 7, 'Não foi possível atualizar as sessões agora.');
    }
    if (rolesBody) {
      rolesBody.replaceChildren();
      this.appendEmptyRow(rolesBody, 6, 'A auditoria será atualizada na próxima tentativa.');
    }
  }

  reconnect = () => {
    const button = document.getElementById('btn-refresh-sessions');
    if (button) {
      button.disabled = true;
      button.textContent = 'Reconectando';
    }
    this.connectSocket();
  };

  killIdleConnections = async () => {
    const result = await Swal.fire({
      title: 'Encerrar sessões ociosas?',
      text: 'O banco encerrará conexões ociosas do usuário atual. Transações ociosas também podem ser finalizadas.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Encerrar sessões',
      cancelButtonText: 'Cancelar'
    });
    if (!result.isConfirmed) return;

    const button = document.getElementById('btn-kill-idle');
    button.disabled = true;

    try {
      const response = await fetch(`${BASE_URL}/api/security/kill-idle`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'As sessões não foram encerradas.');
      }

      await Swal.fire({
        title: 'Operação concluída',
        text: data.message,
        icon: 'success',
        confirmButtonColor: '#dc3545'
      });
    } catch (error) {
      await Swal.fire({
        title: 'Operação não concluída',
        text: error instanceof TypeError ? 'O servidor está indisponível.' : error.message,
        icon: 'error',
        confirmButtonColor: '#dc3545'
      });
    } finally {
      button.disabled = false;
    }
  };

  exportSessions = async () => {
    if (!this.sessions.length) {
      await this.showEmptyExportMessage('sessões');
      return;
    }

    const rows = ['PID;Usuário;IP de origem;Aplicação;Status;Início;Consulta'];
    this.sessions.forEach((session) => {
      rows.push([
        session.pid,
        session.usename || session.user,
        session.client_addr || 'Local',
        session.application_name || '',
        session.state || '',
        session.backend_start || '',
        session.query || ''
      ].map(this.csvValue).join(';'));
    });

    this.downloadCsv(rows, `cerberus-sessoes-${Date.now()}.csv`);
  };

  exportRoles = async () => {
    if (!this.roles.length) {
      await this.showEmptyExportMessage('usuários');
      return;
    }

    const rows = ['Usuário;Superusuário;Criar banco;Criar função;Login;Limite de conexões'];
    this.roles.forEach((role) => {
      rows.push([
        role.rolname,
        this.permissionText(role.rolsuper),
        this.permissionText(role.rolcreatedb),
        this.permissionText(role.rolcreaterole),
        this.permissionText(role.rolcanlogin),
        role.rolconnlimit === -1 ? 'Sem limite' : role.rolconnlimit
      ].map(this.csvValue).join(';'));
    });

    this.downloadCsv(rows, `cerberus-permissoes-${Date.now()}.csv`);
  };

  showEmptyExportMessage(subject) {
    return Swal.fire({
      title: 'Sem dados para exportar',
      text: `O banco ainda não informou ${subject}.`,
      icon: 'info',
      confirmButtonColor: '#dc3545'
    });
  }

  csvValue(value) {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
  }

  downloadCsv(rows, filename) {
    const blob = new Blob(['\ufeff', rows.join('\n')], {
      type: 'text/csv;charset=utf-8'
    });
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
