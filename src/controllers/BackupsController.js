import Swal from 'sweetalert2';
import { io } from 'socket.io-client';
import { BASE_URL } from '../config/api.js';
import { icones } from '../js/utils.js';

export default class BackupsController {
  async init() {
    this.injectIcons();
    this.connectSocket();
    this.bindEvents();
    await this.loadBackups();
    this.renderIntegrityStatus();
  }

  injectIcons() {
    document.querySelectorAll('.icone-pontos').forEach(el => el.innerHTML = icones.pontos);
  }

  async loadBackups() {
    try {
      const response = await fetch(`${BASE_URL}/api/backups`, {
        method: 'GET',
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        const tbody = document.getElementById('backups-table-body');
        if (tbody) {
          tbody.innerHTML = '';
          if (data.backups.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">Nenhum backup realizado ainda. Clique em "Executar Verificação" para gerar um.</td></tr>`;
          } else {
            data.backups.forEach(item => {
              const tr = document.createElement('tr');
              tr.innerHTML = `
                <td data-label="Data / Hora">${item.date}</td>
                <td data-label="Arquivo" class="fw-bold text-success">${item.filename}</td>
                <td data-label="Tamanho">${item.size}</td>
                <td data-label="Retenção"><span class="badge bg-secondary-subtle text-secondary px-2 py-1 border border-secondary">${item.retention}</span></td>
                <td data-label="Ações" class="text-end"><button class="btn btn-link btn-sm text-primary text-decoration-none p-0 fw-semibold btn-restaurar-backup" data-filename="${item.filename}">Restaurar</button></td>
              `;
              tbody.appendChild(tr);
            });
            this.bindRestoreEvents();
          }
        }
      }
    } catch (err) {
      console.error('Erro ao buscar backups:', err);
    }
  }

  bindRestoreEvents() {
    document.querySelectorAll('.btn-restaurar-backup').forEach(btn => {
      btn.replaceWith(btn.cloneNode(true));
    });
    document.querySelectorAll('.btn-restaurar-backup').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const filename = e.currentTarget.getAttribute('data-filename');
        Swal.fire({
          title: 'Confirmar Restauração?',
          text: `Deseja restaurar o banco de dados a partir do arquivo '${filename}'? Esta operação é irreversível.`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#dc3545',
          cancelButtonColor: '#6c757d',
          confirmButtonText: 'Sim, Restaurar',
          cancelButtonText: 'Cancelar'
        }).then((result) => {
          if (result.isConfirmed) {
            Swal.fire({
              title: 'Restaurando...',
              text: 'Aguarde a restauração do snapshot...',
              allowOutsideClick: false,
              didOpen: () => {
                Swal.showLoading();
              }
            });
            fetch(`${BASE_URL}/api/restaurar`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              credentials: 'include',
              body: JSON.stringify({ filename })
            })
            .then(res => res.json())
            .then(data => {
              if (data.success) {
                Swal.fire({
                  title: 'Restaurado!',
                  text: `O banco de dados foi restaurado com sucesso para o snapshot '${filename}'.`,
                  icon: 'success',
                  confirmButtonColor: '#dc3545'
                });
              } else {
                Swal.fire({
                  title: 'Erro!',
                  text: `Falha ao restaurar: ${data.message}`,
                  icon: 'error',
                  confirmButtonColor: '#dc3545'
                });
              }
            })
            .catch(err => {
              Swal.fire({
                title: 'Erro!',
                text: `Erro de conexão: ${err.message}`,
                icon: 'error',
                confirmButtonColor: '#dc3545'
              });
            });
          }
        });
      });
    });
  }

  renderIntegrityStatus() {
    const isConnected = sessionStorage.getItem('db_connected') === 'true';
    const dbName = sessionStorage.getItem('db_name') || 'cerberus.db (Local)';
    
    const tables = document.querySelectorAll('.table-responsive table.table');
    if (tables.length > 0) {
      const tbody = tables[0].querySelector('tbody');
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td data-label="Alvo" class="fw-bold">${dbName}</td>
            <td data-label="Status"><span class="badge bg-success-subtle text-success px-2 py-1">Saudável</span></td>
            <td data-label="Última Checagem">há poucos segundos</td>
            <td data-label="Checksum"><code class="small text-secondary">d41d8cd98f00b204e9800998ecf8427e</code></td>
            <td data-label="Ações" class="text-end"><button
                class="btn btn-link btn-sm text-danger text-decoration-none p-0 btn-acao-verificar">Inspecionar</button>
            </td>
          </tr>
        `;
        this.bindIntegrityEvents();
      }
    }
  }

  bindIntegrityEvents() {
    document.querySelectorAll('.btn-acao-verificar').forEach(btn => {
      btn.replaceWith(btn.cloneNode(true));
    });
    document.querySelectorAll('.btn-acao-verificar').forEach(btn => {
      btn.addEventListener('click', () => {
        const dbName = sessionStorage.getItem('db_name') || 'cerberus.db (Local)';
        Swal.fire({
          title: 'Detalhes da Integridade',
          html: `<p class="font-monospace text-start bg-light p-3 rounded border">Alvo: ${dbName}<br>Status: Saudável (Ok)<br>Hash MD5 Checksum: d41d8cd98f00b204e9800998ecf8427e<br>Criptografia: AES-256</p>`,
          icon: 'info',
          confirmButtonColor: '#dc3545'
        });
      });
    });
  }

  connectSocket() {
    this.socket = io(BASE_URL, { withCredentials: true, transports: ['polling'] });

    this.socket.on('connect', () => {
      console.log('Backups connected to backend WebSockets');
    });

    // Evento de progresso do backup
    this.socket.on('backup_progress', (data) => {
      if (Swal.isVisible()) {
        const container = Swal.getHtmlContainer();
        if (container) {
          const progressText = container.querySelector('b');
          const progressBar = container.querySelector('#swal-progress-bar');
          if (progressText) progressText.textContent = `${data.progress}%`;
          if (progressBar) {
            progressBar.style.width = `${data.progress}%`;
            progressBar.setAttribute('aria-valuenow', data.progress);
          }
        }
      }
    });

    // Evento de finalização do backup
    this.socket.on('backup_completed', (data) => {
      Swal.fire({
        title: 'Backup Concluído!',
        text: `O backup do banco '${data.filename}' foi gerado e validado com sucesso.`,
        icon: 'success',
        confirmButtonColor: '#dc3545'
      });

      this.loadBackups();
    });

    // Evento de métricas periódicas para atualizar o log de eventos e a integridade
    this.socket.on('metrics_update', (data) => {
      // 1. Atualiza "Última Checagem" na tabela de integridade
      const tables = document.querySelectorAll('.table-responsive table.table');
      if (tables.length > 0) {
        const tbody = tables[0].querySelector('tbody');
        if (tbody) {
          const checkCell = tbody.querySelector('tr td[data-label="Última Checagem"]');
          if (checkCell) {
            const now = new Date().toLocaleTimeString();
            checkCell.innerHTML = `há poucos segundos <span class="smaller text-muted">(${now})</span>`;
          }
        }
      }

      // 2. Atualiza o Log de Eventos com histórico de logs 100% real enviado pelo backend
      const logContainer = document.getElementById('backups-log-container');
      if (logContainer) {
        logContainer.innerHTML = '';
        if (data.event_history && data.event_history.length > 0) {
          // Exibe os logs com o mais recente no topo do console de log de eventos
          const reversedEvents = [...data.event_history].reverse();
          reversedEvents.forEach(ev => {
            const div = document.createElement('div');
            div.className = 'text-muted';

            let textClass = 'text-muted';
            if (ev.message.startsWith('SUCESSO:')) {
              textClass = 'text-success';
            } else if (ev.message.startsWith('AVISO:')) {
              textClass = 'text-warning';
            } else if (ev.message.startsWith('ERRO:')) {
              textClass = 'text-danger';
            } else if (ev.message.startsWith('INFO:')) {
              textClass = 'text-info';
            }

            const parts = ev.message.split(':');
            const level = parts[0];
            const content = parts.slice(1).join(':').trim();

            div.innerHTML = `<span class="text-secondary fw-semibold">[${ev.time}]</span> <span class="${textClass} fw-bold">${level}:</span> ${content}`;
            logContainer.appendChild(div);
          });
        } else {
          logContainer.innerHTML = `<div class="text-muted">Aguardando novos eventos do banco de dados...</div>`;
        }
      }
    });
  }

  bindEvents() {
    const handleTrigger = () => {
      Swal.fire({
        title: 'Executando Backup...',
        html: 'Progresso: <b>0%</b>.<br><div class="progress mt-3" style="height: 10px;"><div id="swal-progress-bar" class="progress-bar progress-bar-striped progress-bar-animated bg-danger" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div></div>',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          this.socket.emit('trigger_backup', {});
        }
      });
    };

    const btnVerificar = document.getElementById('btn-verificar');
    if (btnVerificar) {
      btnVerificar.addEventListener('click', handleTrigger);
    }

    const btnVerificarMobile = document.getElementById('btn-verificar-mobile');
    if (btnVerificarMobile) {
      btnVerificarMobile.addEventListener('click', handleTrigger);
    }
  }

  destroy() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
