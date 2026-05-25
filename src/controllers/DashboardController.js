import Swal from 'sweetalert2';
import Chart from 'chart.js/auto';
import _ from 'lodash';
import { io } from 'socket.io-client';
import { BASE_URL } from '../config/api.js';
import { icones } from '../js/utils.js';

export default class DashboardController {
  async init() {
    this.injectIcons();
    this.currentChartType = 'bar';
    this.connectSocket();
    await this.loadInitialData();
  }

  injectIcons() {
    document.querySelectorAll('.icone-pontos').forEach(el => el.innerHTML = icones.pontos);
    document.querySelectorAll('.icone-performance').forEach(el => el.innerHTML = icones.performance);
    document.querySelectorAll('.icone-disco-card').forEach(el => el.innerHTML = icones.database);
    document.querySelectorAll('.icone-ativos').forEach(el => el.innerHTML = icones.ativos);
    document.querySelectorAll('.icone-arquivos').forEach(el => el.innerHTML = icones.arquivos);
  }

  connectSocket() {
    this.socket = io(BASE_URL, { withCredentials: true, transports: ['polling'] });
    
    this.socket.on('connect', () => {
      console.log('Dashboard connected to backend WebSockets');
    });

    this.socket.on('metrics_update', (data) => {
      // Atualiza os cartões de estatísticas no DOM dinamicamente
      const perfEl = document.getElementById('dash-performance');
      if (perfEl) perfEl.textContent = data.uptime;

      const perfSubEl = document.getElementById('dash-performance-sub');
      if (perfSubEl && data.db_version) perfSubEl.textContent = data.db_version;

      const discoEl = document.getElementById('dash-disco');
      if (discoEl) discoEl.textContent = data.db_size;

      const connEl = document.getElementById('dash-servidores');
      if (connEl) connEl.textContent = data.conns;

      const connSubEl = document.getElementById('dash-servidores-sub');
      if (connSubEl) connSubEl.textContent = `Max: ${data.max_conns || 100}`;

      const backupsEl = document.getElementById('dash-backups');
      if (backupsEl) backupsEl.textContent = data.backups_count;

      const backupsSubEl = document.getElementById('dash-backups-sub');
      if (backupsSubEl) backupsSubEl.textContent = `Espaço: ${data.backups_size || '0.00 KB'}`;

      // Popula os eventos do banco de dados dinamicamente com base no histórico de eventos reais do backend
      const eventsContainer = document.getElementById('database-events-container');
      if (eventsContainer) {
        eventsContainer.innerHTML = '';
        if (data.event_history && data.event_history.length > 0) {
          // Exibe do mais recente para o mais antigo no container lateral do dashboard
          const reversedEvents = [...data.event_history].reverse();
          reversedEvents.forEach(ev => {
            const evDiv = document.createElement('div');
            
            let borderClass = 'border-primary';
            let bgClass = 'bg-primary';
            let title = 'Informação';
            let cleanMsg = ev.message;
            
            if (ev.message.startsWith('SUCESSO:')) {
              borderClass = 'border-success';
              bgClass = 'bg-success';
              title = 'Sucesso';
              cleanMsg = ev.message.replace('SUCESSO:', '').trim();
            } else if (ev.message.startsWith('INFO:')) {
              borderClass = 'border-info';
              bgClass = 'bg-info';
              title = 'Info';
              cleanMsg = ev.message.replace('INFO:', '').trim();
            } else if (ev.message.startsWith('AVISO:')) {
              borderClass = 'border-warning';
              bgClass = 'bg-warning';
              title = 'Aviso';
              cleanMsg = ev.message.replace('AVISO:', '').trim();
            } else if (ev.message.startsWith('ERRO:')) {
              borderClass = 'border-danger';
              bgClass = 'bg-danger';
              title = 'Erro';
              cleanMsg = ev.message.replace('ERRO:', '').trim();
            }
            
            evDiv.className = `p-3 ${bgClass} bg-opacity-10 border-start ${borderClass} border-3 rounded-end`;
            evDiv.innerHTML = `
              <div class="fw-bold small d-flex justify-content-between">
                <span>${title}</span>
                <span class="text-muted smaller fw-normal" style="font-size: 0.7rem;">${ev.time}</span>
              </div>
              <div class="smaller text-muted mt-1" style="font-size: 0.75rem;">${cleanMsg}</div>
            `;
            eventsContainer.appendChild(evDiv);
          });
        } else {
          eventsContainer.innerHTML = `
            <div class="p-3 bg-secondary bg-opacity-10 border-start border-secondary border-3 rounded-end">
              <div class="fw-bold small">Nenhum Evento</div>
              <div class="smaller text-muted" style="font-size: 0.75rem;">Aguardando novos eventos do banco...</div>
            </div>
          `;
        }
      }

      // Renderiza o gráfico dinamicamente com base no QPM atual
      this.renderChart(data.qpm, this.currentChartType);
      this.bindChartEvents(data.qpm);
    });
  }

