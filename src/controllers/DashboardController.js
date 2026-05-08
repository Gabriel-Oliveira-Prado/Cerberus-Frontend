import Chart from 'chart.js/auto';
import _ from 'lodash';

import { icones } from '../js/utils.js';

export default class DashboardController {
  async init() {
    this.injectIcons();
    await this.loadData();
  }

  injectIcons() {
    document.querySelectorAll('.icone-pontos').forEach(el => el.innerHTML = icones.pontos);
    document.querySelectorAll('.icone-performance').forEach(el => el.innerHTML = icones.performance);
    document.querySelectorAll('.icone-sucesso').forEach(el => el.innerHTML = icones.sucesso);
    document.querySelectorAll('.icone-ativos').forEach(el => el.innerHTML = icones.ativos);
    document.querySelectorAll('.icone-arquivos').forEach(el => el.innerHTML = icones.arquivos);
  }

  async loadData() {
    let estatisticas = {};
    try {
      const respostaSimulada = {
        data: {
          uptime: '15d 4h',
          cacheHit: 98.4,
          conexoesAtivas: 142,
          totalBackups: 1284,
          historicoQPM: [
            { tempo: '10:00', qtd: 4500 },
            { tempo: '10:15', qtd: 3200 },
            { tempo: '10:30', qtd: 5000 },
            { tempo: '10:45', qtd: 8200 },
            { tempo: '11:00', qtd: 4100 }
          ]
        }
      };
      
      await new Promise(res => setTimeout(res, 500));
      estatisticas = respostaSimulada.data;
      
      document.getElementById('dash-performance').textContent = estatisticas.uptime;
      document.getElementById('dash-sucesso').textContent = estatisticas.cacheHit + '%';
      document.getElementById('dash-servidores').textContent = estatisticas.conexoesAtivas;
      document.getElementById('dash-backups').textContent = estatisticas.totalBackups;

      this.renderChart(estatisticas.historicoQPM, 'bar');
      this.bindChartEvents(estatisticas.historicoQPM);
      
    } catch (erro) {
      console.error(erro);
    }
  }

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

  bindChartEvents(historico) {
    document.querySelectorAll('.btn-mudar-grafico').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const novoTipo = e.currentTarget.getAttribute('data-tipo');
        if (this.chart) {
          this.renderChart(historico, novoTipo);
        }
      });
    });
  }
}
