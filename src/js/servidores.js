import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '../css/estilos.css';
import { carregarDados, icones } from './comum.js';

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('container-conteudo');
  
  const menuOpcoes = `
    <div class="dropdown menu-opcoes-cartao">
      <div data-bs-toggle="dropdown" aria-expanded="false">
        ${icones.pontos}
      </div>
      <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0">
        <li><button class="dropdown-item small" type="button">Ver Métricas</button></li>
        <li><button class="dropdown-item small text-danger" type="button">Reiniciar Serviço</button></li>
      </ul>
    </div>
  `;

  const htmlFinal = `
    <div class="row g-4 mb-5 fade-in">
      <div class="col-md-4">
        <div class="cartao h-100 border-top border-danger border-4">
          ${menuOpcoes}
          <div class="d-flex justify-content-between align-items-start mb-3">
            <h4 class="h6 fw-bold m-0">SRV-DATABASE-01</h4>
            <span class="text-success smaller bg-success-subtle px-2 py-1 rounded" style="font-size: 0.7rem;">● Ativo</span>
          </div>
          <div class="d-flex flex-column gap-2">
            <div class="d-flex justify-content-between small text-muted">
              <span>CPU</span><span>24%</span>
            </div>
            <div class="progress" style="height: 6px;">
              <div class="progress-bar bg-danger" style="width: 24%"></div>
            </div>
            <div class="d-flex justify-content-between small text-muted mt-2">
              <span>Memória</span><span>8.4 GB / 32 GB</span>
            </div>
            <div class="progress" style="height: 6px;">
              <div class="progress-bar bg-danger" style="width: 26%"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-md-4">
        <div class="cartao h-100 border-top border-danger border-4">
          ${menuOpcoes}
          <div class="d-flex justify-content-between align-items-start mb-3">
            <h4 class="h6 fw-bold m-0">SRV-STORAGE-02</h4>
            <span class="text-success smaller bg-success-subtle px-2 py-1 rounded" style="font-size: 0.7rem;">● Ativo</span>
          </div>
          <div class="d-flex flex-column gap-2">
            <div class="d-flex justify-content-between small text-muted">
              <span>Uso de Disco</span><span>78%</span>
            </div>
            <div class="progress" style="height: 6px;">
              <div class="progress-bar bg-danger" style="width: 78%"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <div class="cartao h-100 border-top border-warning border-4">
          ${menuOpcoes}
          <div class="d-flex justify-content-between align-items-start mb-3">
            <h4 class="h6 fw-bold m-0">SRV-WEBSERVICE-04</h4>
            <span class="text-warning smaller bg-warning-subtle px-2 py-1 rounded" style="font-size: 0.7rem;">● Carga Alta</span>
          </div>
          <div class="d-flex flex-column gap-2">
            <div class="d-flex justify-content-between small text-muted">
              <span>CPU</span><span>92%</span>
            </div>
            <div class="progress" style="height: 6px;">
              <div class="progress-bar bg-warning" style="width: 92%"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="cartao fade-in">
      ${menuOpcoes}
      <h3 class="h5 mb-4">Monitoramento do Banco de Dados</h3>
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead class="bg-light">
            <tr class="text-muted small">
              <th class="border-0">Nome do BD</th>
              <th class="border-0">Motor</th>
              <th class="border-0">Conexões</th>
              <th class="border-0">Latência</th>
              <th class="border-0">Uptime</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="fw-bold">DataGuard_Core</td>
              <td>PostgreSQL 15</td>
              <td>124 ativas</td>
              <td>12ms</td>
              <td>15d 4h</td>
            </tr>
            <tr>
              <td class="fw-bold">Auth_Store</td>
              <td>Redis 7.0</td>
              <td>2.450 ativas</td>
              <td>1ms</td>
              <td>42d 18h</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  await carregarDados(container, htmlFinal, 800);
});
