import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '../css/estilos.css';
import { carregarDados, icones } from './comum.js';
import Chart from 'chart.js/auto';
import _ from 'lodash';
import axios from 'axios';

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('container-conteudo');
  
  // HTML do menu 3 pontos
  const menuOpcoes = `
    <div class="dropdown menu-opcoes-cartao">
      <div data-bs-toggle="dropdown" aria-expanded="false">
        ${icones.pontos}
      </div>
      <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0">
        <li><button class="dropdown-item small" type="button">Exportar Dados</button></li>
        <li><button class="dropdown-item small" type="button">Atualizar</button></li>
      </ul>
    </div>
  `;

  // Simulando requisição via Axios
  let estatisticas = {};
  try {
    // Apenas simulação (substituir por API real)
    const respostaSimulada = {
      data: {
        performance: 98.4,
        sucesso: 100,
        servidoresAtivos: 12,
        totalBackups: 1284,
        servidoresHistorico: [
          { srv: 'SRV-01', qtd: 45 },
          { srv: 'SRV-02', qtd: 32 },
          { srv: 'SRV-03', qtd: 50 },
          { srv: 'SRV-04', qtd: 20 },
          { srv: 'SRV-05', qtd: 40 }
        ]
      }
    };
    estatisticas = respostaSimulada.data;
  } catch (erro) {
    console.error('Erro ao buscar dados:', erro);
  }

  // Usando Lodash para manipular dados
  const labelsGrafico = _.map(estatisticas.servidoresHistorico, 'srv');
  const dadosGrafico = _.map(estatisticas.servidoresHistorico, 'qtd');

  const htmlFinal = `
    <div class="row g-4 mb-4 fade-in">
      <div class="col-md-3">
        <div class="cartao h-100">
          ${menuOpcoes}
          <div class="text-muted small mb-1">Desempenho de Backup</div>
          <div class="h3 fw-bold text-danger">${estatisticas.performance}%</div>
          <div class="small text-success mt-2">↑ 2.1% desde a última semana</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="cartao h-100">
          ${menuOpcoes}
          <div class="text-muted small mb-1">Taxa de Sucesso</div>
          <div class="h3 fw-bold">${estatisticas.sucesso}%</div>
          <div class="small text-muted mt-2">Últimas 24 horas</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="cartao h-100">
          ${menuOpcoes}
          <div class="text-muted small mb-1">Servidores Ativos</div>
          <div class="h3 fw-bold">${estatisticas.servidoresAtivos} / 12</div>
          <div class="small text-success mt-2">Operacional</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="cartao h-100">
          ${menuOpcoes}
          <div class="text-muted small mb-1">Backups Realizados</div>
          <div class="h3 fw-bold">${estatisticas.totalBackups}</div>
          <div class="small text-muted mt-2">Armazenamento: 4.2 TB</div>
        </div>
      </div>
    </div>

    <div class="row g-4 fade-in">
      <div class="col-md-8">
        <div class="cartao h-100">
          ${menuOpcoes}
          <h3 class="h5 mb-4">Distribuição por Servidor</h3>
          <div style="height: 250px;">
            <canvas id="graficoDistribuicao"></canvas>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="cartao h-100">
          ${menuOpcoes}
          <h3 class="h5 mb-4">Eventos Críticos</h3>
          <div class="d-flex flex-column gap-3">
            <div class="p-3 bg-danger bg-opacity-10 border-start border-danger border-3 rounded-end">
              <div class="fw-bold small">Aviso de Espaço em Disco</div>
              <div class="smaller text-muted" style="font-size: 0.75rem;">Servidor SRV-04 atingindo 90% da capacidade</div>
            </div>
            <div class="p-3 bg-warning bg-opacity-10 border-start border-warning border-3 rounded-end">
              <div class="fw-bold small">Backup Atrasado</div>
              <div class="smaller text-muted" style="font-size: 0.75rem;">Backup do banco 'Arquivo' atrasado em 15min</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Substituir os skeletons pelo conteúdo real após delay
  await carregarDados(container, htmlFinal, 1000);

  // Inicializar Gráfico Chart.js
  const ctx = document.getElementById('graficoDistribuicao');
  if (ctx) {
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labelsGrafico,
        datasets: [{
          label: 'Backups Concluídos',
          data: dadosGrafico,
          backgroundColor: '#dc3545',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true, grid: { display: false } },
          x: { grid: { display: false } }
        }
      }
    });
  }
});