  async loadInitialData() {
    // Exibe dados estáticos iniciais enquanto aguarda a primeira emissão do Socket.IO
    const inicialQPM = [
      { tempo: '--', qtd: 0 },
      { tempo: '--', qtd: 0 },
      { tempo: '--', qtd: 0 },
      { tempo: '--', qtd: 0 },
      { tempo: '--', qtd: 0 }
    ];

    document.getElementById('dash-performance').textContent = '--';
    const discoEl = document.getElementById('dash-disco');
    if (discoEl) discoEl.textContent = '--';
    document.getElementById('dash-servidores').textContent = '--';
    document.getElementById('dash-backups').textContent = '--';

    this.renderChart(inicialQPM, this.currentChartType);
    this.bindChartEvents(inicialQPM);
    this.bindStressTestEvent();
    this.bindDropdownEvents();
  }

  bindDropdownEvents() {
    // Salva referência das últimas métricas recebidas para uso nos modais
    this.lastMetrics = {};
    
    // Armazena as métricas mais recentes recebidas pelo socket
    this.socket.on('metrics_update', (data) => {
      this.lastMetrics = data;
    });

    // Botão "Ver Log" - mostra um modal com os eventos
    document.getElementById('btn-dash-ver-log')?.addEventListener('click', () => {
      const container = document.getElementById('database-events-container');
      if (container) {
        Swal.fire({
          title: 'Últimos Eventos',
          html: `<div class="text-start" style="max-height: 400px; overflow-y: auto;">${container.innerHTML}</div>`,
          icon: 'info',
          confirmButtonColor: '#dc3545',
          width: 600
        });
      }
    });

    // Botão "Ver Detalhes de Disco"
    document.getElementById('btn-dash-ver-disco')?.addEventListener('click', () => {
      const m = this.lastMetrics;
      Swal.fire({
        title: 'Detalhes de Armazenamento',
        html: `
          <div class="text-start">
            <p><strong>Tamanho do Banco:</strong> ${m.db_size || '--'}</p>
            <p><strong>Disco Total:</strong> ${m.disk_total || '--'}</p>
            <p><strong>Disco Usado:</strong> ${m.disk_used || '--'} (${m.disk_pct || 0}%)</p>
            <p><strong>Backups:</strong> ${m.backups_count || 0} arquivo(s) - ${m.backups_size || '0 KB'}</p>
          </div>
        `,
        icon: 'info',
        confirmButtonColor: '#dc3545'
      });
    });

    // Botão "Derrubar Ociosas" 
    document.getElementById('btn-dash-derrubar-ociosas')?.addEventListener('click', async () => {
      const result = await Swal.fire({
        title: 'Derrubar Conexões Ociosas?',
        text: 'Todas as conexões dormindo no banco serão encerradas. Esta ação não pode ser desfeita.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sim, derrubar!'
      });
      if (result.isConfirmed) {
        try {
          const res = await fetch(`${BASE_URL}/api/security/kill-idle`, { method: 'POST', credentials: 'include' });
          const data = await res.json();
          if (data.success) Swal.fire('Sucesso!', data.message, 'success');
          else Swal.fire('Erro', data.message, 'error');
        } catch(e) { Swal.fire('Erro', 'Erro de conexão.', 'error'); }
      }
    });

    // Botão "Histórico de Backups"
    document.getElementById('btn-dash-historico-backups')?.addEventListener('click', async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/backups`, { credentials: 'include' });
        const data = await res.json();
        if (data.success && data.backups.length > 0) {
          let html = '<div class="text-start"><table class="table table-sm"><thead><tr><th>Arquivo</th><th>Tamanho</th></tr></thead><tbody>';
          data.backups.forEach(b => {
            html += `<tr><td class="small">${b.filename}</td><td class="small">${b.size}</td></tr>`;
          });
          html += '</tbody></table></div>';
          Swal.fire({ title: 'Histórico de Backups', html, confirmButtonColor: '#dc3545', width: 600 });
        } else {
          Swal.fire('Histórico', 'Nenhum backup encontrado ainda.', 'info');
        }
      } catch(e) { Swal.fire('Erro', 'Erro ao buscar histórico.', 'error'); }
    });

    // Botão "Exportar Dados" (no dropdown do gráfico QPM)
    const btnExport = document.querySelector('#btn-stress-test')?.closest('ul')?.querySelector('.dropdown-item:nth-child(2)');
    if (btnExport && !btnExport.id) {
      btnExport.id = 'btn-dash-exportar-dados';
      btnExport.addEventListener('click', () => {
        const m = this.lastMetrics;
        if (!m || !m.qpm) {
          Swal.fire('Aviso', 'Nenhum dado disponível para exportar ainda.', 'info');
          return;
        }
        let csv = 'Tempo,QPM\\n';
        m.qpm.forEach(q => { csv += `${q.tempo},${q.qtd}\\n`; });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cerberus_qpm_${new Date().getTime()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      });
    }
  }

  bindStressTestEvent() {
    const btnStress = document.getElementById('btn-stress-test');
    if (btnStress) {
      btnStress.addEventListener('click', async () => {
        const originalText = btnStress.innerHTML;
        btnStress.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Disparando...';
        btnStress.disabled = true;

        try {
          const res = await fetch(`${BASE_URL}/api/stress-test`, { method: 'POST', credentials: 'include' });
          const data = await res.json();
          if(data.success) {
            Swal.fire({
              title: 'Tiroteio Finalizado!',
              text: '500 queries foram disparadas no banco. Aguarde alguns segundos para ver o gráfico subir (QPM atualiza a cada minuto).',
              icon: 'success',
              timer: 3000,
              showConfirmButton: false
            });
          } else {
            Swal.fire('Erro', data.message || 'Falha no teste', 'error');
          }
        } catch(e) {
          Swal.fire('Erro', 'Erro de conexão no teste de estresse.', 'error');
        } finally {
          btnStress.innerHTML = originalText;
          btnStress.disabled = false;
        }
      });
    }
  }

  // Renderiza o gráfico com base no histórico e tipo especificados usando Chart.js
  renderChart(historico, type) {
    const labelsGrafico = _.map(historico, 'tempo');
    const dadosGrafico = _.map(historico, 'qtd');

    const ctx = document.getElementById('graficoDistribuicao');
    if (ctx) {
      if (this.chart) this.chart.destroy();
      
      const config = {
        type: type,
        data: {
          labels: labelsGrafico,
          datasets: [{
            label: 'Consultas/minuto',
            data: dadosGrafico,
            backgroundColor: ['#dc3545', '#e11d48', '#be123c', '#9f1239', '#881337'],
            borderColor: '#dc3545',
            tension: 0.3,
            fill: type === 'line' ? true : false,
            borderRadius: type === 'bar' ? 4 : 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { 
              beginAtZero: true, 
              grid: { display: false },
              display: type !== 'doughnut'
            },
            x: { 
              grid: { display: false },
              display: type !== 'doughnut'
            }
          }
        }
      };
      this.chart = new Chart(ctx, config);
    }
  }

  // Associa os eventos de clique aos botões de alternância de gráfico
  bindChartEvents(historico) {
    document.querySelectorAll('.btn-mudar-grafico').forEach(btn => {
      // Evita duplicar listeners limpando e adicionando novamente
      btn.replaceWith(btn.cloneNode(true));
    });

    document.querySelectorAll('.btn-mudar-grafico').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const novoTipo = e.currentTarget.getAttribute('data-tipo');
        this.currentChartType = novoTipo;
        this.renderChart(historico, novoTipo);
      });
    });
  }

  // Fecha o socket ao destruir/mudar de rota
  destroy() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
