import { io } from 'socket.io-client';
import { BASE_URL } from '../config/api.js';
import { icones } from '../js/utils.js';

export default class ServidoresController {
  async init() {
    this.injectIcons();
    this.connectSocket();
  }

  injectIcons() {
    document.querySelectorAll('.icone-pontos').forEach(el => el.innerHTML = icones.pontos);
    document.querySelectorAll('.icone-cpu').forEach(el => el.innerHTML = icones.cpu);
    document.querySelectorAll('.icone-memoria').forEach(el => el.innerHTML = icones.memoria);
    document.querySelectorAll('.icone-disco').forEach(el => el.innerHTML = icones.disco);
    document.querySelectorAll('.icone-database').forEach(el => el.innerHTML = icones.database);
  }

  connectSocket() {
    this.socket = io(BASE_URL, { withCredentials: true, transports: ['polling'] });

    this.socket.on('connect', () => {
      console.log('Servidores connected to backend WebSockets');
    });

    this.socket.on('metrics_update', (data) => {
      // 1. Atualiza SRV-DATABASE-01 (Métricas de CPU e Memória)
      const srv1CpuText = document.getElementById('srv1-cpu-text');
      if (srv1CpuText) srv1CpuText.textContent = `${data.srv1.cpu}%`;

      const srv1CpuBar = document.getElementById('srv1-cpu-bar');
      if (srv1CpuBar) srv1CpuBar.style.width = `${data.srv1.cpu}%`;

      const srv1MemText = document.getElementById('srv1-mem-text');
      if (srv1MemText) srv1MemText.textContent = data.srv1.mem;

      const srv1MemBar = document.getElementById('srv1-mem-bar');
      if (srv1MemBar) srv1MemBar.style.width = `${data.srv1.mem_pct}%`;

      // 2. Atualiza SRV-STORAGE-02 (Uso de Disco real da máquina host)
      const srv2DiskText = document.getElementById('srv2-disk-text');
      if (srv2DiskText) srv2DiskText.textContent = `${data.disk_pct}%`;

      const srv2DiskBar = document.getElementById('srv2-disk-bar');
      if (srv2DiskBar) srv2DiskBar.style.width = `${data.disk_pct}%`;

      // 3. Atualiza SRV-WEBSERVICE-04 (CPU e status de Carga Alta)
      const srv4CpuText = document.getElementById('srv4-cpu-text');
      if (srv4CpuText) srv4CpuText.textContent = `${data.srv4.cpu}%`;

      const srv4CpuBar = document.getElementById('srv4-cpu-bar');
      if (srv4CpuBar) srv4CpuBar.style.width = `${data.srv4.cpu}%`;

      const srv4Badge = document.getElementById('srv4-badge');
      if (srv4Badge) {
        if (data.srv4.cpu > 90) {
          srv4Badge.className = 'text-danger smaller bg-danger-subtle px-2 py-1 rounded';
          srv4Badge.textContent = '● Sobrecarga';
        } else if (data.srv4.cpu > 60) {
          srv4Badge.className = 'text-warning smaller bg-warning-subtle px-2 py-1 rounded';
          srv4Badge.textContent = '● Carga Alta';
        } else {
          srv4Badge.className = 'text-success smaller bg-success-subtle px-2 py-1 rounded';
          srv4Badge.textContent = '● Saudável';
        }
      }

      // 4. Atualiza Monitoramento do Banco de Dados Geral
      const statusText = document.getElementById('db-status-text');
      if (statusText) {
        statusText.innerHTML = `● Online <span class="smaller fw-normal text-muted ms-1">(${data.uptime})</span>`;
      }

      const badgeName = document.getElementById('db-badge-name');
      if (badgeName && data.db_version) {
        badgeName.textContent = data.db_version;
      }

      const connsText = document.getElementById('db-conns-text');
      if (connsText) connsText.textContent = data.conns;

      const connsMax = document.getElementById('db-conns-max');
      if (connsMax) connsMax.textContent = data.max_conns || '100';

      const latencyText = document.getElementById('db-latency-text');
      if (latencyText) latencyText.textContent = data.latency;

      const latencyP99 = document.getElementById('db-latency-p99-text');
      if (latencyP99) latencyP99.textContent = data.latency_p99;

      const diskText = document.getElementById('db-disk-text');
      if (diskText) diskText.textContent = data.db_size;

      // 5. Atualiza Estatísticas de Disco e I/O
      const diskVolumeText = document.getElementById('disk-volume-text');
      if (diskVolumeText) {
        diskVolumeText.textContent = `${data.disk_used} / ${data.disk_total} (${data.disk_pct}%)`;
      }

      const diskVolumeBar = document.getElementById('disk-volume-bar');
      if (diskVolumeBar) {
        diskVolumeBar.style.width = `${data.disk_pct}%`;
      }

      const ioText = document.getElementById('io-throughput-text');
      if (ioText) ioText.textContent = `${data.io.read} MB/s / ${data.io.write} MB/s`;

      const ioReadBar = document.getElementById('io-read-bar');
      if (ioReadBar) {
        // Normaliza de acordo com um máximo arbitrário de 30 MB/s
        const pctRead = Math.min((data.io.read / 30) * 100, 100);
        ioReadBar.style.width = `${pctRead * 0.75}%`; // Divide proporção com o write bar
      }

      const ioWriteBar = document.getElementById('io-write-bar');
      if (ioWriteBar) {
        const pctWrite = Math.min((data.io.write / 15) * 100, 100);
        ioWriteBar.style.width = `${pctWrite * 0.25}%`;
      }

      // 6. Atualiza tabela de Slow Queries
      const slowBody = document.getElementById('slow-queries-table-body');
      if (slowBody && data.slow_queries) {
        slowBody.innerHTML = '';
        if (data.slow_queries.length === 0) {
          slowBody.innerHTML = `<tr><td colspan="3" class="text-center text-muted small py-3">Nenhuma consulta lenta ativa no momento.</td></tr>`;
        } else {
          data.slow_queries.forEach(q => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td data-label="Consulta"><code class="small text-danger">${q.query}</code></td>
              <td data-label="Duração">${q.duration}</td>
              <td data-label="Chamadas">${q.calls}</td>
            `;
            slowBody.appendChild(tr);
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
