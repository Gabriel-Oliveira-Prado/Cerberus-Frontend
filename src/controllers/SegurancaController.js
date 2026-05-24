import Swal from 'sweetalert2';
import { io } from 'socket.io-client';
import { BASE_URL } from '../config/api.js';
import { icones } from '../js/utils.js';

export default class SegurancaController {
  async init() {
    this.injectIcons();
    this.connectSocket();
    this.bindEvents();
  }

  injectIcons() {
    document.querySelectorAll('.icone-pontos').forEach(el => el.innerHTML = icones.pontos);
    document.querySelectorAll('.icone-database').forEach(el => el.innerHTML = icones.database);
    document.querySelectorAll('.icone-perfil').forEach(el => el.innerHTML = icones.perfil);
    document.querySelectorAll('.icone-ativos').forEach(el => el.innerHTML = icones.ativos);
    document.querySelectorAll('.icone-sino').forEach(el => el.innerHTML = icones.sino);
    document.querySelectorAll('.icone-escudo').forEach(el => el.innerHTML = icones.escudo);
  }

  bindEvents() {
    const btnRefresh = document.getElementById('btn-refresh-sessions');
    if (btnRefresh) {
      btnRefresh.addEventListener('click', () => {
        if (this.socket) console.log('Solicitando atualização de segurança...');
      });
    }

    document.getElementById('btn-kill-idle')?.addEventListener('click', async () => {
      Swal.fire({
        title: 'Matar Conexões Ociosas?',
        text: 'Tem certeza que deseja matar TODAS as conexões ociosas? Esta ação derrubará processos dormindo e não pode ser desfeita!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, matar!'
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            const res = await fetch(`${BASE_URL}/api/security/kill-idle`, { method: 'POST', credentials: 'include' });
            const data = await res.json();
            if(data.success) Swal.fire('Sucesso!', data.message, 'success');
            else Swal.fire('Erro', data.message, 'error');
          } catch(e) { Swal.fire('Erro', 'Erro de conexão.', 'error'); }
        }
      });
    });

    document.getElementById('btn-scroll-roles')?.addEventListener('click', () => {
      document.getElementById('sec-roles-body')?.scrollIntoView({ behavior: 'smooth' });
    });
    
    document.getElementById('btn-scroll-sessions')?.addEventListener('click', () => {
      document.getElementById('sec-sessions-body')?.scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('btn-export-sessions')?.addEventListener('click', () => {
      if(!this.lastSessions || this.lastSessions.length === 0) {
        Swal.fire('Aviso', 'Não há sessões ativas para exportar.', 'info');
        return;
      }
      let csv = 'PID,Usuário,IP Origem,Aplicação,Status,Início,Query\\n';
      this.lastSessions.forEach(s => {
        const q = (s.query || '').replace(/"/g, '""');
        csv += `"${s.pid}","${s.usename || ''}","${s.client_addr || ''}","${s.application_name || ''}","${s.state || ''}","${s.backend_start || ''}","${q}"\\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sessoes_ativas_${new Date().getTime()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    });

    document.getElementById('btn-save-role')?.addEventListener('click', async () => {
      const rolename = document.getElementById('new-role-name').value;
      const password = document.getElementById('new-role-pass').value;
      const isSuper = document.getElementById('new-role-super').checked;

      if(!rolename || !password) {
        Swal.fire('Aviso', 'Nome e senha são obrigatórios!', 'warning');
        return;
      }

      try {
        const btn = document.getElementById('btn-save-role');
        const oldText = btn.textContent;
        btn.textContent = 'Salvando...';
        btn.disabled = true;

        const res = await fetch(`${BASE_URL}/api/security/create-role`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          credentials: 'include',
          body: JSON.stringify({ rolename, password, is_superuser: isSuper })
        });
        const data = await res.json();
        
        btn.textContent = oldText;
        btn.disabled = false;

        if(data.success) {
          Swal.fire('Sucesso!', 'Usuário criado com sucesso!', 'success');
          const modalEl = document.getElementById('modal-create-role');
          const modal = bootstrap.Modal.getInstance(modalEl);
          if(modal) modal.hide();
          document.getElementById('form-create-role').reset();
        } else {
          Swal.fire('Erro', data.message, 'error');
        }
      } catch(e) {
        Swal.fire('Erro', 'Erro de conexão ao criar usuário.', 'error');
      }
    });
  }

  connectSocket() {
    this.socket = io(BASE_URL, { withCredentials: true, transports: ['polling'] });

    this.socket.on('connect', () => {
      console.log('Segurança connected to backend WebSockets');
    });

    this.socket.on('security_update', (data) => {
      this.lastSessions = data.sessions || [];
      // Top Cards
      const rolesText = document.getElementById('sec-roles-text');
      if (rolesText) rolesText.textContent = data.roles_count || '--';

      // Calcula as ativas vs ociosas
      // Usando os dados reais absolutos do backend (não mais limitados aos 15 da tabela)
      const maxConn = data.max_connections || 100;
      const reaisAtivas = data.real_active !== undefined ? data.real_active : 0;
      const reaisOciosas = data.real_idle !== undefined ? data.real_idle : 0;
      const reaisOciosasTx = data.real_idle_in_tx !== undefined ? data.real_idle_in_tx : 0;

      const sessionsText = document.getElementById('sec-sessions-text');
      if (sessionsText) {
        sessionsText.innerHTML = `${reaisAtivas} <span class="fs-6 text-muted fw-normal">/ ${maxConn} max</span>`;
      }
      
      const progresso = document.getElementById('sec-sessions-progress');
      if (progresso) {
        let pct = (reaisAtivas / maxConn) * 100;
        if (pct > 100) pct = 100;
        progresso.style.width = `${pct}%`;
        if (pct > 80) progresso.classList.replace('bg-success', 'bg-danger');
        else progresso.classList.replace('bg-danger', 'bg-success');
      }

      const idleText = document.getElementById('sec-idle-text');
      if (idleText) idleText.textContent = reaisOciosas;

      const txBadge = document.getElementById('sec-idle-tx-badge');
      if (txBadge) {
        if (reaisOciosasTx > 0) {
          txBadge.textContent = `${reaisOciosasTx} em transação!`;
          txBadge.classList.remove('d-none');
        } else {
          txBadge.classList.add('d-none');
        }
      }

      // Tabela de Sessões Ativas
      const sessionsBody = document.getElementById('sec-sessions-body');
      if (sessionsBody && data.sessions) {
        sessionsBody.innerHTML = '';
        if (data.sessions.length === 0) {
          sessionsBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">Nenhuma sessão ativa encontrada.</td></tr>`;
        } else {
          data.sessions.forEach(s => {
            const tr = document.createElement('tr');
            
            // Formatando o badge de status
            let statusBadge = `<span class="badge bg-secondary">${s.state}</span>`;
            if (s.state === 'active') statusBadge = `<span class="badge bg-success">Ativa</span>`;
            else if (s.state === 'idle') statusBadge = `<span class="badge bg-warning text-dark">Ociosa</span>`;
            else if (s.state === 'idle in transaction') statusBadge = `<span class="badge bg-danger">Ociosa em Transação</span>`;

            // Formatando a data
            let dataInicio = 'Desconhecido';
            if (s.backend_start) {
              const d = new Date(s.backend_start);
              dataInicio = d.toLocaleString('pt-BR');
            }

            tr.innerHTML = `
              <td class="px-3 text-muted small">${s.pid}</td>
              <td class="fw-bold">${s.usename || 'N/A'}</td>
              <td class="text-muted">${s.client_addr || 'Local/Interno'}</td>
              <td class="small">${s.application_name || 'Desconhecido'}</td>
              <td>${statusBadge}</td>
              <td class="small text-muted">${dataInicio}</td>
              <td class="w-25">
                <div class="p-1 bg-light rounded text-truncate user-select-all" style="font-family: monospace; font-size: 0.75rem; max-width: 250px;" title="${s.query || ''}">
                  ${s.query || 'Nenhuma query rodando'}
                </div>
              </td>
            `;
            sessionsBody.appendChild(tr);
          });
        }
      }

      // Tabela de Roles (Auditoria)
      const rolesBody = document.getElementById('sec-roles-body');
      if (rolesBody && data.roles) {
        rolesBody.innerHTML = '';
        if (data.roles.length === 0) {
          rolesBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Nenhum usuário encontrado.</td></tr>`;
        } else {
          data.roles.forEach(r => {
            const tr = document.createElement('tr');
            
            const checkIcon = `<span class="text-success fw-bold">✓ Sim</span>`;
            const crossIcon = `<span class="text-muted">✗ Não</span>`;

            tr.innerHTML = `
              <td class="px-3 fw-bold text-primary">${r.rolname}</td>
              <td class="text-center">${r.rolsuper ? checkIcon : crossIcon}</td>
              <td class="text-center">${r.rolcreatedb ? checkIcon : crossIcon}</td>
              <td class="text-center">${r.rolcreaterole ? checkIcon : crossIcon}</td>
              <td class="text-center">${r.rolcanlogin ? checkIcon : crossIcon}</td>
              <td class="text-center text-muted">${r.rolconnlimit === -1 ? 'Ilimitado' : r.rolconnlimit}</td>
            `;
            rolesBody.appendChild(tr);
          });
        }
      }
    });
  }

  destroy() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
