import Swal from 'sweetalert2';
import Chart from 'chart.js/auto';
import { io } from 'socket.io-client';
import { BASE_URL } from '../config/api.js';

export default class DashboardController {
  async init() {
    this.currentChartType = 'line';
    this.lastMetrics = null;
    this.lastQpm = [];
    this.bindEvents();
    this.renderChart([]);
    this.connectSocket();
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
      const button = document.getElementById('btn-dashboard-reconectar');
      if (button) {
        button.disabled = false;
        button.textContent = 'Atualizar dados';
      }
    });

    this.socket.on('connect_error', () => {
      const description = document.getElementById('dash-chart-description');
      if (description) description.textContent = 'Não foi possível atualizar a série de consultas agora.';
    });

    this.socket.on('metrics_update', (data) => {
      this.lastMetrics = data;
      this.lastQpm = Array.isArray(data.qpm) ? data.qpm : [];
      this.updateMetrics(data);
      this.renderEvents(data.event_history || []);
      this.renderChart(this.lastQpm);
    });
  }

  updateMetrics(data) {
    this.setText('dash-performance', data.uptime || 'Indisponível');
    this.setText('dash-performance-sub', data.db_version || 'Versão não informada');
    this.setText('dash-disco', data.db_size || 'Indisponível');
    this.setText('dash-disco-sub', 'Tamanho físico informado pelo banco');
    this.setText('dash-servidores', data.conns ?? 'Indisponível');
    this.setText('dash-servidores-sub', `Limite: ${data.max_conns ?? 'não informado'}`);
    this.setText('dash-backups', data.backups_count ?? 0);
    this.setText('dash-backups-sub', `Espaço: ${data.backups_size || '0 KB'}`);

    const description = document.getElementById('dash-chart-description');
    if (description) {
      description.textContent = this.lastQpm.length
        ? 'Série temporal da coleta mais recente.'
        : 'Ainda não há uma janela completa de consultas.';
    }
  }

  setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = String(value);
  }

  renderEvents(events) {
    const container = document.getElementById('database-events-container');
    if (!container) return;
    container.replaceChildren();

    if (!events.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'Nenhum evento foi informado pelo banco.';
      container.appendChild(empty);
      return;
    }

    [...events].reverse().forEach((event) => {
      const item = document.createElement('div');
      item.className = 'activity-item';

      const parsed = this.parseEvent(event.message || '');
      const level = document.createElement('span');
      level.className = 'activity-level';
      level.dataset.level = parsed.level;
      level.textContent = parsed.label;

      const message = document.createElement('span');
      message.className = 'activity-message';
      message.textContent = parsed.message;

      const time = document.createElement('time');
      time.className = 'activity-time';
      time.textContent = event.time || '';

      item.append(level, message, time);
      container.appendChild(item);
    });
  }

  parseEvent(rawMessage) {
    const match = rawMessage.match(/^(SUCESSO|INFO|AVISO|ERRO):\s*(.*)$/i);
    if (!match) return { level: 'info', label: 'Info', message: rawMessage };

    const levelMap = {
      SUCESSO: ['sucesso', 'Sucesso'],
      INFO: ['info', 'Info'],
      AVISO: ['aviso', 'Aviso'],
      ERRO: ['erro', 'Erro']
    };
    const [level, label] = levelMap[match[1].toUpperCase()];
    return { level, label, message: match[2] };
  }

  bindEvents() {
    document.getElementById('btn-dash-ver-disco')?.addEventListener('click', this.showDiskDetails);
    document.getElementById('btn-dash-abrir-sessoes')?.addEventListener('click', () => this.navigate('/seguranca'));
    document.getElementById('btn-dash-historico-backups')?.addEventListener('click', () => this.navigate('/backups'));
    document.getElementById('btn-dash-exportar-dados')?.addEventListener('click', this.exportQpm);
    document.getElementById('btn-dashboard-reconectar')?.addEventListener('click', this.reconnect);
    document.getElementById('select-chart-type')?.addEventListener('change', this.changeChartType);
  }

  showDiskDetails = async () => {
    if (!this.lastMetrics) {
      await Swal.fire({
        title: 'Dados ainda não recebidos',
        text: 'Aguarde a primeira leitura do banco.',
        icon: 'info',
        confirmButtonColor: '#dc3545'
      });
      return;
    }

    const metrics = this.lastMetrics;
    const lines = [
      `Banco: ${metrics.db_size || 'não informado'}`,
      `Disco total: ${metrics.disk_total || 'não informado'}`,
      `Disco usado: ${metrics.disk_used || 'não informado'}`,
      `Uso percentual: ${metrics.disk_pct ?? 'não informado'}%`,
      `Backups: ${metrics.backups_count ?? 0} arquivo(s), ${metrics.backups_size || '0 KB'}`
    ];

    await Swal.fire({
      title: 'Armazenamento',
      text: lines.join('\n'),
      icon: 'info',
      confirmButtonColor: '#dc3545'
    });
  };

  navigate(path) {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  exportQpm = async () => {
    if (!this.lastQpm.length) {
      await Swal.fire({
        title: 'Sem dados para exportar',
        text: 'Aguarde o recebimento da série de consultas.',
        icon: 'info',
        confirmButtonColor: '#dc3545'
      });
      return;
    }

    const rows = ['Tempo;Consultas por minuto'];
    this.lastQpm.forEach((point) => {
      rows.push(`${this.csvValue(point.tempo)};${this.csvValue(point.qtd)}`);
    });
    this.downloadText(rows.join('\n'), `cerberus-qpm-${Date.now()}.csv`, 'text/csv;charset=utf-8');
  };

  csvValue(value) {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
  }

  downloadText(content, filename, type) {
    const blob = new Blob(['\ufeff', content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  reconnect = () => {
    const button = document.getElementById('btn-dashboard-reconectar');
    if (button) {
      button.disabled = true;
      button.textContent = 'Reconectando';
    }
    this.connectSocket();
  };

  changeChartType = (event) => {
    this.currentChartType = event.target.value === 'bar' ? 'bar' : 'line';
    this.renderChart(this.lastQpm);
  };

  renderChart(history) {
    const canvas = document.getElementById('graficoDistribuicao');
    if (!canvas) return;

    this.chart?.destroy();

    const labels = history.map((point) => point.tempo);
    const values = history.map((point) => Number(point.qtd) || 0);

    this.chart = new Chart(canvas, {
      type: this.currentChartType,
      data: {
        labels,
        datasets: [{
          label: 'Consultas por minuto',
          data: values,
          backgroundColor: '#dc3545',
          borderColor: '#dc3545',
          borderWidth: 2,
          pointRadius: this.currentChartType === 'line' ? 2 : 0,
          tension: 0,
          fill: false,
          borderRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: history.length > 0 }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#5f6b7a' }
          },
          y: {
            beginAtZero: true,
            grid: { color: '#cbd3dc' },
            ticks: { color: '#5f6b7a', precision: 0 }
          }
        }
      }
    });
  }

  destroy() {
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.chart?.destroy();
  }
}
