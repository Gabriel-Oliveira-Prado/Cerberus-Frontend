import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '../css/estilos.css';
import { carregarDados, icones } from './comum.js';
import Swal from 'sweetalert2';

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('container-conteudo');
  
  const menuOpcoes = `
    <div class="dropdown menu-opcoes-cartao">
      <div data-bs-toggle="dropdown" aria-expanded="false">
        ${icones.pontos}
      </div>
      <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0">
        <li><button class="dropdown-item small" type="button">Exportar Log</button></li>
        <li><button class="dropdown-item small" type="button">Detalhes</button></li>
      </ul>
    </div>
  `;

  const htmlFinal = `
    <div class="cartao mb-4 fade-in">
      ${menuOpcoes}
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h3 class="h5 m-0">Status de Integridade</h3>
        <button id="btn-verificar" class="btn btn-primary btn-sm px-3">Executar Verificação</button>
      </div>
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead class="bg-light">
            <tr class="text-muted small">
              <th class="border-0">Alvo</th>
              <th class="border-0">Status</th>
              <th class="border-0">Última Checagem</th>
              <th class="border-0">Checksum</th>
              <th class="border-0 text-end">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="fw-bold">Main_Production_DB</td>
              <td><span class="badge bg-success-subtle text-success px-2 py-1 border border-success-subtle">Saudável</span></td>
              <td>há 2 min</td>
              <td><code class="small text-secondary">f82a...9b11</code></td>
              <td class="text-end"><button class="btn btn-link btn-sm text-danger text-decoration-none p-0 btn-acao-verificar">Inspecionar</button></td>
            </tr>
            <tr>
              <td class="fw-bold">Assets_Cloud_Bucket</td>
              <td><span class="badge bg-success-subtle text-success px-2 py-1 border border-success-subtle">Saudável</span></td>
              <td>há 15 min</td>
              <td><code class="small text-secondary">3d21...cc04</code></td>
              <td class="text-end"><button class="btn btn-link btn-sm text-danger text-decoration-none p-0 btn-acao-verificar">Inspecionar</button></td>
            </tr>
            <tr>
              <td class="fw-bold">User_Data_Encrypted</td>
              <td><span class="badge bg-warning-subtle text-warning px-2 py-1 border border-warning-subtle">Aviso</span></td>
              <td>há 1 hora</td>
              <td><code class="small text-secondary">e192...77fa</code></td>
              <td class="text-end"><button class="btn btn-link btn-sm text-danger text-decoration-none p-0 btn-acao-verificar">Inspecionar</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="cartao fade-in">
      ${menuOpcoes}
      <h3 class="h5 mb-4">Log de Eventos</h3>
      <div class="d-flex flex-column gap-2 font-monospace" style="font-size: 0.85rem;">
        <div class="text-muted"><span class="text-success">[17:45:01]</span> SUCESSO: Job 'DailyFull' concluído (124.5 GB)</div>
        <div class="text-muted"><span class="text-success">[17:30:12]</span> INFO: Snapshot criado para 'Main_Production_DB'</div>
        <div class="text-muted"><span class="text-warning">[17:22:45]</span> RETENTIVA: Conexão perdida com SRV-04, reestabelecendo...</div>
        <div class="text-muted"><span class="text-success">[17:22:50]</span> INFO: Conexão reestabelecida com SRV-04</div>
        <div class="text-muted"><span class="text-danger">[17:01:04]</span> ERRO: Falha na validação do checksum para 'Legacy_Archive'</div>
      </div>
    </div>
  `;

  await carregarDados(container, htmlFinal, 800);

  // Lógica de botões com SweetAlert2
  const btnVerificar = document.getElementById('btn-verificar');
  if (btnVerificar) {
    btnVerificar.addEventListener('click', () => {
      Swal.fire({
        title: 'Verificação Iniciada',
        text: 'A varredura de integridade dos backups foi colocada na fila.',
        icon: 'success',
        confirmButtonColor: '#dc3545'
      });
    });
  }

  document.querySelectorAll('.btn-acao-verificar').forEach(btn => {
    btn.addEventListener('click', () => {
      Swal.fire({
        title: 'Detalhes do Checksum',
        html: '<p class="font-monospace text-start bg-light p-3 rounded border">Hash MD5: 8b1a9953c4611296a827abf8c47804d7<br>Tamanho: 12.4 GB<br>Criptografia: AES-256</p>',
        icon: 'info',
        confirmButtonColor: '#dc3545'
      });
    });
  });
});
